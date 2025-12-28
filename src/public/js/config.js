// Load application configuration
async function loadConfig() {
  try {
    const response = await fetch('/api/config');
    if (response.ok) {
      const config = await response.json();
      state.appVersion = config.version;
      console.log(`App version: ${config.version}`);

      const normalizedTheme = typeof config.defaultTheme === 'string' ? config.defaultTheme.toLowerCase() : null;
      const normalizedColor = typeof config.defaultColor === 'string' ? config.defaultColor.toLowerCase() : null;
      const normalizedMode = typeof config.defaultMode === 'string' ? config.defaultMode.toLowerCase() : null;
      const resolvedMode = getDisplayMode(normalizedMode)?.name || DEFAULT_DISPLAY_MODE;

      state.configDefaults = {
        theme: normalizedTheme || CONFIG_FALLBACK_THEME,
        color: normalizedColor || CONFIG_FALLBACK_COLOR,
        mode: resolvedMode
      };
      if (config.limits) {
        state.configLimits = {
          maxResumeJsonBytes: Number(config.limits.maxResumeJsonBytes) || state.configLimits.maxResumeJsonBytes,
          maxPhotoBase64Bytes: Number(config.limits.maxPhotoBase64Bytes) || state.configLimits.maxPhotoBase64Bytes
        };
      }
      state.displayMode = getPreferredModeName();

      // Update logo link with appUrl from config
      if (config.appUrl) {
        if (elements.logoTitleLink) {
          elements.logoTitleLink.href = config.appUrl;
        }
      }
    } else {
      console.warn('Failed to load config, version will be null');
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
}

// Initialize mobile view mode (default to preview on mobile/tablet)
function initializeMobileViewMode() {
  // Always default to preview mode on mobile/tablet (1024px and below)
  if (window.innerWidth <= 1024) {
    document.body.classList.add('mobile-preview-mode');
    if (elements.mobileEditorOption) {
      elements.mobileEditorOption.classList.remove('active');
    }
    if (elements.mobilePreviewOption) {
      elements.mobilePreviewOption.classList.add('active');
    }
  }
}

// Initialize app
async function init() {
  await loadConfig();
  await loadThemes();
  await loadColors();
  initializeTermsAcceptance();

  // Try to load saved state from localStorage
  const loaded = loadStateFromLocalStorage();
  const storedMode = loadDisplayMode();
  const initialMode = storedMode || state.displayMode || DEFAULT_DISPLAY_MODE;
  applyDisplayMode(initialMode, { skipSave: Boolean(storedMode) });
  if (!storedMode) {
    saveDisplayMode(initialMode);
  }
  if (loaded && state.resumeData) {
    // Transform button to "Clear Data" mode
    const btn = elements.loadExampleBtn;
    btn.className = 'btn btn-danger';
    btn.innerHTML = '<i class="fas fa-trash-alt"></i> Clear All Data';

    // Generate preview first, then show success message
    setPreviewStatus('Restoring previous session...', 'status-info');
    await autoGeneratePreview('restore');
    flashPreviewStatus('Previous session restored from browser storage', 'status-success');
  } else {
    // Automatically load the starter template on first visit
    setPreviewStatus('Loading starter template...', 'status-info');
    await loadExampleData();
  }

  setupEventListeners();
  updateButtonStates();
  initializeSidebarControlWidths();
  initializeMobileViewMode();
  initializeMobileEditorActions();

  // Hide the mode loader with smooth fade-out
  const loader = document.getElementById('mode-loader');
  if (loader) {
    loader.classList.add('loaded');
    // Remove from DOM after fade animation completes
    setTimeout(() => loader.remove(), 500);
  }
}
