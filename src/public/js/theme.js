// Load available themes
async function loadThemes() {
  try {
    const response = await fetch('/api/themes');
    state.themes = await response.json();

    // Sort themes to put configured default first
    const preferredThemeName = getPreferredThemeName();
    state.themes.sort((a, b) => {
      if (a.name === preferredThemeName) return -1;
      if (b.name === preferredThemeName) return 1;
      return a.name.localeCompare(b.name);
    });

    elements.themeSelect.innerHTML = '';
    state.themes.forEach(theme => {
      const option = document.createElement('option');
      option.value = theme.name;
      option.textContent = formatThemeLabel(theme.name);
      option.dataset.monochromatic = theme.monochromatic;
      elements.themeSelect.appendChild(option);
    });

    // Set default theme as selected
    const defaultTheme =
      state.themes.find(t => t.name === preferredThemeName) || state.themes[0];
    if (defaultTheme) {
      state.selectedTheme = defaultTheme.name;
      elements.themeSelect.value = defaultTheme.name;

      // Show color selector if default theme is not monochromatic
      if (!defaultTheme.monochromatic) {
        elements.colorGroup.style.visibility = 'visible';
        elements.colorGroup.style.pointerEvents = 'auto';
      }
    }

    buildThemeDropupOptions();
    syncThemeDropupFromSelect();

    // Update button states after theme is set
    updateButtonStates();
  } catch (error) {
    console.error('Error loading themes:', error);
    flashPreviewStatus('Error loading themes', 'status-error');
  }
}

function formatThemeLabel(themeName) {
  if (themeName === 'cre8ive') return 'cre8ive';
  return themeName.charAt(0).toUpperCase() + themeName.slice(1);
}

function applyThemeLabelStyle(element, themeValue) {
  if (!element) return;
  if (themeValue === 'cre8ive') {
    element.style.backgroundImage = 'linear-gradient(135deg, #64B5F6 0%, #42A5F5 50%, #2196F3 100%)';
    element.style.webkitBackgroundClip = 'text';
    element.style.backgroundClip = 'text';
    element.style.webkitTextFillColor = 'transparent';
    element.style.color = 'transparent';
    return;
  }
  if (themeValue === 'terminal') {
    element.style.backgroundImage = '';
    element.style.webkitBackgroundClip = '';
    element.style.backgroundClip = '';
    element.style.webkitTextFillColor = '';
    element.style.color = '#67f088';
    return;
  }

  element.style.backgroundImage = '';
  element.style.webkitBackgroundClip = '';
  element.style.backgroundClip = '';
  element.style.webkitTextFillColor = '';
  element.style.color = '';
}

function buildThemeDropupOptions() {
  if (!elements.themeDropupMenu) return;
  elements.themeDropupMenu.innerHTML = '';
  const fragment = document.createDocumentFragment();

  Array.from(elements.themeSelect.options).forEach(option => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dropup-option';
    btn.textContent = option.textContent;
    btn.dataset.value = option.value;
    const font = THEME_FONT_MAP[option.value] || THEME_FONT_MAP.default;
    btn.style.fontFamily = font;
    applyThemeLabelStyle(btn, option.value);
    btn.addEventListener('click', () => {
      closeThemeDropup();
      if (elements.themeSelect.value !== option.value) {
        elements.themeSelect.value = option.value;
        elements.themeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        syncThemeDropupFromSelect();
      }
    });
    fragment.appendChild(btn);
  });

  elements.themeDropupMenu.appendChild(fragment);
  syncThemeDropupFromSelect();
}

function syncThemeDropupFromSelect() {
  if (!elements.themeDropupLabel) return;
  const selectedOption = elements.themeSelect.options[elements.themeSelect.selectedIndex];
  elements.themeDropupLabel.textContent = selectedOption ? selectedOption.textContent : '';
  const font = selectedOption ? (THEME_FONT_MAP[selectedOption.value] || THEME_FONT_MAP.default) : THEME_FONT_MAP.default;
  if (elements.themeDropupLabel) {
    elements.themeDropupLabel.style.fontFamily = font;
    applyThemeLabelStyle(elements.themeDropupLabel, selectedOption?.value);
  }
  if (elements.themeDropupButton) {
    elements.themeDropupButton.style.fontFamily = font;
  }

  if (elements.themeDropupMenu) {
    elements.themeDropupMenu.querySelectorAll('.dropup-option').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.value === elements.themeSelect.value);
    });
  }

  if (elements.themeDropupButton) {
    const isOpen = elements.themeDropup?.classList.contains('open');
    elements.themeDropupButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }
}

function toggleThemeDropup(event) {
  if (!elements.themeDropup) return;
  event.stopPropagation();
  if (elements.themeDropupMenu?.children.length === 0) {
    buildThemeDropupOptions();
  }
  const isOpen = elements.themeDropup.classList.toggle('open');
  elements.themeDropupButton?.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

function closeThemeDropup() {
  if (!elements.themeDropup) return;
  elements.themeDropup.classList.remove('open');
  elements.themeDropupButton?.setAttribute('aria-expanded', 'false');
}

function getColorPreviewValue(colorName) {
  if (!colorName) return null;
  const entry = state.colorPalettes[colorName.toLowerCase()];
  if (!entry) return null;
  return entry.accent || entry.primary;
}

function buildColorDropupOptions() {
  if (!elements.colorDropupMenu) return;
  elements.colorDropupMenu.innerHTML = '';
  const fragment = document.createDocumentFragment();

  Array.from(elements.colorSelect.options).forEach(option => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dropup-option';
    btn.innerHTML = `
      <span class="dropup-label">${option.textContent}</span>
      <span class="dropup-swatch" data-color="${option.value}"></span>
    `;
    btn.dataset.value = option.value;
    btn.addEventListener('click', () => {
      closeColorDropup();
      if (elements.colorSelect.value !== option.value) {
        elements.colorSelect.value = option.value;
        elements.colorSelect.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        syncColorDropupFromSelect();
      }
    });
    fragment.appendChild(btn);
  });

  elements.colorDropupMenu.appendChild(fragment);
  syncColorDropupFromSelect();
}

function syncColorDropupFromSelect() {
  if (!elements.colorDropupLabel) return;
  const selectedOption = elements.colorSelect.options[elements.colorSelect.selectedIndex];
  elements.colorDropupLabel.textContent = selectedOption ? selectedOption.textContent : '';

  if (elements.colorDropupMenu) {
    elements.colorDropupMenu.querySelectorAll('.dropup-option').forEach(btn => {
      const isSelected = btn.dataset.value === elements.colorSelect.value;
      btn.classList.toggle('selected', isSelected);
      const swatch = btn.querySelector('.dropup-swatch');
      if (swatch) {
        const previewColor = getColorPreviewValue(btn.dataset.value);
        swatch.style.background = previewColor || 'var(--accent-primary)';
        swatch.style.borderColor = 'var(--border-color)';
      }
    });
  }

  if (elements.colorDropupSwatch) {
    const previewColor = getColorPreviewValue(elements.colorSelect.value);
    elements.colorDropupSwatch.style.background = previewColor || 'var(--accent-primary)';
    elements.colorDropupSwatch.style.borderColor = 'var(--border-color)';
  }

  if (elements.colorDropupButton) {
    const isOpen = elements.colorDropup?.classList.contains('open');
    elements.colorDropupButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }
}

function toggleColorDropup(event) {
  if (!elements.colorDropup) return;
  event.stopPropagation();
  if (elements.colorDropupMenu?.children.length === 0) {
    buildColorDropupOptions();
  }
  const isOpen = elements.colorDropup.classList.toggle('open');
  elements.colorDropupButton?.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

function closeColorDropup() {
  if (!elements.colorDropup) return;
  elements.colorDropup.classList.remove('open');
  elements.colorDropupButton?.setAttribute('aria-expanded', 'false');
}

const LAYOUT_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'compact', label: 'Compact' },
  { value: 'sidebar', label: 'Sidebar' }
];

function buildLayoutDropupOptions() {
  if (!elements.layoutDropupMenu) return;
  elements.layoutDropupMenu.innerHTML = '';
  const fragment = document.createDocumentFragment();

  LAYOUT_OPTIONS.forEach(option => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dropup-option';
    btn.textContent = option.label;
    btn.dataset.value = option.value;
    btn.addEventListener('click', () => {
      closeLayoutDropup();
      if (state.layout !== option.value) {
        handleLayoutChange(option.value);
      }
    });
    fragment.appendChild(btn);
  });

  elements.layoutDropupMenu.appendChild(fragment);
  syncLayoutDropupFromState();
}

function syncLayoutDropupFromState() {
  if (!elements.layoutDropupLabel) return;
  const current = LAYOUT_OPTIONS.find(o => o.value === state.layout) || LAYOUT_OPTIONS[0];
  elements.layoutDropupLabel.textContent = current.label;

  if (elements.layoutDropupMenu) {
    elements.layoutDropupMenu.querySelectorAll('.dropup-option').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.value === state.layout);
    });
  }
}

function toggleLayoutDropup(event) {
  if (!elements.layoutDropup) return;
  event.stopPropagation();
  if (elements.layoutDropupMenu?.children.length === 0) {
    buildLayoutDropupOptions();
  }
  const isOpen = elements.layoutDropup.classList.toggle('open');
  elements.layoutDropupButton?.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

function closeLayoutDropup() {
  if (!elements.layoutDropup) return;
  elements.layoutDropup.classList.remove('open');
  elements.layoutDropupButton?.setAttribute('aria-expanded', 'false');
}

function handleDropupOutsideInteraction(event) {
  const target = event.target;

  if (elements.themeDropup?.classList.contains('open') && !elements.themeDropup.contains(target)) {
    closeThemeDropup();
  }

  if (elements.colorDropup?.classList.contains('open') && !elements.colorDropup.contains(target)) {
    closeColorDropup();
  }

  if (elements.layoutDropup?.classList.contains('open') && !elements.layoutDropup.contains(target)) {
    closeLayoutDropup();
  }
}

function attachPreviewInteractionHandlers(iframe) {
  if (!iframe) return;

  // The iframe has pointer-events: none so events never reach the iframe
  // document. Listen on the parent container instead — any click/tap in the
  // preview area (which passes through to the parent) will close open dropups.
  const container = iframe.closest
    ? (iframe.closest('.preview-container') || elements.previewContainer)
    : elements.previewContainer;

  if (!container) return;

  container.addEventListener(
    'pointerdown',
    () => {
      closeThemeDropup();
      closeColorDropup();
      closeLayoutDropup();
    },
    { passive: true }
  );
}

// Load available colors
async function loadColors() {
  try {
    const response = await fetch('/api/colors');
    const colorData = await response.json();

    const normalizedColors = (Array.isArray(colorData) ? colorData : []).map(item => {
      if (typeof item === 'string') {
        return { name: item, palette: null };
      }
      return { name: item.name, palette: item.palette || null };
    });

    // Sort colors to put configured default first
    const preferredColorName = getPreferredColorName();
    normalizedColors.sort((a, b) => {
      if (a.name === preferredColorName) return -1;
      if (b.name === preferredColorName) return 1;
      return a.name.localeCompare(b.name);
    });

    state.colorPalettes = normalizedColors.reduce((acc, color) => {
      if (color.name && color.palette) {
        acc[color.name] = color.palette;
      }
      return acc;
    }, {});

    state.colors = normalizedColors.map(c => c.name);

    elements.colorSelect.innerHTML = '';
    state.colors.forEach(color => {
      const option = document.createElement('option');
      option.value = color;
      option.textContent = color.charAt(0).toUpperCase() + color.slice(1);
      elements.colorSelect.appendChild(option);
    });
    const defaultColor =
      state.colors.find(color => color === preferredColorName) || state.colors[0] || null;
    if (defaultColor) {
      state.selectedColor = defaultColor;
      state.lastSelectedColor = defaultColor;
      elements.colorSelect.value = defaultColor;
    } else {
      state.selectedColor = null;
      state.lastSelectedColor = null;
      elements.colorSelect.value = '';
    }
    buildColorDropupOptions();
    syncColorDropupFromSelect();

    // Update button states after color is set
    updateButtonStates();
  } catch (error) {
    console.error('Error loading colors:', error);
    flashPreviewStatus('Error loading colors', 'status-error');
  }
}

// Handle theme selection
async function handleThemeChange(event) {
  const selectedOption = event.target.selectedOptions[0];
  state.selectedTheme = event.target.value;
  syncThemeDropupFromSelect();
  closeThemeDropup();

  if (state.selectedTheme) {
    const isMonochromatic = selectedOption.dataset.monochromatic === 'true';

    if (isMonochromatic) {
      if (state.selectedColor) {
        state.lastSelectedColor = state.selectedColor;
      }
      elements.colorGroup.style.visibility = 'hidden';
      elements.colorGroup.style.pointerEvents = 'none';
      state.selectedColor = null;
      elements.colorSelect.value = '';
      syncColorDropupFromSelect();
    } else {
      elements.colorGroup.style.visibility = 'visible';
      elements.colorGroup.style.pointerEvents = 'auto';
      const preferredColor = getPreferredColorName();
      const desiredColor = state.selectedColor || state.lastSelectedColor;
      const resolvedColor =
        (desiredColor && state.colors.includes(desiredColor) && desiredColor) ||
        (state.colors.includes(preferredColor) ? preferredColor : state.colors[0] || null);

      if (resolvedColor) {
        state.selectedColor = resolvedColor;
        state.lastSelectedColor = resolvedColor;
        elements.colorSelect.value = resolvedColor;
      } else {
        state.selectedColor = null;
        elements.colorSelect.value = '';
      }
      syncColorDropupFromSelect();
    }
  } else {
    elements.colorGroup.style.visibility = 'hidden';
    elements.colorGroup.style.pointerEvents = 'none';
    state.selectedColor = null;
  }

  updateButtonStates();

  // Auto-generate preview
  await autoGeneratePreview('theme');

  // Save to localStorage
  saveStateToLocalStorage();
}

// Handle color selection
async function handleColorChange(event) {
  state.selectedColor = event.target.value || null;
  state.lastSelectedColor = state.selectedColor || state.lastSelectedColor;
  syncColorDropupFromSelect();
  closeColorDropup();
  updateButtonStates();

  // Auto-generate preview
  await autoGeneratePreview('color');

  // Save to localStorage
  saveStateToLocalStorage();
}
