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

    // SECURITY: Dynamic GDPR positioning with timeout to prevent infinite loops
    try {
      await Promise.race([
        page.evaluate(() => {
      // A4 dimensions: 210mm x 297mm
      // Thresholds for detecting which scenario applies (with buffer for variations)
      const ONE_PAGE_THRESHOLD = 280; // mm (detection threshold)
      const TWO_PAGE_THRESHOLD = 590; // mm (detection threshold)

      // Actual body heights to ensure GDPR ends (not starts) at bottom of page
      const ONE_PAGE_BODY_HEIGHT = 277; // mm (1 page minus margins)
      const TWO_PAGE_BODY_HEIGHT = 568; // mm (2 pages minus margins)

      const body = document.body;
      const gdprWrapper = document.querySelector('.gdpr-watermark-wrapper');

      if (!gdprWrapper) {
        return;
      }

      // Prepare body for measurement
      body.style.display = 'block';
      body.style.minHeight = 'auto';
      body.style.height = 'auto';
      body.style.position = 'relative';
      body.style.overflow = 'visible';
      body.style.boxSizing = 'border-box';

      // Style content wrapper
      const contentWrapper = document.querySelector('.content-wrapper');
      if (contentWrapper) {
        contentWrapper.style.display = 'block';
        contentWrapper.style.flex = 'none';
      }

      // Temporarily hide GDPR wrapper to measure content height
      gdprWrapper.style.display = 'none';
      const contentHeight = body.scrollHeight;

      // Show GDPR wrapper and measure total height
      gdprWrapper.style.display = 'block';
      const FOOTER_PULL_PX = 18;
      gdprWrapper.style.position = 'relative';
      gdprWrapper.style.margin = '0';
      gdprWrapper.style.marginBottom = `-${FOOTER_PULL_PX}px`;

      const totalHeight = body.scrollHeight;
      const gdprHeight = totalHeight - contentHeight;

      // Convert pixels to mm (96 DPI: 1mm ≈ 3.78px)
      const contentHeightMm = contentHeight / 3.78;
      const gdprHeightMm = gdprHeight / 3.78;
      let totalHeightMm = totalHeight / 3.78;

      // Page dimensions
      const FIRST_PAGE_HEIGHT_MM = 277;
      const ADDITIONAL_PAGE_HEIGHT_MM = 291;
      const OVERLAP_SAFETY_MARGIN = -20; // !!! - GDPR overlap parameter

      // Calculate how much space is left on the page where content ends
      let spaceLeftOnLastPage;
      if (contentHeightMm <= FIRST_PAGE_HEIGHT_MM) {
        // Content is on page 1
        spaceLeftOnLastPage = FIRST_PAGE_HEIGHT_MM - contentHeightMm;
      } else {
        // Content spans multiple pages
        const remainingAfterFirstPage = contentHeightMm - FIRST_PAGE_HEIGHT_MM;
        const spaceUsedOnLastPage = remainingAfterFirstPage % ADDITIONAL_PAGE_HEIGHT_MM;
        spaceLeftOnLastPage = ADDITIONAL_PAGE_HEIGHT_MM - spaceUsedOnLastPage;
      }

      // Check if GDPR would overlap with content - if so, force page break
      let needsPageBreak = false;
      if (gdprHeightMm + OVERLAP_SAFETY_MARGIN > spaceLeftOnLastPage) {
        // Not enough space - force GDPR to next page to prevent overlap
        gdprWrapper.style.pageBreakBefore = 'always';
        needsPageBreak = true;

        // When page break is forced, GDPR moves to a completely new page
        // Calculate content pages
        const contentPages = Math.ceil(contentHeightMm <= FIRST_PAGE_HEIGHT_MM ? 1 :
          1 + (contentHeightMm - FIRST_PAGE_HEIGHT_MM) / ADDITIONAL_PAGE_HEIGHT_MM);

        // Add FULL additional page for GDPR (not just GDPR height)
        // This ensures we move to the next page scenario
        const contentHeightTotal = contentPages === 1 ? FIRST_PAGE_HEIGHT_MM :
          FIRST_PAGE_HEIGHT_MM + (contentPages - 1) * ADDITIONAL_PAGE_HEIGHT_MM;

        // Add a full additional page height to force next scenario
        totalHeightMm = contentHeightTotal + ADDITIONAL_PAGE_HEIGHT_MM;
      }

      // Determine positioning strategy based on total content height
      if (totalHeightMm <= ONE_PAGE_THRESHOLD) {
        // SCENARIO 1: Content fits on one page - fix GDPR wrapper at bottom of page 1
        body.style.height = ONE_PAGE_BODY_HEIGHT + 'mm';
        gdprWrapper.style.position = 'absolute';
        gdprWrapper.style.bottom = `-${FOOTER_PULL_PX}px`;
        gdprWrapper.style.left = '0';
        gdprWrapper.style.right = '0';
      } else if (totalHeightMm <= TWO_PAGE_THRESHOLD) {
        // SCENARIO 2: Content fits on two pages - fix GDPR wrapper at bottom of page 2
        body.style.height = TWO_PAGE_BODY_HEIGHT + 'mm';
        gdprWrapper.style.position = 'absolute';
        gdprWrapper.style.bottom = `-${FOOTER_PULL_PX}px`;
        gdprWrapper.style.left = '0';
        gdprWrapper.style.right = '0';
      } else {
        // SCENARIO 3: Content exceeds two pages - place GDPR wrapper at bottom of last page
        // Calculate number of pages needed for content + GDPR
        let numberOfPages;
        if (totalHeightMm <= FIRST_PAGE_HEIGHT_MM) {
          numberOfPages = 1;
        } else {
          const remainingHeight = totalHeightMm - FIRST_PAGE_HEIGHT_MM;
          numberOfPages = 1 + Math.ceil(remainingHeight / ADDITIONAL_PAGE_HEIGHT_MM);
        }

        // Calculate body height to match number of pages
        const bodyHeightMm = numberOfPages === 1
          ? FIRST_PAGE_HEIGHT_MM
          : FIRST_PAGE_HEIGHT_MM + (numberOfPages - 1) * ADDITIONAL_PAGE_HEIGHT_MM;

        // Set body height to match number of pages and position GDPR at bottom
        body.style.height = bodyHeightMm + 'mm';
        gdprWrapper.style.position = 'absolute';
        gdprWrapper.style.bottom = `-${FOOTER_PULL_PX}px`;
        gdprWrapper.style.left = '0';
        gdprWrapper.style.right = '0';
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
        bottom: '0px',
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
