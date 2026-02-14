const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
require('dotenv').config();
const { generateHTML } = require('./core/generators/html');
const { generatePDF } = require('./core/generators/pdf');
const { getAllThemes, loadTheme } = require('./core/themes');
const { getAllColors, resolveColor, getAllColorDetails } = require('./core/colors');
const AnalyticsDatabase = require('./database/db');
const config = require('./config/config');
const { validatePhotoBase64 } = require('./core/utils/sanitizer');
const PdfClusterManager = require('./core/queue/PdfClusterManager');
const queueConfig = require('./config/queue');

const app = express();
const PORT = 8003;

// Prefix console output with ISO timestamps for clearer Docker logs
const formatLocalTimestamp = () => {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  const offsetMinutes = date.getTimezoneOffset();
  const offsetTotalMinutes = Math.abs(offsetMinutes);
  const offsetHours = pad(Math.floor(offsetTotalMinutes / 60));
  const offsetMins = pad(offsetTotalMinutes % 60);
  const offsetSign = offsetMinutes <= 0 ? '+' : '-';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ` +
    `${offsetSign}${offsetHours}:${offsetMins}`;
};

['log', 'warn', 'error', 'info', 'debug'].forEach(method => {
  const original = console[method];
  console[method] = (...args) => {
    original.call(console, `[${formatLocalTimestamp()}]`, ...args);
  };
});

const analyticsServerKey = process.env.ANALYTICS_SERVER_KEY || null;
const analyticsEnabled = Boolean(analyticsServerKey);
const analyticsDbPathOverride = process.env.ANALYTICS_DB_PATH
  ? path.resolve(process.env.ANALYTICS_DB_PATH)
  : null;

// Initialize analytics database only when fully configured
const analyticsDB = analyticsEnabled ? new AnalyticsDatabase(analyticsDbPathOverride) : null;

// Helper functions for analytics (defined before queue manager initialization)
const formatAnalyticsTimestamp = () => {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

function buildAnalyticsContext(req, providedMeta = {}, {
  themeName = null,
  colorName = null,
  showWatermark = false,
  enabledSections = {},
  customSectionNames = {}
} = {}) {
  const normalizedMeta = {
    selectedTheme: providedMeta?.selectedTheme || themeName || null,
    selectedColor: providedMeta?.selectedColor || colorName || null,
    selectedLayout: providedMeta?.layout || null,
    showWatermark: typeof providedMeta?.showWatermark === 'boolean'
      ? providedMeta.showWatermark
      : Boolean(
          providedMeta?.showWatermark !== undefined
            ? providedMeta.showWatermark
            : showWatermark
        ),
    enabledSections: providedMeta?.enabledSections || enabledSections || {},
    customSectionNames: providedMeta?.customSectionNames || customSectionNames || {}
  };

  const resolvedMode = providedMeta?.mode || null;
  const resolvedSourceUrl = providedMeta?.sourceUrl || req.get('referer') || req.get('origin') || null;

  console.log('[Analytics] buildAnalyticsContext - providedMeta.mode:', providedMeta?.mode, 'resolvedMode:', resolvedMode);

  return { normalizedMeta, resolvedMode, resolvedSourceUrl };
}

function recordExportAnalytics({ exportType, meta = {}, mode = null, sourceUrl = null }) {
  if (!analyticsEnabled || !analyticsDB) {
    return;
  }

  try {
    const sanitizedMeta = {
      selectedTheme: meta.selectedTheme || null,
      selectedColor: meta.selectedColor || null,
      selectedLayout: meta.selectedLayout || meta.layout || null,
      showWatermark: typeof meta.showWatermark === 'boolean'
        ? meta.showWatermark
        : Boolean(meta.showWatermark),
      enabledSections: meta.enabledSections || {},
      customSectionNames: meta.customSectionNames || {}
    };

    const finalMode = mode || meta.mode || null;
    console.log('[Analytics] recordExportAnalytics - mode param:', mode, 'meta.mode:', meta.mode, 'final mode:', finalMode);

    analyticsDB.insertExportAnalytics({
      meta: sanitizedMeta,
      exportType,
      timestamp: formatAnalyticsTimestamp(),
      version: config.version,
      url: sourceUrl || meta.sourceUrl || null,
      mode: finalMode
    });
  } catch (error) {
    console.error('[Analytics] Failed to record export:', error);
  }
}

// Initialize PDF cluster manager with analytics dependencies
const pdfClusterManager = new PdfClusterManager(queueConfig.queue, {
  config: config,
  analyticsDB: analyticsDB,
  analyticsEnabled: analyticsEnabled,
  buildAnalyticsContext: buildAnalyticsContext,
  recordExportAnalytics: recordExportAnalytics,
  formatAnalyticsTimestamp: formatAnalyticsTimestamp
});

const normalizeOrigin = (value) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
};

const extraOrigins = (process.env.ANALYTICS_ALLOWED_ORIGINS || '')
  .split(',')
  .map(value => value.trim())
  .filter(Boolean);

const allowedOrigins = new Set(
  [
    config.appUrl,
    process.env.APP_URL,
    process.env.ALLOWED_ANALYTICS_ORIGIN,
    'http://localhost:8003',
    'http://127.0.0.1:8003',
    ...extraOrigins
  ]
    .map(normalizeOrigin)
    .filter(Boolean)
);

if (analyticsEnabled) {
  console.log('[Analytics] Tracking ENABLED');
  if (analyticsDB && typeof analyticsDB.getDatabasePath === 'function') {
    console.log(`[Analytics] Database path: ${analyticsDB.getDatabasePath()}`);
  }
} else {
  console.warn('[Analytics] Tracking DISABLED - set ANALYTICS_SERVER_KEY to enable logging');
}

function isRequestFromApp(req) {
  const originHeader = normalizeOrigin(req.get('origin'));
  if (originHeader && allowedOrigins.has(originHeader)) {
    return true;
  }

  const referer = req.get('referer');
  if (referer) {
    const refererOrigin = normalizeOrigin(referer);
    if (refererOrigin && allowedOrigins.has(refererOrigin)) {
      return true;
    }
  }

  return false;
}

const corsOptionsDelegate = (req, callback) => {
  const origin = normalizeOrigin(req.header('Origin'));
  const analyticsRequest = req.path && req.path.startsWith('/api/analytics');

  if (!analyticsRequest) {
    return callback(null, { origin: true });
  }

  if (!origin || allowedOrigins.has(origin)) {
    return callback(null, { origin: true });
  }

  return callback(new Error('Not allowed by CORS'));
};

app.use(cors(corsOptionsDelegate));
app.use((err, req, res, next) => {
  if (err && err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS not allowed for this origin' });
  }
  return next(err);
});
const MAX_JSON_PAYLOAD_BYTES = config.limits?.maxResumeJsonBytes || (1 * 1024 * 1024);
const MAX_PHOTO_BASE64_BYTES = config.limits?.maxPhotoBase64Bytes || (1.5 * 1024 * 1024);

app.use(bodyParser.json({ limit: '2mb' }));

app.use((req, res, next) => {
  if (!req.path || !req.path.startsWith('/api')) {
    return next();
  }
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[API] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  return next();
});

// Cloudflare Turnstile validation middleware
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

async function validateTurnstile(req, res, next) {
  // Skip validation if Turnstile is disabled in config
  if (!config.turnstile.enabled) {
    console.log('[Turnstile] Bypassed (disabled in config)');
    return next();
  }

  const token = req.headers['x-turnstile-token'];

  if (!token) {
    console.warn('[Turnstile] Missing token');
    return res.status(403).json({ error: 'CAPTCHA verification required' });
  }

  if (!TURNSTILE_SECRET_KEY || TURNSTILE_SECRET_KEY === 'YOUR_SECRET_KEY_HERE') {
    console.error('[Turnstile] Secret key not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: TURNSTILE_SECRET_KEY,
        response: token
      })
    });

    const data = await response.json();

    if (!data.success) {
      console.warn('[Turnstile] Verification failed:', data['error-codes']);
      return res.status(403).json({ error: 'CAPTCHA verification failed' });
    }

    console.log('[Turnstile] Verification successful');
    next();
  } catch (error) {
    console.error('[Turnstile] Verification error:', error);
    return res.status(500).json({ error: 'CAPTCHA verification error' });
  }
}

// Disable caching for terms-and-conditions.html to always show latest changes
app.use((req, res, next) => {
  if (req.path === '/terms-and-conditions.html') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

function validatePayloadSize(payloadBytes, limitBytes, fieldName, res) {
  if (payloadBytes > limitBytes) {
    res.status(413).json({ error: `${fieldName} exceeds the maximum allowed size` });
    return false;
  }
  return true;
}

function validateResumePayload(resumeData, photoBase64, res) {
  const jsonString = JSON.stringify(resumeData || {});
  const jsonSize = Buffer.byteLength(jsonString, 'utf8');
  if (!validatePayloadSize(jsonSize, MAX_JSON_PAYLOAD_BYTES, 'Resume JSON', res)) {
    return false;
  }

  if (photoBase64) {
    const base64Length = photoBase64.length;
    const sizeInBytes = Math.floor(base64Length * 0.75);
    if (!validatePayloadSize(sizeInBytes, MAX_PHOTO_BASE64_BYTES, 'Photo', res)) {
      return false;
    }
  }

  return true;
}

function extractResumePayload(resumeData) {
  if (!resumeData || typeof resumeData !== 'object') {
    return {
      sanitizedResumeData: resumeData,
      metaFromPayload: {}
    };
  }

  if (!Object.prototype.hasOwnProperty.call(resumeData, '_meta')) {
    return {
      sanitizedResumeData: resumeData,
      metaFromPayload: {}
    };
  }

  const metaFromPayload = resumeData._meta || {};
  const sanitizedResumeData = { ...resumeData };
  delete sanitizedResumeData._meta;

  return {
    sanitizedResumeData,
    metaFromPayload
  };
}

app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));
app.use('/gallery', express.static(path.join(__dirname, 'public', 'gallery')));
app.get('/gallery', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'gallery', 'index.html'));
});

// API endpoint to get all available themes
app.get('/api/themes', (req, res) => {
  try {
    const themes = getAllThemes();
    const themeDetails = themes.map(themeName => {
      const theme = loadTheme(themeName);
      return {
        name: theme.name,
        monochromatic: theme.monochromatic
      };
    });
    res.json(themeDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to get all available colors
app.get('/api/colors', (req, res) => {
  try {
    const colors = getAllColorDetails();
    res.json(colors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to get example resume data
app.get('/api/example-data', async (req, res) => {
  try {
    const examplePath = path.join(__dirname, 'public', 'assets', 'resume-data-template.json');
    const data = await fs.readFile(examplePath, 'utf-8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to get gallery templates (dynamic - scans folders on each request)
app.get('/api/gallery/templates', async (req, res) => {
  try {
    const galleryPath = path.join(__dirname, 'public', 'gallery');

    // Read all directories in gallery folder
    const entries = await fs.readdir(galleryPath, { withFileTypes: true });

    // Filter for directories that start with numbers and sort them
    const folders = entries
      .filter(entry => entry.isDirectory() && /^\d+_/.test(entry.name))
      .map(entry => entry.name)
      .sort();

    // Generate template data for each folder
    const templates = await Promise.all(folders.map(async (folder) => {
      const folderPath = path.join(galleryPath, folder);
      const files = await fs.readdir(folderPath);

      // Find files by extension
      const pngFile = files.find(f => f.toLowerCase().endsWith('.png'));
      const htmlFile = files.find(f => f.toLowerCase().endsWith('.html'));
      const jsonFile = files.find(f => f.toLowerCase().endsWith('.json'));
      const pdfFile = files.find(f => f.toLowerCase().endsWith('.pdf'));

      // Generate ID and label from folder name
      const id = folder.replace(/^\d+_/, '');
      const label = folder
        .replace(/^\d+_/, '')
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      return {
        id,
        folder,
        label,
        image: pngFile,
        html: htmlFile,
        json: jsonFile,
        pdf: pdfFile
      };
    }));

    res.json(templates);
  } catch (error) {
    console.error('Error loading gallery templates:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to get application configuration
app.get('/api/config', (req, res) => {
  try {
    // Expose only safe client-side config (exclude sensitive server settings)
    const clientConfig = {
      version: config.version,
      appUrl: config.appUrl,
      defaultTheme: config.defaultTheme,
      defaultColor: config.defaultColor,
      defaultMode: config.defaultMode,
      labels: config.labels,
      limits: config.limits,
      analytics: {
        enabled: analyticsEnabled
      },
      turnstile: {
        enabled: config.turnstile.enabled
      }
    };
    res.json(clientConfig);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to get terms and conditions last modified date
app.get('/api/terms/last-modified', (req, res) => {
  try {
    const termsPath = path.join(__dirname, 'public', 'terms-and-conditions.html');
    const stats = fsSync.statSync(termsPath);
    res.json({
      lastModified: stats.mtime.toISOString(),
      lastModifiedFormatted: stats.mtime.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    });
  } catch (error) {
    console.error('Error reading terms file stats:', error);
    res.status(500).json({ error: error.message });
  }
});

async function handleGenerateHtmlPreview(req, res) {
  try {
    const { resumeData, themeName, colorName, photoBase64, customSectionNames, showWatermark, layout } = req.body;

    if (!resumeData) {
      return res.status(400).json({ error: 'Resume data is required' });
    }

    // Validate and sanitize photoBase64 before processing
    let validatedPhoto = null;
    try {
      validatedPhoto = validatePhotoBase64(photoBase64);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!validateResumePayload(resumeData, validatedPhoto, res)) {
      return;
    }

    const {
      sanitizedResumeData: previewResumeData,
      metaFromPayload
    } = extractResumePayload(resumeData);

    if (!themeName) {
      return res.status(400).json({ error: 'Theme name is required' });
    }

    const theme = loadTheme(themeName);
    let palette = null;

    if (!theme.monochromatic) {
      if (!colorName) {
        return res.status(400).json({ error: 'Color is required for non-monochromatic themes' });
      }
      const color = resolveColor(colorName);
      palette = color.palette;
    }

    const resolvedCustomSectionNames = customSectionNames || metaFromPayload.customSectionNames || {};
    const resolvedShowWatermark = typeof showWatermark === 'boolean'
      ? showWatermark
      : (typeof metaFromPayload.showWatermark === 'boolean'
          ? metaFromPayload.showWatermark
          : true);

    const resolvedLayout = typeof layout === 'string' ? layout : 'standard';

    const htmlContent = generateHTML(
      previewResumeData,
      validatedPhoto,
      theme,
      palette,
      resolvedCustomSectionNames,
      resolvedShowWatermark,
      config.labels,
      resolvedLayout,
      true // forPreview: inline @media print rules and compensate for PDF page margins
    );
    res.json({ html: htmlContent });
  } catch (error) {
    console.error('Error generating HTML:', error);
    res.status(500).json({ error: error.message });
  }
}

// API endpoint to generate HTML preview
app.post('/api/generate-html-preview', handleGenerateHtmlPreview);

// API endpoint to export HTML (and log analytics)
app.post('/api/export-html', validateTurnstile, async (req, res) => {
  try {
    const {
      resumeData,
      themeName,
      colorName,
      photoBase64,
      customSectionNames,
      showWatermark,
      layout,
      analyticsMeta
    } = req.body;

    if (!resumeData) {
      return res.status(400).json({ error: 'Resume data is required' });
    }

    // Validate and sanitize photoBase64 before processing
    let validatedPhoto = null;
    try {
      validatedPhoto = validatePhotoBase64(photoBase64);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!validateResumePayload(resumeData, validatedPhoto, res)) {
      return;
    }

    const {
      sanitizedResumeData,
      metaFromPayload
    } = extractResumePayload(resumeData);

    if (!themeName) {
      return res.status(400).json({ error: 'Theme name is required' });
    }

    const theme = loadTheme(themeName);
    let palette = null;

    if (!theme.monochromatic) {
      if (!colorName) {
        return res.status(400).json({ error: 'Color is required for non-monochromatic themes' });
      }
      const color = resolveColor(colorName);
      palette = color.palette;
    }

    const resolvedCustomSectionNames = customSectionNames || metaFromPayload.customSectionNames || {};
    const resolvedShowWatermark = typeof showWatermark === 'boolean'
      ? showWatermark
      : (typeof metaFromPayload.showWatermark === 'boolean'
          ? metaFromPayload.showWatermark
          : true);

    const resolvedLayout = typeof layout === 'string' ? layout : 'standard';

    const htmlContent = generateHTML(
      sanitizedResumeData,
      validatedPhoto,
      theme,
      palette,
      resolvedCustomSectionNames,
      resolvedShowWatermark,
      config.labels,
      resolvedLayout
    );

    const sanitizedMetaFromPayload = { ...metaFromPayload };
    delete sanitizedMetaFromPayload.mode;
    const analyticsMetaPayload = {
      ...(Object.keys(sanitizedMetaFromPayload).length ? sanitizedMetaFromPayload : {}),
      ...((analyticsMeta && typeof analyticsMeta === 'object') ? analyticsMeta : {})
    };

    const { normalizedMeta, resolvedMode, resolvedSourceUrl } = buildAnalyticsContext(
      req,
      analyticsMetaPayload,
      {
        themeName: theme.name,
        colorName,
        showWatermark: resolvedShowWatermark,
        customSectionNames: resolvedCustomSectionNames,
        enabledSections: metaFromPayload.enabledSections || {}
      }
    );

    recordExportAnalytics({
      exportType: 'html',
      meta: normalizedMeta,
      mode: resolvedMode,
      sourceUrl: resolvedSourceUrl
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="resume.html"');
    res.send(htmlContent);
  } catch (error) {
    console.error('Error exporting HTML:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to export JSON (and log analytics)
app.post('/api/export-json', validateTurnstile, (req, res) => {
  try {
    const { exportData, analyticsMeta } = req.body;
    if (!exportData || typeof exportData !== 'object') {
      return res.status(400).json({ error: 'Export payload is required' });
    }

    const payloadJson = JSON.stringify(exportData);
    const payloadSize = Buffer.byteLength(payloadJson, 'utf8');
    if (!validatePayloadSize(payloadSize, MAX_JSON_PAYLOAD_BYTES, 'Export JSON', res)) {
      return;
    }

    const jsonString = JSON.stringify(exportData, null, 2);

    const metaFromPayload = exportData._meta || {};
    const sanitizedMetaFromPayload = { ...metaFromPayload };
    delete sanitizedMetaFromPayload.mode;
    const analyticsMetaPayload = {
      ...(Object.keys(sanitizedMetaFromPayload).length ? sanitizedMetaFromPayload : {}),
      ...((analyticsMeta && typeof analyticsMeta === 'object') ? analyticsMeta : {})
    };
    const { normalizedMeta, resolvedMode, resolvedSourceUrl } = buildAnalyticsContext(
      req,
      analyticsMetaPayload,
      {
        themeName: metaFromPayload.selectedTheme || null,
        colorName: metaFromPayload.selectedColor || null,
        showWatermark: Boolean(metaFromPayload.showWatermark),
        customSectionNames: metaFromPayload.customSectionNames || {},
        enabledSections: metaFromPayload.enabledSections || {}
      }
    );

    recordExportAnalytics({
      exportType: 'json',
      meta: normalizedMeta,
      mode: resolvedMode,
      sourceUrl: resolvedSourceUrl
    });

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="resume.json"');
    res.send(jsonString);
  } catch (error) {
    console.error('Error exporting JSON:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to export PDF (with queue management)
app.post('/api/export-pdf', validateTurnstile, async (req, res) => {
  try {
    const {
      resumeData,
      themeName,
      colorName,
      photoBase64,
      customSectionNames,
      showWatermark,
      layout,
      analyticsMeta
    } = req.body;

    if (!resumeData) {
      return res.status(400).json({ error: 'Resume data is required' });
    }

    // Validate and sanitize photoBase64 before processing
    let validatedPhoto = null;
    try {
      validatedPhoto = validatePhotoBase64(photoBase64);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!validateResumePayload(resumeData, validatedPhoto, res)) {
      return;
    }

    const {
      sanitizedResumeData,
      metaFromPayload
    } = extractResumePayload(resumeData);

    console.log('[Analytics] export-pdf endpoint - metaFromPayload.mode:', metaFromPayload?.mode);

    if (!themeName) {
      return res.status(400).json({ error: 'Theme name is required' });
    }

    const theme = loadTheme(themeName);
    let palette = null;

    if (!theme.monochromatic) {
      if (!colorName) {
        return res.status(400).json({ error: 'Color is required for non-monochromatic themes' });
      }
      const color = resolveColor(colorName);
      palette = color.palette;
    }

    const resolvedCustomSectionNames = customSectionNames || metaFromPayload.customSectionNames || {};
    const resolvedShowWatermark = typeof showWatermark === 'boolean'
      ? showWatermark
      : (typeof metaFromPayload.showWatermark === 'boolean'
          ? metaFromPayload.showWatermark
          : true);

    const sanitizedMetaFromPayload = { ...metaFromPayload };
    delete sanitizedMetaFromPayload.mode;
    const analyticsMetaPayload = {
      ...(Object.keys(sanitizedMetaFromPayload).length ? sanitizedMetaFromPayload : {}),
      ...((analyticsMeta && typeof analyticsMeta === 'object') ? analyticsMeta : {})
    };

    // Check if queue is full
    if (pdfClusterManager.isQueueFull()) {
      const retryAfterSeconds = Math.ceil(
        pdfClusterManager.getWaitTimeEstimate(0) / 1000
      );

      console.warn('[Queue] Queue full, rejecting request');

      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(503).json({
        error: 'Server is experiencing high traffic',
        message: 'PDF generation service is currently at capacity. Please try again in a few moments.',
        retryAfter: retryAfterSeconds,
        estimatedWaitSeconds: retryAfterSeconds
      });
    }

    // Enqueue the job
    const jobData = {
      resumeData: sanitizedResumeData,
      themeName,
      colorName,
      photoBase64: validatedPhoto,
      customSectionNames: resolvedCustomSectionNames,
      showWatermark: resolvedShowWatermark,
      layout: typeof layout === 'string' ? layout : 'standard',
      analyticsMeta: analyticsMetaPayload,
      theme,
      palette
    };

    const queueResult = await pdfClusterManager.enqueue(jobData, req, res);

    console.log(`[Queue] Job ${queueResult.jobId} enqueued at position ${queueResult.position}`);
    console.log(`[Queue] Estimated wait time: ${Math.ceil(queueResult.estimatedWaitTimeMs / 1000)}s`);

    // Job will be processed asynchronously, response will be sent when complete
  } catch (error) {
    console.error('[Queue] Error handling PDF request:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

// API endpoint to check queue status (for monitoring)
app.get('/api/queue/status', (req, res) => {
  try {
    const status = pdfClusterManager.getQueueStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Initialize cluster and start server (asynchronous)
(async () => {
  try {
    // Initialize the cluster
    await pdfClusterManager.init();
    console.log('[Cluster] PDF Cluster Manager initialized');
    console.log(`[Cluster] Max queue size: ${queueConfig.queue.maxQueueSize}`);
    console.log(`[Cluster] Memory limit: ${queueConfig.queue.maxPdfMemoryMB}MB`);
    console.log(`[Cluster] Concurrency: ${queueConfig.queue.minConcurrency}-${queueConfig.queue.maxConcurrency}`);

    // Start the server after cluster is ready
    const server = app.listen(PORT, () => {
      console.log(`cre8ive.cv running at http://localhost:${PORT}`);
    });

    // Graceful shutdown handler
    async function gracefulShutdown(signal) {
      console.log(`[Server] ${signal} received, shutting down gracefully`);

      // Stop accepting new connections
      server.close(async () => {
        console.log('[Server] HTTP server closed');

        // Shutdown cluster manager
        await pdfClusterManager.shutdown();

        console.log('[Server] Graceful shutdown complete');
        process.exit(0);
      });

      // Force shutdown after 30 seconds if graceful shutdown hangs
      setTimeout(() => {
        console.error('[Server] Graceful shutdown timeout, forcing exit');
        process.exit(1);
      }, 30000);
    }

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('[Server] Failed to initialize cluster:', error);
    process.exit(1);
  }
})();
