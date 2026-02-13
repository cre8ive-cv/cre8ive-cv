// Helper functions to manage modal backdrop
let backdropHideTimer = null;

function showModalBackdrop() {
  const backdrop = document.getElementById('modal-backdrop');
  if (backdrop) {
    // Always cancel any pending hide operation
    if (backdropHideTimer) {
      clearTimeout(backdropHideTimer);
      backdropHideTimer = null;
    }
    // Add show class if not already present
    if (!backdrop.classList.contains('show')) {
      backdrop.classList.add('show');
    }
  }
}

function hideModalBackdrop() {
  const backdrop = document.getElementById('modal-backdrop');
  if (backdrop) {
    // Cancel any existing timer
    if (backdropHideTimer) {
      clearTimeout(backdropHideTimer);
      backdropHideTimer = null;
    }

    // Wait for modal content transition to complete (150ms) plus a small buffer
    backdropHideTimer = setTimeout(() => {
      requestAnimationFrame(() => {
        // Double-check if any modals are still open
        const anyModalOpen = Array.from(document.querySelectorAll('.modal.show')).length > 0;
        if (!anyModalOpen) {
          backdrop.classList.remove('show');
        }
        backdropHideTimer = null;
      });
    }, 200);
  }
}

function showModal(modal) {
  if (modal) {
    showModalBackdrop();
    modal.classList.add('show');
  }
}

function hideModal(modal) {
  if (modal) {
    modal.classList.remove('show');
    // Check backdrop after modal starts closing
    hideModalBackdrop();
  }
}

// Update button states
function updateButtonStates() {
  const hasTheme = state.selectedTheme !== null;
  const selectedThemeObj = state.themes.find(t => t.name === state.selectedTheme);
  const needsColor = selectedThemeObj && !selectedThemeObj.monochromatic;
  const hasColor = state.selectedColor !== null;
  const hasJsonText = elements.jsonEditor.value.trim().length > 0;
  const hasGeneratedHtml = Boolean(state.currentHtml);
  const hasResumeData = Boolean(state.resumeData);
  const acceptedTerms = Boolean(state.termsAccepted);

  // Update export button states
  const canRenderPreview = hasGeneratedHtml && acceptedTerms;
  const canExportJson = hasResumeData && acceptedTerms;
  elements.previewPdfBtn.disabled = !canRenderPreview;
  // Export button removed; handled via preview modal download
  elements.exportHtmlBtn.disabled = !canRenderPreview;
  elements.exportJsonBtn.disabled = !canExportJson;
  if (elements.previewPdfBtnDesktop) {
    elements.previewPdfBtnDesktop.disabled = !canRenderPreview;
  }
  if (elements.exportHtmlBtnDesktop) {
    elements.exportHtmlBtnDesktop.disabled = !canRenderPreview;
  }
  if (elements.exportJsonBtnDesktop) {
    elements.exportJsonBtnDesktop.disabled = !canExportJson;
  }

  updatePhotoButtonState(Boolean(state.photoBase64));
}

// Smoothly swap between two modals so the overlay does not blink
function transitionModals(hideModalEl, showModalEl, direction = 'forward') {
  const MODAL_SWAP_DELAY = 150; // matches CSS transition (0.15s)

  if (!showModalEl || hideModalEl === showModalEl) {
    if (hideModalEl && hideModalEl !== showModalEl) {
      hideModal(hideModalEl);
    }
    return;
  }

  // Show the backdrop if not already shown
  showModalBackdrop();

  // Store original values for cleanup
  const originalShowZIndex = showModalEl.style.zIndex;
  const originalHideZIndex = hideModalEl ? hideModalEl.style.zIndex : '';

  let hideContent = null;
  let originalHideBoxShadow = '';

  // Remove shadow from old modal to prevent overlap artifacts
  if (hideModalEl && hideModalEl !== showModalEl) {
    hideContent = hideModalEl.querySelector('.modal-content');
    if (hideContent) {
      originalHideBoxShadow = hideContent.style.boxShadow;
      hideContent.style.boxShadow = 'none';
    }
  }

  // Position new modal on top of the old one
  showModalEl.style.zIndex = '1001';

  // Show the new modal first - it will fade in on top
  showModalEl.classList.add('show');

  // After new modal is fully visible, hide the old one underneath
  // It won't be visible anyway since the new modal covers it
  if (hideModalEl && hideModalEl !== showModalEl) {
    setTimeout(() => {
      // Prevent shrinking animation on the old modal by locking the transform
      if (hideContent) {
        hideContent.style.transform = 'translateY(0) scale(1)';
      }
      
      hideModalEl.classList.remove('show');

      // Clean up after old modal finishes hiding
      setTimeout(() => {
        showModalEl.style.zIndex = originalShowZIndex;
        hideModalEl.style.zIndex = originalHideZIndex;
        if (hideContent) {
          hideContent.style.boxShadow = originalHideBoxShadow;
          hideContent.style.transform = ''; // Clear the transform override
        }
      }, MODAL_SWAP_DELAY + 50);
    }, MODAL_SWAP_DELAY);
  } else {
    // No modal to hide, just reset z-index after animation
    setTimeout(() => {
      showModalEl.style.zIndex = originalShowZIndex;
    }, MODAL_SWAP_DELAY + 50);
  }
}

// Generate preview
async function generatePreview() {
  // Auto-validate JSON before generating
  if (!validateJson()) {
    return;
  }

  const selectedThemeObj = state.themes.find(t => t.name === state.selectedTheme);
  const needsColor = selectedThemeObj && !selectedThemeObj.monochromatic;

  if (needsColor && !state.selectedColor) {
    showError('Please select a color for this theme');
    return;
  }

  const previousScroll = capturePreviewScrollPosition();

  showLoading(true);
  setPreviewStatus('Generating preview...', 'status-info');

  try {
    // Filter resume data to only include enabled sections
    const filteredData = getFilteredResumeData();
    if (!filteredData) {
      showError('Load resume data before exporting HTML');
      return;
    }

    const response = await fetch('/api/generate-html-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resumeData: filteredData,
        themeName: state.selectedTheme,
        colorName: state.selectedColor,
        photoBase64: state.photoBase64,
        customSectionNames: state.customSectionNames,
        showWatermark: state.showWatermark,
        layout: state.layout
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate preview');
    }

    const data = await response.json();
    state.currentHtml = data.html;
    state.previewScroll = previousScroll;

    // Mark JSON as no longer modified since we just generated
    state.jsonModified = false;

    // Display preview in iframe
    elements.previewContainer.innerHTML = '<iframe id="resumePreview"></iframe>';
    const iframe = document.getElementById('resumePreview');
    iframe.srcdoc = data.html;
    if (previousScroll && elements.previewContainer) {
      elements.previewContainer.scrollTop = previousScroll.containerScroll || 0;
    }
    restorePreviewScrollPosition(iframe);
    trackPreviewScroll(iframe);
    attachPreviewInteractionHandlers(iframe);

    resetPreviewStatus();
    updateButtonStates();
  } catch (error) {
    console.error('Error generating preview:', error);
    showError(error.message);
    setPreviewStatus(error.message, 'status-error');
  } finally {
    showLoading(false);
  }
}

// Export HTML preview to file
async function exportToHtml() {
  if (!validateJson()) {
    return;
  }

  const selectedThemeObj = state.themes.find(t => t.name === state.selectedTheme);
  const needsColor = selectedThemeObj && !selectedThemeObj.monochromatic;

  if (needsColor && !state.selectedColor) {
    showError('Please select a color for this theme');
    return;
  }

  try {
    // Ensure the preview HTML is up to date before exporting
    if (!state.currentHtml || state.jsonModified) {
      await generatePreview();
    }

    const filteredData = getFilteredResumeData();
    const analyticsMeta = buildAnalyticsMeta();

    // Get Turnstile token for security
    const turnstileToken = await getTurnstileToken();

    const response = await fetch('/api/export-html', {
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
        layout: state.layout,
        analyticsMeta
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to export HTML');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    // Use clean name format: "<full name> – resume.html"
    const cleanName = getCleanNameForFilename();
    a.download = `${cleanName} – resume.html`;

    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    flashPreviewStatus('HTML exported successfully', 'status-success');
  } catch (error) {
    console.error('Error exporting HTML:', error);
    showError(error.message || 'Failed to export HTML');
  } finally {
    // Reset Turnstile for next use
    resetTurnstile();
  }
}

// Export current configuration to JSON
async function exportToJson() {
  if (!validateJson()) {
    return;
  }

  const exportPayload = buildExportPayload();
  if (!exportPayload) {
    showError('Load resume data before exporting JSON');
    return;
  }
  const analyticsMeta = buildAnalyticsMeta();

  try {
    // Get Turnstile token for security
    const turnstileToken = await getTurnstileToken();

    const response = await fetch('/api/export-json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Turnstile-Token': turnstileToken
      },
      body: JSON.stringify({
        exportData: exportPayload,
        analyticsMeta
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to export JSON');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    // Use clean name format: "<full name> – resume.json"
    const cleanName = getCleanNameForFilename();
    a.download = `${cleanName} – resume.json`;

    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    flashPreviewStatus('Configuration exported as JSON', 'status-success');
  } catch (error) {
    console.error('Error exporting JSON:', error);
    showError(error.message || 'Failed to export JSON');
  } finally {
    // Reset Turnstile for next use
    resetTurnstile();
  }
}

// Get filtered resume data with only enabled sections
function getFilteredResumeData() {
  if (!state.resumeData) return null;

  const filtered = {};

  const orderedKeys = getOrderedSectionKeys(state.resumeData);

  orderedKeys.forEach(section => {
    if (ALL_SECTIONS.includes(section) &&
        state.enabledSections[section] &&
        state.resumeData[section] !== undefined) {
      filtered[section] = state.resumeData[section];
    }
  });

  filtered._meta = buildResumeMetaSnapshot();

  return filtered;
}

// Helper function to extract clean text from HTML and format for filename
function getCleanNameForFilename() {
  try {
    if (!state.resumeData?.personalInfo?.name) {
      return 'resume';
    }

    // Create a temporary element to parse HTML and extract text
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = state.resumeData.personalInfo.name;

    // Get text content (strips all HTML tags)
    let cleanName = tempDiv.textContent || tempDiv.innerText || '';

    // Trim and replace multiple spaces with single space
    cleanName = cleanName.trim().replace(/\s+/g, ' ');

    // If empty after cleaning, return default
    if (!cleanName) {
      return 'resume';
    }

    // Replace characters that are problematic in filenames
    // Keep letters, numbers, spaces, hyphens, and basic punctuation
    cleanName = cleanName.replace(/[<>:"/\\|?*]/g, '');

    return cleanName;
  } catch (error) {
    console.error('Error extracting clean name:', error);
    return 'resume';
  }
}

function buildOrderedEnabledSections(sourceData = state.resumeData, orderedSections = null) {
  const sectionOrder = Array.isArray(orderedSections) ? orderedSections : getExportSectionOrder();
  const orderedEnabledSections = {};

  sectionOrder.forEach(key => {
    if (!ALL_SECTIONS.includes(key)) {
      return;
    }
    if (Object.prototype.hasOwnProperty.call(state.enabledSections, key)) {
      orderedEnabledSections[key] = Boolean(state.enabledSections[key]);
    } else {
      orderedEnabledSections[key] = hasSectionContent(sourceData ? sourceData[key] : undefined);
    }
  });

  return orderedEnabledSections;
}

function buildResumeMetaSnapshot({
  sourceData = state.resumeData,
  orderedSections = null,
  enabledSectionsOverride = null
} = {}) {
  const resolvedEnabledSections = enabledSectionsOverride
    ? { ...enabledSectionsOverride }
    : buildOrderedEnabledSections(sourceData, orderedSections);

  return {
    version: state.appVersion,
    enabledSections: resolvedEnabledSections,
    selectedTheme: state.selectedTheme,
    selectedColor: state.selectedColor,
    showWatermark: state.showWatermark,
    layout: state.layout,
    customSectionNames: { ...state.customSectionNames }
  };
}

function buildExportPayload() {
  if (!state.resumeData) return null;

  const normalizedResumeData = normalizeResumeDataForExport(state.resumeData);
  const orderedSectionsForExport = getExportSectionOrder();

  // Build enabledSections with keys ordered to match the actual section order in resume data
  const orderedEnabledSections = {};
  orderedSectionsForExport.forEach(key => {
    if (ALL_SECTIONS.includes(key)) {
      if (state.enabledSections.hasOwnProperty(key)) {
        orderedEnabledSections[key] = Boolean(state.enabledSections[key]);
      } else {
        orderedEnabledSections[key] = hasSectionContent(normalizedResumeData[key]);
      }
    }
  });

  const exportData = {};
  orderedSectionsForExport.forEach(sectionKey => {
    const isRequiredSection = REQUIRED_SECTIONS.includes(sectionKey);
    const resolvedValue = getSectionValueForExport(sectionKey, normalizedResumeData);
    const enabledState = isRequiredSection
      ? true
      : state.enabledSections.hasOwnProperty(sectionKey)
        ? Boolean(state.enabledSections[sectionKey])
        : hasSectionContent(resolvedValue);

    exportData[sectionKey] = enabledState ? resolvedValue : null;
  });

  // Include any additional keys (e.g., projectsIntro) in stable order after the primary sections
  Object.keys(normalizedResumeData).forEach(key => {
    if (!exportData.hasOwnProperty(key)) {
      exportData[key] = normalizedResumeData[key];
    }
  });

  exportData._meta = buildResumeMetaSnapshot({
    sourceData: normalizedResumeData,
    orderedSections: orderedSectionsForExport,
    enabledSectionsOverride: orderedEnabledSections
  });
  exportData.photoBase64 = state.photoBase64 ?? null;

  return exportData;
}

function buildAnalyticsMeta() {
  const baseMeta = buildResumeMetaSnapshot();
  const storedMode = typeof loadDisplayMode === 'function' ? loadDisplayMode() : null;
  return {
    ...baseMeta,
    mode: storedMode || null,
    sourceUrl: window.location.href
  };
}

function deriveSectionOrderFromData(data, returnValueOnly = false) {
  const orderFromData = Object.keys(data || {}).filter(key => REORDERABLE_SECTIONS.includes(key));
  const derived = orderFromData.length ? orderFromData : [...REORDERABLE_SECTIONS];
  if (returnValueOnly) return derived;
  state.sectionOrder = derived;
  return derived;
}

function getExportSectionOrder() {
  const order = [];

  if (ALL_SECTIONS.includes('personalInfo')) {
    order.push('personalInfo');
  }
  const baseOrder = state.sectionOrder && state.sectionOrder.length
    ? [...state.sectionOrder]
    : deriveSectionOrderFromData(state.resumeData, true);

  baseOrder.forEach(key => {
    if (key !== 'personalInfo' && key !== 'gdprClause' && !order.includes(key)) {
      order.push(key);
    }
  });

  ALL_SECTIONS.forEach(key => {
    if (key !== 'gdprClause' && !order.includes(key)) {
      order.push(key);
    }
  });

  if (ALL_SECTIONS.includes('gdprClause')) {
    order.push('gdprClause');
  }

  return order;
}

function getOrderedSectionKeys(data = state.resumeData) {
  const keys = [];
  if (!data) return keys;

  const currentOrder = state.sectionOrder && state.sectionOrder.length
    ? state.sectionOrder
    : deriveSectionOrderFromData(data, true);

  if (data.personalInfo !== undefined) {
    keys.push('personalInfo');
  }

  currentOrder.forEach(key => {
    if (data[key] !== undefined && !keys.includes(key)) {
      keys.push(key);
    }
  });

  // Include any other keys not covered, excluding gdprClause until the end
  Object.keys(data).forEach(key => {
    if (!keys.includes(key) && key !== 'gdprClause') {
      keys.push(key);
    }
  });

  if (data.gdprClause !== undefined) {
    keys.push('gdprClause');
  }

  return keys;
}

function rebuildResumeDataWithOrder(data) {
  if (!data) return {};
  const orderedKeys = getOrderedSectionKeys(data);
  const newData = {};

  orderedKeys.forEach(key => {
    if (data[key] !== undefined) {
      newData[key] = data[key];
    }
  });

  return newData;
}

function getSectionValueForExport(sectionKey, normalizedResumeData) {
  if (sectionKey === 'personalInfo') {
    return normalizedResumeData.personalInfo;
  }

  if (ARRAY_SECTIONS.includes(sectionKey)) {
    const arrayValue = normalizedResumeData[sectionKey];
    return Array.isArray(arrayValue) ? arrayValue : [];
  }

  if (TEXTUAL_SECTIONS.includes(sectionKey)) {
    const textValue = normalizedResumeData[sectionKey];
    return typeof textValue === 'string' ? textValue : '';
  }

  return normalizedResumeData[sectionKey] !== undefined ? normalizedResumeData[sectionKey] : null;
}

// Apply meta settings from imported JSON (_meta)
function applyMetaSettings(meta, options = {}) {
  if (!meta) return;
  const { allowThemeOverride = true } = options;

  // Apply theme/color if available and valid
  if (allowThemeOverride && meta.selectedTheme) {
    const theme = state.themes.find(t => t.name === meta.selectedTheme);
    if (theme) {
      state.selectedTheme = meta.selectedTheme;
      elements.themeSelect.value = meta.selectedTheme;
      syncThemeDropupFromSelect();

      const isMonochromatic = theme.monochromatic;
      if (isMonochromatic) {
        elements.colorGroup.style.visibility = 'hidden';
        elements.colorGroup.style.pointerEvents = 'none';
      } else {
        elements.colorGroup.style.visibility = 'visible';
        elements.colorGroup.style.pointerEvents = 'auto';
      }

      if (!isMonochromatic && meta.selectedColor && state.colors.includes(meta.selectedColor)) {
        state.selectedColor = meta.selectedColor;
        state.lastSelectedColor = meta.selectedColor;
        elements.colorSelect.value = meta.selectedColor;
        syncColorDropupFromSelect();
      } else if (isMonochromatic) {
        if (meta.selectedColor && state.colors.includes(meta.selectedColor)) {
          state.lastSelectedColor = meta.selectedColor;
        }
        state.selectedColor = null;
        elements.colorSelect.value = '';
        syncColorDropupFromSelect();
      }
    }
  }

  // Note: photo is now handled separately in loadStateFromLocalStorage
  // This is kept for other callers of applyMetaSettings that may still use meta.photoBase64

  // Apply custom section names if available
  if (meta.customSectionNames) {
    state.customSectionNames = { ...meta.customSectionNames };
    migrateSummaryToBio(null, null, state.customSectionNames);
  }

  // Apply watermark setting (default to true if not specified)
  state.showWatermark = meta.showWatermark !== undefined ? meta.showWatermark : true;
  elements.showWatermarkCheckbox.checked = state.showWatermark;

  // Apply layout setting (with backward compat for old tightLayout boolean)
  if (meta.layout) {
    state.layout = meta.layout;
  } else {
    state.layout = meta.tightLayout === true ? 'compact' : 'standard';
  }
  syncLayoutDropupFromState();

  updateButtonStates();
}

// Smart JSON Fixer - Auto-corrects common JSON errors
function fixCommonJsonErrors(jsonString) {
  let fixed = jsonString;

  // Remove trailing commas before closing braces/brackets
  // Match: , followed by optional whitespace and then } or ]
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1');

  // Remove comments (// style)
  fixed = fixed.replace(/\/\/.*$/gm, '');

  // Remove comments (/* */ style)
  fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '');

  // Replace single quotes with double quotes for property names only
  // Be more conservative to avoid false positives
  fixed = fixed.replace(/([{,]\s*)('([^'\\]*(?:\\.[^'\\]*)*)')\s*:/g, function(match, prefix, quoted, key) {
    // Only replace if it looks like a property name
    return prefix + '"' + key + '":';
  });

  // Fix numbers with leading zeros (invalid in JSON), but not in strings
  fixed = fixed.replace(/:\s*0+(\d+)([,}\]\s])/g, ': $1$2');

  return fixed;
}

// UI Helper Functions
function showError(message) {
  setPreviewStatus(message, 'status-error');
}

function hideError() {
  resetPreviewStatus();
}

let previewStatusTimeout = null;

function buildPreviewLabel() {
  if (!state.currentHtml) return '';
  return '';
}

function setPreviewStatus(message, type = '') {
  elements.previewStatus.textContent = message;
  elements.previewStatus.className = `preview-status${type ? ` ${type}` : ''}`;

  // Also update mobile status element
  if (elements.mobilePreviewStatus) {
    elements.mobilePreviewStatus.textContent = message;
    elements.mobilePreviewStatus.className = `preview-status mobile-status${type ? ` ${type}` : ''}`;
  }
}

function resetPreviewStatus() {
  clearTimeout(previewStatusTimeout);
  setPreviewStatus(buildPreviewLabel());
}

function flashPreviewStatus(message, type = 'status-info', duration = 3000) {
  clearTimeout(previewStatusTimeout);
  setPreviewStatus(message, type);

  if (duration) {
    previewStatusTimeout = setTimeout(() => {
      resetPreviewStatus();
    }, duration);
  }
}

function showPreviewNotification(message) {
  flashPreviewStatus(message, 'status-success success-notification', 2500);
}

function showLoading(isLoading) {
  const previewButton = elements.previewPdfBtn;
  if (!previewButton) {
    return;
  }

  if (isLoading) {
    previewButton.classList.add('loading-preview');
    previewButton.disabled = true;
  } else {
    previewButton.classList.remove('loading-preview');
    updateButtonStates();
  }
}

let previewContainerScrollListenerAttached = false;

function getIframeScrollElement(doc) {
  if (!doc) return null;
  return doc.scrollingElement || doc.documentElement || doc.body || null;
}

function capturePreviewScrollPosition() {
  const containerScroll = elements.previewContainer?.scrollTop || 0;
  const iframe = document.getElementById('resumePreview');
  const doc = iframe?.contentDocument;
  const scrollEl = getIframeScrollElement(doc);

  if (!iframe || !doc || !scrollEl) return null;

  const scrollTop = scrollEl.scrollTop || 0;
  const scrollHeight = scrollEl.scrollHeight || 0;

  return {
    containerScroll,
    iframeScrollTop: scrollTop,
    iframeRatio: scrollHeight ? scrollTop / scrollHeight : 0
  };
}

function restorePreviewScrollPosition(iframe) {
  if (!iframe || !state.previewScroll) return;

  const applyScroll = () => {
    const doc = iframe.contentDocument;
    const scrollEl = getIframeScrollElement(doc);
    const saved = state.previewScroll;

    if (elements.previewContainer && saved.containerScroll !== undefined) {
      elements.previewContainer.scrollTop = saved.containerScroll || 0;
    }

    if (!doc || !scrollEl) return;

    const scrollHeight = scrollEl.scrollHeight || 0;
    const absoluteTarget = Math.min(saved.iframeScrollTop || 0, scrollHeight || 0);
    const ratioTarget = scrollHeight ? Math.round(scrollHeight * saved.iframeRatio) : absoluteTarget;
    const target = Number.isFinite(ratioTarget) ? ratioTarget : absoluteTarget;

    scrollEl.scrollTop = target;
  };

  const retryAttempts = 6;
  const scheduleApply = (remaining) => {
    const run = () => {
      applyScroll();
      if (remaining > 0) {
        requestAnimationFrame(() => scheduleApply(remaining - 1));
      }
    };
    requestAnimationFrame(run);
  };

  const onLoad = () => scheduleApply(retryAttempts);

  if (iframe.contentDocument?.readyState === 'complete') {
    onLoad();
  } else {
    iframe.addEventListener('load', onLoad, { once: true });
  }
}

function trackPreviewScroll(iframe) {
  if (!iframe) return;

  const ensureContainerListener = () => {
    if (previewContainerScrollListenerAttached || !elements.previewContainer) return;

    elements.previewContainer.addEventListener(
      'scroll',
      () => {
        state.previewScroll = {
          ...(state.previewScroll || {}),
          containerScroll: elements.previewContainer.scrollTop || 0
        };
      },
      { passive: true }
    );

    previewContainerScrollListenerAttached = true;
  };

  const attachListener = () => {
    const doc = iframe.contentDocument;
    const scrollEl = getIframeScrollElement(doc);
    if (!doc || !scrollEl) return;
    ensureContainerListener();

    const updatePosition = () => {
      const scrollTop = scrollEl.scrollTop || 0;
      const scrollHeight = scrollEl.scrollHeight || 0;

      state.previewScroll = {
        ...(state.previewScroll || {}),
        iframeScrollTop: scrollTop,
        iframeRatio: scrollHeight ? scrollTop / scrollHeight : 0,
        containerScroll: elements.previewContainer?.scrollTop || 0
      };
    };

    scrollEl.addEventListener('scroll', updatePosition, { passive: true });
    updatePosition();
  };

  if (iframe.contentDocument?.readyState === 'complete') {
    attachListener();
  } else {
    iframe.addEventListener('load', attachListener, { once: true });
  }
}

// Auto-generate preview if all conditions are met
async function autoGeneratePreview(changeType) {
  // Check if we have all necessary data
  const hasJsonText = elements.jsonEditor.value.trim().length > 0;
  const hasTheme = state.selectedTheme !== null;
  const selectedThemeObj = state.themes.find(t => t.name === state.selectedTheme);
  const needsColor = selectedThemeObj && !selectedThemeObj.monochromatic;
  const hasColor = state.selectedColor !== null;

  if (hasJsonText && hasTheme && (!needsColor || hasColor)) {
    await generatePreview();

    // Show user-friendly notification based on what changed
    let message = '';
    switch (changeType) {
      case 'theme':
        message = `✓ Preview updated with ${state.selectedTheme} theme`;
        break;
      case 'color':
        message = `✓ Preview updated with ${state.selectedColor} color`;
        break;
      case 'photo':
        message = '✓ Preview updated with your photo';
        break;
      case 'json':
        message = '✓ Preview generated with your resume data';
        break;
      case 'section-reorder':
        message = '✓ Preview updated with new section order';
        break;
      case 'section-edit':
        message = '✓ Preview updated with section changes';
        break;
      case 'section-toggle':
        message = '✓ Preview updated with section visibility';
        break;
      default:
        message = '✓ Preview regenerated';
    }

    showPreviewNotification(message);
  }
}

// Debounce helper function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Real-time JSON validation
const validateJsonRealtime = debounce(() => {
  if (!state.codeMirrorEditor) return;

  const jsonText = state.codeMirrorEditor.getValue().trim();

  if (!jsonText) {
    clearJsonErrors();
    hideError();
    return;
  }

  try {
    // Try to parse JSON
    JSON.parse(jsonText);

    // If successful, clear any errors
    clearJsonErrors();
    hideError();
  } catch (error) {
    // If there's an error, highlight it
    clearJsonErrors();
    highlightJsonError(jsonText, error);
    showError(`JSON Error: ${error.message}`);
  }
}, 500); // Wait 500ms after user stops typing

// Debounced preview after skill weight tweaks to avoid spamming renders
const debouncedSkillPreview = debounce(() => {
  autoGeneratePreview('section-edit');
}, 400);
