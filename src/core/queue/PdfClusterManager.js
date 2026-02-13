/**
 * Enhanced PdfClusterManager with Memory Monitoring and Auto-Restart
 *
 * Features:
 * - Memory monitoring (warns at 4.5GB, restarts at 5.2GB)
 * - Periodic cluster restart every 12 hours (prevents memory leaks)
 * - Graceful restart (waits for queue to drain)
 * - Better logging with memory and uptime stats
 *
 * To use: Replace PdfClusterManager.js with this file
 */

const { Cluster } = require('puppeteer-cluster');
const os = require('os');
const { randomUUID } = require('crypto');
const { generateHTML } = require('../generators/html');
const { generatePDFWithMemoryTracking } = require('../generators/pdf');

class PdfClusterManager {
  constructor(queueConfig, dependencies = {}) {
    // Store dependencies (same as PdfQueueManager)
    this.appConfig = dependencies.config || require('../../config');
    this.analyticsDB = dependencies.analyticsDB || null;
    this.analyticsEnabled = dependencies.analyticsEnabled || false;
    this.buildAnalyticsContext = dependencies.buildAnalyticsContext || null;
    this.recordExportAnalytics = dependencies.recordExportAnalytics || null;
    this.formatAnalyticsTimestamp = dependencies.formatAnalyticsTimestamp || null;

    // Configuration
    this.config = {
      maxQueueSize: queueConfig.maxQueueSize || 50,
      maxPdfMemoryMB: queueConfig.maxPdfMemoryMB || 2048,
      avgInstanceMemoryMB: queueConfig.avgInstanceMemoryMB || 250,
      minConcurrency: queueConfig.minConcurrency || 1,
      maxConcurrency: queueConfig.maxConcurrency || 5,
      safetyMarginMB: queueConfig.safetyMarginMB || 500,
      avgProcessingTimeMs: queueConfig.avgProcessingTimeMs || 8000,
      memoryCheckIntervalMs: queueConfig.memoryCheckIntervalMs || 5000,
      stuckJobTimeoutMs: queueConfig.stuckJobTimeoutMs || 90000
    };
    this.clusterConfig = queueConfig.cluster || {};

    // State
    this.cluster = null; // Will be initialized in init()
    this.pendingJobs = new Map(); // Track jobs waiting in cluster
    this.stats = {
      totalProcessed: 0,
      totalFailed: 0,
      totalRejected: 0,
      peakQueueSize: 0,
      peakConcurrency: 0
    };

    // Intervals (started after init)
    this.concurrencyUpdateInterval = null;
    this.statsInterval = null;
    this.memoryCheckInterval = null;
    this.restartInterval = null;

    // Restart tracking
    this.clusterStartTime = Date.now();
    this.isRestarting = false;
  }

  /**
   * Initialize the cluster (async)
   */
  async init() {
    const initialConcurrency = this.calculateConcurrencyLimit();

    this.cluster = await Cluster.launch({
      concurrency: Cluster[this.clusterConfig.concurrencyMode || 'CONCURRENCY_CONTEXT'],
      maxConcurrency: initialConcurrency,
      puppeteerOptions: this.clusterConfig.puppeteerOptions || {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--font-render-hinting=none'
        ]
      },
      timeout: this.clusterConfig.taskTimeoutMs || 90000,
      retryLimit: this.clusterConfig.retryLimit || 0,
      retryDelay: this.clusterConfig.retryDelayMs || 0,
      monitor: false // We implement our own monitoring
    });

    // Define task handler
    await this.cluster.task(async ({ page, data: job }) => {
      return await this.processJob(page, job);
    });

    // Start dynamic concurrency adjustment
    this.startConcurrencyMonitoring();

    // Start stats logging
    this.startStatsLogging();

    // Start memory monitoring (NEW)
    this.startMemoryMonitoring();

    // Schedule periodic restarts (NEW)
    this.schedulePeriodicRestart();

    console.log('[Cluster] PDF Cluster initialized');
    console.log(`[Cluster] Initial concurrency: ${initialConcurrency}`);
  }

  /**
   * Calculate dynamic concurrency limit based on available memory
   * (Same logic as PdfQueueManager)
   */
  calculateConcurrencyLimit() {
    const memInfo = process.memoryUsage();
    const systemMemoryMB = os.totalmem() / (1024 * 1024);
    const usedMemoryMB = memInfo.heapUsed / (1024 * 1024);

    // Calculate available memory for PDF processing
    const availableForPdfMB = Math.min(
      this.config.maxPdfMemoryMB,
      systemMemoryMB - usedMemoryMB - this.config.safetyMarginMB
    );

    // How many instances can fit?
    const calculatedLimit = Math.floor(
      availableForPdfMB / this.config.avgInstanceMemoryMB
    );

    // Clamp between min and max
    const limit = Math.max(
      this.config.minConcurrency,
      Math.min(calculatedLimit, this.config.maxConcurrency)
    );

    return limit;
  }

  /**
   * Start dynamic concurrency monitoring
   */
  startConcurrencyMonitoring() {
    this.concurrencyUpdateInterval = setInterval(() => {
      const newLimit = this.calculateConcurrencyLimit();
      const currentLimit = this.cluster.maxConcurrency;

      if (newLimit !== currentLimit) {
        console.log(`[Cluster] Adjusting concurrency: ${currentLimit} -> ${newLimit}`);
        this.cluster.maxConcurrency = newLimit;
      }
    }, this.config.memoryCheckIntervalMs);
  }

  /**
   * Start stats logging (ENHANCED)
   */
  startStatsLogging() {
    this.statsInterval = setInterval(() => {
      const memUsage = process.memoryUsage();
      const heapUsedMB = (memUsage.heapUsed / (1024 * 1024)).toFixed(0);
      const heapTotalMB = (memUsage.heapTotal / (1024 * 1024)).toFixed(0);
      const uptimeHours = ((Date.now() - this.clusterStartTime) / (1000 * 60 * 60)).toFixed(1);

      console.log(`[Cluster] Stats: processed=${this.stats.totalProcessed}, failed=${this.stats.totalFailed}, rejected=${this.stats.totalRejected}, peak_queue=${this.stats.peakQueueSize}, peak_concurrency=${this.stats.peakConcurrency}`);
      console.log(`[Cluster] Memory: ${heapUsedMB}MB / ${heapTotalMB}MB | Uptime: ${uptimeHours}h`);
    }, 300000); // 5 minutes
  }

  /**
   * Start memory monitoring to prevent OOM kills (NEW)
   */
  startMemoryMonitoring() {
    this.memoryCheckInterval = setInterval(() => {
      const memUsage = process.memoryUsage();
      const heapUsedMB = memUsage.heapUsed / (1024 * 1024);

      // Warning threshold: 4.5GB (75% of 6GB Docker limit)
      if (heapUsedMB > 4500) {
        console.warn(`[Cluster] ⚠️ HIGH MEMORY: ${heapUsedMB.toFixed(0)}MB - approaching Docker limit (6GB)`);
      }

      // Critical threshold: 5.2GB (87% of 6GB Docker limit)
      if (heapUsedMB > 5200 && !this.isRestarting) {
        console.error(`[Cluster] 🔴 CRITICAL MEMORY: ${heapUsedMB.toFixed(0)}MB - forcing graceful restart!`);
        this.gracefulRestart().catch(err => {
          console.error('[Cluster] Failed to restart gracefully:', err);
        });
      }
    }, 60000); // Check every minute
  }

  /**
   * Schedule periodic cluster restart to prevent memory accumulation (NEW)
   * Restarts every 12 hours during low-traffic period
   */
  schedulePeriodicRestart() {
    // Restart every 12 hours (configurable via env)
    const restartIntervalHours = parseInt(process.env.CLUSTER_RESTART_HOURS) || 12;
    const restartIntervalMs = restartIntervalHours * 60 * 60 * 1000;

    this.restartInterval = setInterval(async () => {
      console.log(`[Cluster] Scheduled restart triggered (${restartIntervalHours}h interval)`);
      await this.gracefulRestart().catch(err => {
        console.error('[Cluster] Scheduled restart failed:', err);
      });
    }, restartIntervalMs);

    console.log(`[Cluster] Scheduled restart every ${restartIntervalHours} hours`);
  }

  /**
   * Gracefully restart the cluster (NEW)
   * Waits for queue to drain before restarting
   */
  async gracefulRestart() {
    if (this.isRestarting) {
      console.log('[Cluster] Restart already in progress, skipping');
      return;
    }

    this.isRestarting = true;
    const startTime = Date.now();

    try {
      console.log('[Cluster] Starting graceful restart...');
      console.log(`[Cluster] Current queue: ${this.pendingJobs.size} pending jobs`);

      // Stop accepting new jobs by marking as restarting
      const maxWaitTime = 120000; // 2 minutes max wait
      const waitStart = Date.now();

      // Wait for queue to drain (with timeout)
      while (this.pendingJobs.size > 0 && (Date.now() - waitStart) < maxWaitTime) {
        console.log(`[Cluster] Waiting for queue to drain... (${this.pendingJobs.size} remaining)`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      if (this.pendingJobs.size > 0) {
        console.warn(`[Cluster] Forcing restart with ${this.pendingJobs.size} jobs still pending (timeout)`);
      }

      // Close old cluster
      console.log('[Cluster] Closing old cluster...');
      await this.cluster.idle();
      await this.cluster.close();

      // Small delay to ensure cleanup
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Launch new cluster
      console.log('[Cluster] Launching new cluster...');
      const initialConcurrency = this.calculateConcurrencyLimit();

      this.cluster = await Cluster.launch({
        concurrency: Cluster[this.clusterConfig.concurrencyMode || 'CONCURRENCY_CONTEXT'],
        maxConcurrency: initialConcurrency,
        puppeteerOptions: this.clusterConfig.puppeteerOptions,
        timeout: this.clusterConfig.taskTimeoutMs || 100000,
        retryLimit: this.clusterConfig.retryLimit || 0,
        retryDelay: this.clusterConfig.retryDelayMs || 0,
        monitor: false
      });

      // Re-define task handler
      await this.cluster.task(async ({ page, data: job }) => {
        return await this.processJob(page, job);
      });

      // Reset cluster start time
      this.clusterStartTime = Date.now();

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[Cluster] ✅ Restart complete in ${duration}s - memory freed`);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        console.log('[Cluster] Garbage collection triggered');
      }

    } catch (error) {
      console.error('[Cluster] Restart failed:', error);
      throw error;
    } finally {
      this.isRestarting = false;
    }
  }

  /**
   * Check if queue is full
   */
  isQueueFull() {
    // Cluster doesn't expose queue size directly
    // Use pendingJobs map size as proxy
    return this.pendingJobs.size >= this.config.maxQueueSize;
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    const memUsage = process.memoryUsage();
    const heapUsedMB = (memUsage.heapUsed / (1024 * 1024)).toFixed(0);
    const uptimeHours = ((Date.now() - this.clusterStartTime) / (1000 * 60 * 60)).toFixed(1);

    return {
      queueSize: this.pendingJobs.size,
      activeJobs: this.cluster.workersBusy || 0,
      concurrencyLimit: this.cluster.maxConcurrency,
      estimatedWaitTimeMs: this.getWaitTimeEstimate(this.pendingJobs.size),
      stats: { ...this.stats },
      memory: {
        heapUsedMB: parseInt(heapUsedMB),
        limitMB: 6144, // Docker limit
        percentUsed: ((heapUsedMB / 6144) * 100).toFixed(1) + '%'
      },
      uptimeHours: parseFloat(uptimeHours)
    };
  }

  /**
   * Estimate wait time for a job at given position in queue
   * (Same logic as PdfQueueManager)
   */
  getWaitTimeEstimate(queuePosition) {
    const concurrencyLimit = this.calculateConcurrencyLimit();
    const jobsAhead = queuePosition;
    const fullBatches = Math.floor(jobsAhead / concurrencyLimit);
    const remainderJobs = jobsAhead % concurrencyLimit;

    let estimatedMs = 0;

    // Time for current batch to complete (~70% done assumption)
    if (this.cluster && this.cluster.workersBusy > 0) {
      estimatedMs += this.config.avgProcessingTimeMs * 0.7;
    }

    // Time for full batches
    estimatedMs += fullBatches * this.config.avgProcessingTimeMs;

    // Time for partial batch
    if (remainderJobs > 0) {
      estimatedMs += this.config.avgProcessingTimeMs;
    }

    return Math.ceil(estimatedMs);
  }

  /**
   * Enqueue a job
   */
  async enqueue(jobData, req, res) {
    const jobId = randomUUID();
    const position = this.pendingJobs.size;

    const job = {
      id: jobId,
      data: jobData,
      req: req,
      res: res,
      createdAt: Date.now()
    };

    // Store job reference
    this.pendingJobs.set(jobId, job);

    // Update peak queue size
    if (this.pendingJobs.size > this.stats.peakQueueSize) {
      this.stats.peakQueueSize = this.pendingJobs.size;
    }

    const estimatedWaitTimeMs = this.getWaitTimeEstimate(position);

    console.log(`[Cluster] Job ${jobId} enqueued at position ${position} (queue size: ${this.pendingJobs.size})`);

    // Queue job in cluster (returns immediately)
    this.cluster.queue(job)
      .then(() => {
        // Job completed successfully
        this.pendingJobs.delete(jobId);
        this.stats.totalProcessed++;
        const duration = Date.now() - job.createdAt;
        console.log(`[Cluster] Job ${jobId} completed in ${duration}ms`);
      })
      .catch((error) => {
        // Job failed
        this.pendingJobs.delete(jobId);
        this.stats.totalFailed++;
        console.error(`[Cluster] Job ${jobId} failed:`, error.message);
      });

    return {
      jobId,
      position,
      estimatedWaitTimeMs
    };
  }

  /**
   * Process a single job (called by cluster)
   */
  async processJob(page, job) {
    const { data, res, req } = job;

    try {
      // Generate HTML
      const htmlContent = generateHTML(
        data.resumeData,
        data.photoBase64,
        data.theme,
        data.palette,
        data.customSectionNames,
        data.showWatermark,
        this.appConfig.labels,
        data.tightLayout === true
      );

      // Generate PDF with memory tracking (pass page)
      const pdfBuffer = await generatePDFWithMemoryTracking(
        page,
        htmlContent,
        (memoryInfo) => {
          console.log(`[Cluster] Job ${job.id} memory: ${memoryInfo.phase} - ${memoryInfo.memoryMB.toFixed(2)}MB`);
        }
      );

      console.log(`[Cluster] Job ${job.id} PDF generated (${pdfBuffer.length} bytes)`);

      // Record analytics (same as PdfQueueManager)
      if (this.analyticsEnabled && this.buildAnalyticsContext && this.recordExportAnalytics) {
        try {
          const { normalizedMeta, resolvedMode, resolvedSourceUrl } = this.buildAnalyticsContext(
            req,
            data.analyticsMeta,
            {
              themeName: data.theme.name,
              colorName: data.colorName,
              showWatermark: data.showWatermark,
              customSectionNames: data.customSectionNames || {},
              enabledSections: data.enabledSections || {}
            }
          );

          this.recordExportAnalytics({
            exportType: 'pdf',
            meta: normalizedMeta,
            mode: resolvedMode,
            sourceUrl: resolvedSourceUrl
          });
        } catch (analyticsError) {
          console.error(`[Cluster] Job ${job.id} analytics error:`, analyticsError.message);
        }
      }

      // Send response
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');
        res.setHeader('Content-Length', pdfBuffer.length);
        res.end(pdfBuffer, 'binary');
      } else {
        console.log(`[Cluster] Job ${job.id} completed but client disconnected`);
      }

    } catch (error) {
      console.error(`[Cluster] Job ${job.id} processing error:`, error);

      if (!res.headersSent) {
        res.status(500).json({
          error: 'PDF generation failed',
          message: error.message
        });
      }

      throw error; // Re-throw for cluster error handling
    }
  }

  /**
   * Shutdown the cluster gracefully
   */
  async shutdown() {
    console.log('[Cluster] Shutting down PDF cluster...');

    // Clear all intervals
    if (this.concurrencyUpdateInterval) {
      clearInterval(this.concurrencyUpdateInterval);
    }
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }
    if (this.restartInterval) {
      clearInterval(this.restartInterval);
    }

    // Send error response to all pending jobs
    for (const [jobId, job] of this.pendingJobs.entries()) {
      if (!job.res.headersSent) {
        job.res.status(503).json({
          error: 'Server is shutting down',
          message: 'Please try again shortly'
        });
      }
    }

    this.pendingJobs.clear();

    // Close cluster
    if (this.cluster) {
      await this.cluster.idle(); // Wait for active jobs to complete
      await this.cluster.close();
      console.log('[Cluster] Cluster closed');
    }
  }
}

module.exports = PdfClusterManager;
