// LocalStorage persistence functions
const RESUME_STORAGE_KEY = 'resumeData';
const LEGACY_STORAGE_KEY = 'resumeGenerator';
const MODE_STORAGE_KEY = 'mode';
const TERMS_ACCEPTED_STORAGE_KEY = 'termsAccepted';
const MODE_ICON_MAP = {
  contrast: '',
  sun: `<img src="assets/mode_icons/light.png" alt="Light mode" class="mode-switcher-icon-img">`,
  moon: `<img src="assets/mode_icons/dark.png" alt="Dark mode" class="mode-switcher-icon-img">`,
  hacker: `<img src="assets/mode_icons/hacker.png" alt="Hacker mode" class="mode-switcher-icon-img">`
};

// Normalize legacy data that used the "summary" key to the new personalInfo.bio key
function migrateSummaryToBio(resumeData, enabledSections, customSectionNames) {
  let changed = false;

  if (resumeData) {
    if (!resumeData.personalInfo || typeof resumeData.personalInfo !== 'object') {
      resumeData.personalInfo = {};
      changed = true;
    }
    if (Object.prototype.hasOwnProperty.call(resumeData, 'summary')) {
      if (!resumeData.personalInfo.bio && typeof resumeData.summary === 'string') {
        resumeData.personalInfo.bio = resumeData.summary;
      }
      delete resumeData.summary;
      changed = true;
    }
    if (Object.prototype.hasOwnProperty.call(resumeData, 'bio')) {
      if (!resumeData.personalInfo.bio && typeof resumeData.bio === 'string') {
        resumeData.personalInfo.bio = resumeData.bio;
      }
      delete resumeData.bio;
      changed = true;
    }
  }

  if (enabledSections) {
    if (Object.prototype.hasOwnProperty.call(enabledSections, 'summary')) {
      delete enabledSections.summary;
      changed = true;
    }
    if (Object.prototype.hasOwnProperty.call(enabledSections, 'bio')) {
      delete enabledSections.bio;
      changed = true;
    }
  }

  if (customSectionNames) {
    if (Object.prototype.hasOwnProperty.call(customSectionNames, 'summary')) {
      delete customSectionNames.summary;
      changed = true;
    }
    if (Object.prototype.hasOwnProperty.call(customSectionNames, 'bio')) {
      delete customSectionNames.bio;
      changed = true;
    }
  }

  return changed;
}

function saveStateToLocalStorage() {
  try {
    if (!state.resumeData) {
      localStorage.removeItem(RESUME_STORAGE_KEY);
      return;
    }

    const dataToSave = buildExportPayload();
    if (dataToSave) {
      localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(dataToSave));
    }

    // Check storage size as a warning
    const storageSize = new Blob([localStorage.getItem(RESUME_STORAGE_KEY)]).size;
    if (storageSize > 4 * 1024 * 1024) { // Warn if over 4MB
      console.warn('LocalStorage data is large:', (storageSize / 1024 / 1024).toFixed(2), 'MB');
    }
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
    // If quota exceeded, show message to user
    if (error.name === 'QuotaExceededError') {
      showError('Storage quota exceeded. Consider using a smaller photo or clearing old data.');
    }
  }
}

function loadStateFromLocalStorage() {
  try {
    const savedData = localStorage.getItem(RESUME_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!savedData) {
      return false;
    }

    const parsedData = JSON.parse(savedData);
    const hasMeta = parsedData && typeof parsedData === 'object' && Object.prototype.hasOwnProperty.call(parsedData, '_meta');
    const isLegacyShape = parsedData && typeof parsedData === 'object' && Object.prototype.hasOwnProperty.call(parsedData, 'resumeData');

    const meta = hasMeta
      ? parsedData._meta
      : isLegacyShape
        ? {
            enabledSections: parsedData.enabledSections,
            selectedTheme: parsedData.selectedTheme,
            selectedColor: parsedData.selectedColor,
            showWatermark: parsedData.showWatermark,
            customSectionNames: parsedData.customSectionNames,
            photoBase64: parsedData.photoBase64
          }
        : null;

    // Extract photoBase64 from root level (new format) or from _meta (legacy format)
    const photoBase64 = parsedData.photoBase64 || meta?.photoBase64 || null;

    const resumePayload = (() => {
      if (hasMeta) {
        const data = { ...parsedData };
        delete data._meta;
        delete data.photoBase64;
        return data;
      }
      if (isLegacyShape) return parsedData.resumeData;
      return parsedData;
    })();

    if (!resumePayload) {
      return false;
    }

    migrateSummaryToBio(resumePayload, meta?.enabledSections, meta?.customSectionNames);
    ensurePersonalInfoBio(resumePayload);
    state.resumeData = resumePayload;
    deriveSectionOrderFromData(state.resumeData);

    elements.jsonEditor.value = JSON.stringify(state.resumeData, null, 2);

    initializeEnabledSections(resumePayload);
    if (meta?.enabledSections) {
      state.enabledSections = { ...meta.enabledSections };
      migrateSummaryToBio(null, state.enabledSections);
    }

    if (meta?.customSectionNames) {
      state.customSectionNames = { ...meta.customSectionNames };
      migrateSummaryToBio(null, null, state.customSectionNames);
    }

    // Set photo from extracted value
    state.photoBase64 = photoBase64;
    updatePhotoButtonState(!!state.photoBase64);

    applyMetaSettings(meta);

    updateSectionManagementUI();
    state.templateLoaded = true;
    console.log('Loaded resume data from localStorage');
    return true;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return false;
  }
}

function clearAllLocalStorage() {
  try {
    localStorage.removeItem(RESUME_STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    // intentionally keep MODE_STORAGE_KEY to preserve user preference
    console.log('Cleared resume data from localStorage');
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
}

function saveDisplayMode(modeName) {
  try {
    localStorage.setItem(MODE_STORAGE_KEY, modeName);
  } catch (error) {
    console.error('Failed to save mode to localStorage:', error);
  }
}

function loadDisplayMode() {
  try {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    const storedMode = localStorage.getItem(MODE_STORAGE_KEY);
    if (storedMode) {
      return storedMode;
    }
  } catch (error) {
    console.error('Failed to load mode from localStorage:', error);
  }

  return null;
}

function getDisplayMode(modeName) {
  return AVAILABLE_DISPLAY_MODES.find(mode => mode.name === modeName);
}

function getNextDisplayMode(currentModeName) {
  const currentIndex = AVAILABLE_DISPLAY_MODES.findIndex(mode => mode.name === currentModeName);
  if (currentIndex === -1) return AVAILABLE_DISPLAY_MODES[0];
  return AVAILABLE_DISPLAY_MODES[(currentIndex + 1) % AVAILABLE_DISPLAY_MODES.length] || AVAILABLE_DISPLAY_MODES[0];
}

function getModeIconMarkup(modeName) {
  const mode = getDisplayMode(modeName);
  if (!mode) return '';
  return MODE_ICON_MAP[mode.icon] || '';
}

function getStoredTermsAcceptance() {
  try {
    const storedValue = localStorage.getItem(TERMS_ACCEPTED_STORAGE_KEY);
    if (storedValue === null) {
      localStorage.setItem(TERMS_ACCEPTED_STORAGE_KEY, 'false');
      return false;
    }
    return storedValue === 'true';
  } catch (error) {
    console.error('Failed to read terms acceptance from localStorage:', error);
    return false;
  }
}

function setStoredTermsAcceptance(isAccepted) {
  try {
    localStorage.setItem(TERMS_ACCEPTED_STORAGE_KEY, isAccepted ? 'true' : 'false');
  } catch (error) {
    console.error('Failed to save terms acceptance to localStorage:', error);
  }
}

function initializeTermsAcceptance() {
  state.termsAccepted = getStoredTermsAcceptance();
  if (elements.termsAcceptanceCheckbox) {
    elements.termsAcceptanceCheckbox.checked = state.termsAccepted;
  }
  if (elements.termsAcceptanceCheckboxDesktop) {
    elements.termsAcceptanceCheckboxDesktop.checked = state.termsAccepted;
  }
}

function updateModeSwitcherUI() {
  if (!elements.modeSwitcher) return;
  const currentMode = getDisplayMode(state.displayMode) || getDisplayMode(DEFAULT_DISPLAY_MODE);

  if (elements.modeSwitcherIcon) {
    const modeIconKey = currentMode?.icon || 'contrast';
    const iconMarkup = MODE_ICON_MAP[modeIconKey] || '';
    elements.modeSwitcherIcon.innerHTML = iconMarkup;
    elements.modeSwitcherIcon.classList.toggle('hacker-icon', state.displayMode === 'hacker');
  }

  if (elements.modeSwitcherToggle && currentMode) {
    elements.modeSwitcherToggle.setAttribute('aria-label', `${currentMode.label} active. Open mode menu`);
  }

  if (!elements.modeSwitcherMenu) return;

  elements.modeSwitcherMenu.innerHTML = '';
  const fragment = document.createDocumentFragment();
  let hasOptions = false;
  AVAILABLE_DISPLAY_MODES.forEach(mode => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mode-switcher-option';
    button.dataset.mode = mode.name;
    button.setAttribute('role', 'menuitem');
    button.innerHTML = `${getModeIconMarkup(mode.name)}<span>${mode.label}</span>`;
    button.classList.toggle('selected', mode.name === state.displayMode);
    button.addEventListener('click', () => {
      applyDisplayMode(mode.name);
      setModeMenuVisibility(false);
    });
    fragment.appendChild(button);
    hasOptions = true;
  });

  if (!hasOptions) {
    const emptyState = document.createElement('div');
    emptyState.className = 'mode-switcher-empty';
    emptyState.textContent = 'More modes coming soon';
    fragment.appendChild(emptyState);
  }

  elements.modeSwitcherMenu.appendChild(fragment);
}

function setModeMenuVisibility(isVisible) {
  if (elements.modeSwitcherToggle) {
    elements.modeSwitcherToggle.setAttribute('aria-expanded', isVisible ? 'true' : 'false');
  }
  if (elements.modeSwitcher) {
    elements.modeSwitcher.classList.toggle('open', Boolean(isVisible));
    if (!isVisible) {
      elements.modeSwitcher.classList.add('closing');
      setTimeout(() => {
        elements.modeSwitcher && elements.modeSwitcher.classList.remove('closing');
      }, 160);
    } else {
      elements.modeSwitcher.classList.remove('closing');
    }
    elements.modeSwitcher.classList.toggle('hacker-active', state.displayMode === 'hacker');
  }
}

function applyDisplayMode(modeName, options = {}) {
  const { skipSave = false } = options;
  const targetMode = getDisplayMode(modeName) || getDisplayMode(DEFAULT_DISPLAY_MODE);

  if (!targetMode) return;

  state.displayMode = targetMode.name;
  document.documentElement.setAttribute('data-mode', state.displayMode);
  updateModeSwitcherUI();
  if (elements.modeSwitcher) {
    elements.modeSwitcher.classList.toggle('hacker-active', state.displayMode === 'hacker');
  }

  if (!skipSave) {
    saveDisplayMode(state.displayMode);
  }
}

function handleModeToggle() {
  const isOpen = elements.modeSwitcher?.classList.contains('open');
  setModeMenuVisibility(!isOpen);
}
