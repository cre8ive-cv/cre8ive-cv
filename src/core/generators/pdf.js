const puppeteer = require('puppeteer');
const config = require('../../config/config');

const BROWSER_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-web-security', // Allow loading fonts from CDN
  '--font-render-hinting=none'
];

// Timeout constants from config (in milliseconds)
const TIMEOUTS = {
  PAGE_LOAD: config.pdf.timeouts.pageLoad,
  NETWORK_IDLE: config.pdf.timeouts.networkIdle,
  SCRIPT_EXECUTION: config.pdf.timeouts.scriptExecution,
  PDF_GENERATION: config.pdf.timeouts.pdfGeneration,
  TOTAL_OPERATION: config.pdf.timeouts.totalOperation
};

async function generatePDF(htmlContent, page) {
  try {
    // SECURITY: Set default timeout for all page operations to prevent infinite hangs
    page.setDefaultTimeout(TIMEOUTS.PAGE_LOAD);

    // Set viewport to match A4 dimensions for consistent rendering
    // A4 at 96 DPI: 794px x 1123px
    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 2 // Higher resolution for better text rendering
    });

    // SECURITY: Set content with explicit timeout to prevent malicious content from hanging
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
      timeout: TIMEOUTS.PAGE_LOAD
    });

    // SECURITY: Wait for fonts with timeout to prevent hanging
    try {
      await Promise.race([
        page.evaluateHandle('document.fonts.ready'),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Font loading timeout')), TIMEOUTS.SCRIPT_EXECUTION)
        )
      ]);
    } catch (err) {
      console.warn('Font loading timed out, continuing anyway:', err.message);
    }

    // Add CSS for emoji images (Twemoji) to ensure proper sizing
    await page.addStyleTag({
      content: `
        img.emoji {
          height: 1em !important;
          width: 1em !important;
          max-height: 1em !important;
          max-width: 1em !important;
          min-height: 1em !important;
          min-width: 1em !important;
          margin: 0 0.05em 0 0.1em;
          vertical-align: -0.1em;
          display: inline-block;
          object-fit: contain;
        }
      `
    });

    // Convert emojis to SVG using Twemoji for reliable PDF rendering
    try {
      await page.addScriptTag({
        url: 'https://cdn.jsdelivr.net/npm/@twemoji/api@latest/dist/twemoji.min.js',
        timeout: TIMEOUTS.NETWORK_IDLE
      });

      // SECURITY: Execute emoji parsing with timeout protection
      await Promise.race([
        page.evaluate(() => {
          // Parse emojis and convert to SVG images
          if (window.twemoji) {
            twemoji.parse(document.body, {
              folder: 'svg',
              ext: '.svg',
              base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/',
              className: 'emoji'
            });
          }
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Twemoji parse timeout')), TIMEOUTS.SCRIPT_EXECUTION)
        )
      ]);

      // Wait for emoji SVG images to load (with reduced timeout)
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (err) {
      console.warn('Twemoji loading failed, emojis may not render correctly:', err.message);
      // Continue anyway - Font Awesome should still work
    }

    // Switch to print media BEFORE measuring so that @media print CSS rules are
    // active during both the measurement evaluate() and the final page.pdf() call.
    // page.pdf() always renders in print mode — measuring in screen mode caused
    // body padding and element heights to differ between measurement and render,
    // leading to gdprWrapper overflowing the body by a few pixels and getting
    // split across pages or pushed to a new page.
    try {
      await page.emulateMediaType('print');
    } catch (err) {
      console.warn('Failed to emulate print media type, GDPR positioning may be slightly off:', err.message);
    }

    // SECURITY: Dynamic GDPR positioning with timeout to prevent infinite loops
    try {
      await Promise.race([
        page.evaluate(() => {
      // Page height in CSS pixels for A4 with margins top=20px, bottom=15px at 96 DPI.
      // A4 = 297mm × (96px / 25.4mm) = 1122.52px; printable = 1122.52 − 20 − 15 = 1087.52px.
      // Use 1087 (rounded down) — 0.52px buffer ensures body never overflows its page count.
      // All arithmetic stays in integer pixels, avoiding mm→px conversion rounding errors.
      const PAGE_HEIGHT_PX = 1087;

      const body = document.body;
      const gdprWrapper = document.querySelector('.gdpr-watermark-wrapper');
      const contentWrapper = document.querySelector('.content-wrapper');

      if (!gdprWrapper) return;

      // --- MEASUREMENT PHASE ---
      // Use block layout with auto height so scrollHeight is reliable.
      // Zero paddingBottom so measurement matches the render phase.
      body.style.display = 'block';
      body.style.minHeight = 'auto';
      body.style.height = 'auto';
      body.style.position = 'relative';
      body.style.overflow = 'visible';
      body.style.boxSizing = 'border-box';
      body.style.paddingBottom = '0';

      if (contentWrapper) {
        contentWrapper.style.display = 'block';
        contentWrapper.style.flex = 'none';
      }

      // Measure content height without the footer
      gdprWrapper.style.display = 'none';
      const contentHeightPx = body.scrollHeight;

      // Measure the footer block's natural height
      gdprWrapper.style.display = 'block';
      gdprWrapper.style.position = 'static';
      gdprWrapper.style.margin = '0';
      const gdprHeightPx = gdprWrapper.offsetHeight;

      // --- PAGE COUNT CALCULATION ---
      // How much vertical space remains on the last page of content?
      const contentRemainder = contentHeightPx % PAGE_HEIGHT_PX;
      const spaceOnLastPage = contentRemainder === 0 ? PAGE_HEIGHT_PX : (PAGE_HEIGHT_PX - contentRemainder);
      const gdprFitsOnLastPage = gdprHeightPx <= spaceOnLastPage;

      let numberOfPages;
      if (gdprFitsOnLastPage) {
        numberOfPages = Math.ceil((contentHeightPx + gdprHeightPx) / PAGE_HEIGHT_PX) || 1;
      } else {
        numberOfPages = Math.ceil(contentHeightPx / PAGE_HEIGHT_PX) + 1;
      }
      numberOfPages = Math.max(1, numberOfPages);

      const bodyHeightPx = numberOfPages * PAGE_HEIGHT_PX;

      // --- RENDER PHASE ---
      // Strategy: flex column layout where content-wrapper grows (flex:1) to fill
      // all space above gdprWrapper, anchoring gdpr to the exact bottom of the body.
      //
      // WHY FLEX INSTEAD OF A SPACER DIV:
      // The previous approach inserted a fixed-height spacer calculated in mm, then
      // set body height in mm. Converting scrollHeight (px) → mm → CSS mm string →
      // back to px by Chromium introduced rounding errors that could push gdpr past
      // a page boundary. Using integer pixels end-to-end (body height, flex sizing)
      // eliminates that error source entirely.
      //
      // WHY THIS WORKS: bodyHeightPx = N × 1087px. Each page's printable height is
      // 1087.52px, so N × 1087px always fits within N pages with 0.52px to spare.
      // The flex engine expands content-wrapper to exactly (bodyHeightPx − gdprHeightPx),
      // placing gdpr at the precise bottom of the body without any unit conversion.
      body.style.display = 'flex';
      body.style.flexDirection = 'column';
      body.style.height = bodyHeightPx + 'px';
      body.style.minHeight = '0';
      body.style.paddingBottom = '0';
      // box-sizing: border-box must stay so that the explicit height covers padding too
      // (already set above in the measurement phase and unchanged here)

      if (contentWrapper) {
        contentWrapper.style.flex = '1';
        contentWrapper.style.display = 'block';
      }

      gdprWrapper.style.position = 'static';
      gdprWrapper.style.margin = '0';
      gdprWrapper.style.flexShrink = '0';
      gdprWrapper.style.breakBefore = 'avoid';
      gdprWrapper.style.pageBreakBefore = 'avoid';
      gdprWrapper.style.breakInside = 'avoid';
      gdprWrapper.style.pageBreakInside = 'avoid';

      // Prevent any break between the two child elements inside the wrapper
      const gdprClause = gdprWrapper.querySelector('.gdpr-clause');
      const watermark = gdprWrapper.querySelector('.watermark');
      if (gdprClause) {
        gdprClause.style.breakAfter = 'avoid';
        gdprClause.style.pageBreakAfter = 'avoid';
      }
      if (watermark) {
        watermark.style.breakBefore = 'avoid';
        watermark.style.pageBreakBefore = 'avoid';
      }
    }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('GDPR positioning timeout')), TIMEOUTS.SCRIPT_EXECUTION)
        )
      ]);
    } catch (err) {
      console.warn('GDPR positioning script timed out or failed, using default layout:', err.message);
      // Continue with default layout
    }

    // SECURITY: Wrap PDF generation with timeout to prevent hanging
    const pdfBuffer = await Promise.race([
      page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '15px',
        left: '20px'
      }
    }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('PDF generation timeout - possible infinite loop or memory exhaustion')), TIMEOUTS.PDF_GENERATION)
      )
    ]);

    console.log(`PDF generated successfully in memory (${pdfBuffer.length} bytes)`);
    return pdfBuffer;
  } catch (err) {
    console.error('PDF generation failed:', err.message);
    throw new Error(`PDF generation failed: ${err.message}`);
  }
}

// SECURITY: Wrap the entire generatePDF function with a total timeout
async function generatePDFWithTimeout(htmlContent, page) {
  return Promise.race([
    generatePDF(htmlContent, page),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Total PDF generation timeout exceeded (45s) - possible DoS attack')), TIMEOUTS.TOTAL_OPERATION)
    )
  ]);
}

/**
 * Wrapper for PDF generation with memory tracking
 * Used by the queue manager to monitor memory usage during PDF generation
 */
async function generatePDFWithMemoryTracking(page, htmlContent, onMemoryUpdate) {
  const startMemory = process.memoryUsage().heapUsed;

  try {
    if (onMemoryUpdate) {
      onMemoryUpdate({
        phase: 'start',
        memoryMB: startMemory / (1024 * 1024)
      });
    }

    const pdfBuffer = await generatePDFWithTimeout(htmlContent, page);

    const endMemory = process.memoryUsage().heapUsed;
    const peakMemory = Math.max(startMemory, endMemory);

    if (onMemoryUpdate) {
      onMemoryUpdate({
        phase: 'complete',
        memoryMB: peakMemory / (1024 * 1024),
        bufferSizeBytes: pdfBuffer.length
      });
    }

    return pdfBuffer;
  } catch (error) {
    const errorMemory = process.memoryUsage().heapUsed;
    if (onMemoryUpdate) {
      onMemoryUpdate({
        phase: 'error',
        memoryMB: errorMemory / (1024 * 1024)
      });
    }
    throw error;
  }
}

/**
 * CLI-specific PDF generation function
 * Creates its own browser instance for one-time use
 * Used by the CLI tool for batch processing
 */
async function generatePDFForCLI(htmlContent) {
  let browser = null;
  let page = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: BROWSER_ARGS
    });

    page = await browser.newPage();
    const pdfBuffer = await generatePDFWithTimeout(htmlContent, page);
    return pdfBuffer;
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (closeError) {
        console.warn('Failed to close Puppeteer page:', closeError.message);
      }
    }
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.warn('Failed to close Puppeteer browser:', closeError.message);
      }
    }
  }
}

module.exports = {
  generatePDF: generatePDFForCLI, // For CLI compatibility
  generatePDFWithMemoryTracking, // For cluster usage
  TIMEOUTS
};
