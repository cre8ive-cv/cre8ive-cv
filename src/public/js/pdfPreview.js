// PDF Preview Functions
const PDF_PREVIEW_DELAY_THRESHOLDS = {
  slow: 10000,
  highTraffic: 18000
};

let pdfPreviewDelayTimeouts = [];

// Detect if user is on mobile device
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform));
}

// Render PDF using PDF.js for mobile devices
async function renderMobilePdfPreview(blob) {
  const container = document.createElement('div');
  container.className = 'pdf-preview-mobile-viewer';

  // Create canvas container
  const canvasContainer = document.createElement('div');
  canvasContainer.className = 'pdf-preview-canvas-container';

  const canvas = document.createElement('canvas');
  canvas.className = 'pdf-preview-canvas';
  canvasContainer.appendChild(canvas);

  // Create navigation controls
  const controls = document.createElement('div');
  controls.className = 'pdf-preview-mobile-controls';
  controls.innerHTML = `
    <button class="pdf-nav-btn pdf-prev-btn" disabled>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M12 4L6 10L12 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <span class="pdf-page-info">
      <span class="pdf-current-page">1</span> / <span class="pdf-total-pages">1</span>
    </span>
    <button class="pdf-nav-btn pdf-next-btn" disabled>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M8 4L14 10L8 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  `;

  container.appendChild(canvasContainer);
  container.appendChild(controls);
  elements.pdfPreviewContainer.appendChild(container);

  try {
    // Load PDF using PDF.js
    const arrayBuffer = await blob.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let currentPage = 1;
    const totalPages = pdf.numPages;

    // Update total pages
    controls.querySelector('.pdf-total-pages').textContent = totalPages;

    // Function to render a specific page
    async function renderPage(pageNum) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1 });

      // Calculate scale to fit width of container
      const containerWidth = canvasContainer.clientWidth;
      const scale = (containerWidth - 40) / viewport.width; // 40px for padding

      // Render at device pixel ratio to avoid blurry canvas on high-DPI/mobile
      const outputScale = window.devicePixelRatio || 1;
      const scaledViewport = page.getViewport({ scale });

      // Set canvas dimensions (physical pixels) and CSS size (layout pixels)
      canvas.width = Math.floor(scaledViewport.width * outputScale);
      canvas.height = Math.floor(scaledViewport.height * outputScale);
      canvas.style.width = `${Math.floor(scaledViewport.width)}px`;
      canvas.style.height = `${Math.floor(scaledViewport.height)}px`;

      const renderContext = {
        canvasContext: canvas.getContext('2d'),
        viewport: scaledViewport,
        transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined
      };

      await page.render(renderContext).promise;

      // Update current page display
      controls.querySelector('.pdf-current-page').textContent = pageNum;

      // Update button states
      const prevBtn = controls.querySelector('.pdf-prev-btn');
      const nextBtn = controls.querySelector('.pdf-next-btn');
      prevBtn.disabled = pageNum === 1;
      nextBtn.disabled = pageNum === totalPages;
    }

    // Render first page
    await renderPage(1);

    // Add navigation event listeners
    controls.querySelector('.pdf-prev-btn').addEventListener('click', async () => {
      if (currentPage > 1) {
        currentPage--;
        await renderPage(currentPage);
      }
    });

    controls.querySelector('.pdf-next-btn').addEventListener('click', async () => {
      if (currentPage < totalPages) {
        currentPage++;
        await renderPage(currentPage);
      }
    });

  } catch (error) {
    console.error('Error rendering PDF with PDF.js:', error);
    container.innerHTML = `
      <div class="pdf-preview-error">
        <p>Failed to render PDF preview</p>
        <button onclick="downloadCurrentPdfPreview()" class="pdf-download-fallback-btn">Download PDF</button>
      </div>
    `;
  }
}

function setPdfPreviewDownloadState(isEnabled) {
  const button = elements.pdfPreviewDownloadBtn;
  if (!button) {
    return;
  }
  button.disabled = !isEnabled || !state.pdfPreviewUrl;
}

function downloadCurrentPdfPreview() {
  if (!state.pdfPreviewUrl) {
    return;
  }

  const link = document.createElement('a');
  link.href = state.pdfPreviewUrl;
  const cleanName = typeof getCleanNameForFilename === 'function'
    ? `${getCleanNameForFilename()} – resume.pdf`
    : 'resume.pdf';
  link.download = cleanName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Automatically close the preview modal after kicking off the download
  closePdfPreview();
}

function setPdfPreviewStatusText(message) {
  const statusEl = elements.pdfPreviewContainer.querySelector('.pdf-preview-status-text');
  if (statusEl) {
    statusEl.textContent = message;
  }
}

function clearPdfPreviewStatusMessages() {
  pdfPreviewDelayTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
  pdfPreviewDelayTimeouts = [];
}

function schedulePdfPreviewStatusMessage(delay, message) {
  const timeoutId = setTimeout(() => {
    setPdfPreviewStatusText(message);
  }, delay);
  pdfPreviewDelayTimeouts.push(timeoutId);
}

async function showPdfPreview() {
  if (!state.currentHtml) {
    return;
  }

  // Validate inputs so the preview matches the exported PDF
  if (!validateJson()) {
    return;
  }

  const selectedThemeObj = state.themes.find(t => t.name === state.selectedTheme);
  const needsColor = selectedThemeObj && !selectedThemeObj.monochromatic;

  if (needsColor && !state.selectedColor) {
    showError('Please select a color for this theme');
    return;
  }

  // Open modal immediately with a loading indicator
  showModal(elements.pdfPreviewModal);
  document.body.style.overflow = 'hidden';
  const PROGRESS_DURATION_MS = 2400;
  const DEFAULT_PREVIEW_STATUS_TEXT = 'Rendering a PDF preview...';

  setPdfPreviewDownloadState(false);
  clearPdfPreviewStatusMessages();
  elements.pdfPreviewContainer.innerHTML = `
    <div class="pdf-preview-placeholder">
      <div class="pdf-preview-progress" role="status" aria-live="polite" style="--pdf-preview-progress-duration: ${PROGRESS_DURATION_MS}ms">
        <div class="pdf-preview-progress-rocket" aria-hidden="true">
          <span class="rocket-emoji">🚀</span>
        </div>
        <div class="pdf-preview-progress-track">
          <div class="pdf-preview-progress-bar"></div>
        </div>
        <div class="pdf-preview-progress-glow"></div>
      </div>
      <p class="pdf-preview-status-text">${DEFAULT_PREVIEW_STATUS_TEXT}</p>
    </div>
  `;

  schedulePdfPreviewStatusMessage(
    PDF_PREVIEW_DELAY_THRESHOLDS.slow,
    'This is taking a bit longer than usual. Hang tight while we finish rendering.'
  );
  schedulePdfPreviewStatusMessage(
    PDF_PREVIEW_DELAY_THRESHOLDS.highTraffic,
    'Server resources are busy due to high traffic. Keep this window open or try again shortly.'
  );

  // Kick off rocket launch after the faux progress completes
  requestAnimationFrame(() => {
    const rocketEl = elements.pdfPreviewContainer.querySelector('.pdf-preview-progress-rocket');
    if (rocketEl) {
      setTimeout(() => rocketEl.classList.add('launching'), PROGRESS_DURATION_MS);
    }
  });

  try {
    const filteredData = getFilteredResumeData();
    const analyticsMeta = typeof buildAnalyticsMeta === 'function' ? buildAnalyticsMeta() : null;
    console.log('[Analytics] Sending PDF export request - _meta:', filteredData?._meta);

    // Get Turnstile token for security
    const turnstileToken = await getTurnstileToken();

    const response = await fetch('/api/export-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Turnstile-Token': turnstileToken
      },
      body: JSON.stringify({
        resumeData: filteredData,
        themeName: state.selectedTheme,
        colorName: state.selectedColor,
        photoBase64: state.photoBase64,
        customSectionNames: state.customSectionNames,
        showWatermark: state.showWatermark,
        tightLayout: state.tightLayout,
        analyticsMeta
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate PDF preview');
    }

    const blob = await response.blob();

    if (state.pdfPreviewUrl) {
      URL.revokeObjectURL(state.pdfPreviewUrl);
    }

    state.pdfPreviewUrl = window.URL.createObjectURL(blob);

    clearPdfPreviewStatusMessages();
    elements.pdfPreviewContainer.innerHTML = '';

    // Handle mobile devices differently - render PDF using PDF.js
    if (isMobileDevice()) {
      renderMobilePdfPreview(blob);
    } else {
      // Desktop: Use iframe as before
      const iframe = document.createElement('iframe');
      iframe.src = `${state.pdfPreviewUrl}#view=FitH`;
      iframe.className = 'pdf-preview-frame';
      iframe.title = 'PDF Preview';
      iframe.setAttribute('aria-label', 'PDF Preview');
      elements.pdfPreviewContainer.appendChild(iframe);
    }

    setPdfPreviewDownloadState(true);
  } catch (error) {
    console.error('Error generating PDF preview:', error);
    clearPdfPreviewStatusMessages();
    setPdfPreviewDownloadState(false);
    elements.pdfPreviewContainer.innerHTML = `
      <div class="pdf-preview-placeholder error">
        <p>Could not load the PDF preview.</p>
        <p class="pdf-preview-error-detail">${error.message}</p>
        <p class="pdf-preview-self-host">Need guaranteed availability? <a href="https://github.com/cre8ive-cv" target="_blank" rel="noopener">Self-host cre8ive.cv from GitHub</a>.</p>
      </div>
    `;
  } finally {
    // Reset Turnstile for next use
    resetTurnstile();
  }
}

function closePdfPreview() {
  hideModal(elements.pdfPreviewModal);
  document.body.style.overflow = 'auto';
  elements.pdfPreviewContainer.innerHTML = '';
  clearPdfPreviewStatusMessages();
  setPdfPreviewDownloadState(false);

  if (state.pdfPreviewUrl) {
    window.URL.revokeObjectURL(state.pdfPreviewUrl);
    state.pdfPreviewUrl = null;
  }
}

if (elements.pdfPreviewDownloadBtn) {
  elements.pdfPreviewDownloadBtn.addEventListener('click', downloadCurrentPdfPreview);
}
