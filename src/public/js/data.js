// Load example data
// Handle load/clear button toggle
function handleLoadExampleBtn() {
  if (state.templateLoaded) {
    newResume();
  } else {
    loadExampleData();
  }
}

// New Resume: confirm then load blank template
async function newResume() {
  const confirmed = confirm('Are you sure you want to clear all data and start over? This action cannot be undone.');
  if (confirmed) {
    await loadBlankTemplate();
  }
}

// Load the blank starter template, resetting all state first
async function loadBlankTemplate() {
  try {
    // Reset state before loading
    state.resumeData = null;
    state.photoBase64 = null;
    state.templateLoaded = false;
    state.enabledSections = {};
    state.customSectionNames = {};
    state.sectionOrder = [];
    state.currentHtml = null;
    state.pdfPreviewUrl = null;
    elements.jsonEditor.value = '';
    updatePhotoButtonState(false);
    updateSectionManagementUI();
    elements.previewPdfBtn.disabled = true;
    elements.exportHtmlBtn.disabled = true;
    elements.exportJsonBtn.disabled = true;
    clearAllLocalStorage();

    const url = '/gallery/01_blank_template/' + encodeURIComponent('Jack Duck \u2013 resume.json');
    const response = await fetch(url);
    const parsed = await response.json();
    const meta = parsed._meta || null;

    const photoBase64 = parsed.photoBase64 || meta?.photoBase64 || null;
    const data = { ...parsed };
    delete data._meta;
    delete data.photoBase64;

    migrateSummaryToBio(data, meta?.enabledSections, meta?.customSectionNames);
    ensurePersonalInfoBio(data);

    elements.jsonEditor.value = JSON.stringify(data, null, 2);
    state.resumeData = data;
    deriveSectionOrderFromData(state.resumeData);

    initializeEnabledSections(data);
    if (meta?.enabledSections) {
      state.enabledSections = { ...meta.enabledSections };
      migrateSummaryToBio(null, state.enabledSections);
    }

    state.photoBase64 = photoBase64;
    updatePhotoButtonState(!!state.photoBase64);
    applyMetaSettings(meta);

    updateSectionManagementUI();
    await autoGeneratePreview('json');

    state.templateLoaded = true;
    const btn = elements.loadExampleBtn;
    btn.className = 'btn btn-success';
    btn.innerHTML = '<i class="fas fa-plus"></i> New Resume';

    saveStateToLocalStorage();
    flashPreviewStatus('New blank resume loaded', 'status-success');
  } catch (error) {
    console.error('Error loading blank template:', error);
    flashPreviewStatus('Error loading blank template', 'status-error');
    renderPreviewPlaceholder();
  }
}

// Load a specific gallery template directly (called from the gallery dropdown)
async function loadTemplateFromGallery(template) {
  if (state.templateLoaded) {
    const confirmed = confirm('Are you sure you want to load a new template? Your current data will be lost. This action cannot be undone.');
    if (!confirmed) return false;
  }

  // Reset state
  state.resumeData = null;
  state.photoBase64 = null;
  state.templateLoaded = false;
  state.enabledSections = {};
  state.customSectionNames = {};
  state.sectionOrder = [];
  state.currentHtml = null;
  state.pdfPreviewUrl = null;
  elements.jsonEditor.value = '';
  updatePhotoButtonState(false);
  updateSectionManagementUI();
  elements.previewPdfBtn.disabled = true;
  elements.exportHtmlBtn.disabled = true;
  elements.exportJsonBtn.disabled = true;
  clearAllLocalStorage();

  try {
    const jsonUrl = '/gallery/' + template.folder + '/' + encodeURIComponent(template.json);
    const response = await fetch(jsonUrl);
    const parsed = await response.json();
    const meta = parsed._meta || null;

    const photoBase64 = parsed.photoBase64 || meta?.photoBase64 || null;
    const data = { ...parsed };
    delete data._meta;
    delete data.photoBase64;

    migrateSummaryToBio(data, meta?.enabledSections, meta?.customSectionNames);
    ensurePersonalInfoBio(data);

    elements.jsonEditor.value = JSON.stringify(data, null, 2);
    state.resumeData = data;
    deriveSectionOrderFromData(state.resumeData);

    initializeEnabledSections(data);
    if (meta?.enabledSections) {
      state.enabledSections = { ...meta.enabledSections };
      migrateSummaryToBio(null, state.enabledSections);
    }

    state.photoBase64 = photoBase64;
    updatePhotoButtonState(!!state.photoBase64);
    applyMetaSettings(meta);

    updateSectionManagementUI();
    await autoGeneratePreview('json');

    state.templateLoaded = true;
    const btn = elements.loadExampleBtn;
    btn.className = 'btn btn-success';
    btn.innerHTML = '<i class="fas fa-plus"></i> New Resume';

    saveStateToLocalStorage();
    flashPreviewStatus(`Template "${template.label}" loaded`, 'status-success');
    return true;
  } catch (error) {
    console.error('Error loading template:', error);
    flashPreviewStatus('Error loading template', 'status-error');
    renderPreviewPlaceholder();
    return false;
  }
}

// Clear all resume data
function clearResumeData() {
  const confirmed = confirm('Are you sure you want to clear all data and start over? This action cannot be undone.');

  if (confirmed) {
    // Clear all state
    state.resumeData = null;
    state.photoBase64 = null;
    state.templateLoaded = false;
    state.enabledSections = {};
    state.customSectionNames = {};
    state.sectionOrder = [];
    state.currentHtml = null;
    state.pdfPreviewUrl = null;
    elements.jsonEditor.value = '';

    // Clear preview
    renderPreviewPlaceholder();

    // Reset photo button
    updatePhotoButtonState(false);

    // Reset load button to initial state
    const btn = elements.loadExampleBtn;
    btn.className = 'btn btn-primary';
    btn.innerHTML = '<i class="fas fa-file-import"></i> Load Template';

    // Clear section management UI
    updateSectionManagementUI();

    // Disable export buttons
    elements.previewPdfBtn.disabled = true;
    elements.exportHtmlBtn.disabled = true;
    elements.exportJsonBtn.disabled = true;

    // Clear localStorage
    clearAllLocalStorage();

    flashPreviewStatus('Data cleared successfully', 'status-success');
  }
}

const EMPTY_PREVIEW_MESSAGE = 'Load the demo template or import you own JSON';
const DEFAULT_MAX_PHOTO_SIZE_BYTES = 1.5 * 1024 * 1024; // 1.5MB limit for uploaded images

function renderPreviewPlaceholder() {
  elements.previewContainer.innerHTML = `
    <div class="preview-placeholder">
      <i class="fas fa-file-alt"></i>
      <p>${EMPTY_PREVIEW_MESSAGE}</p>
    </div>
  `;
}

async function loadExampleData() {
  try {
    const response = await fetch('/api/example-data');
    const rawData = await response.json();
    const meta = rawData._meta || null;

    // Extract photoBase64 from root level (new format) or from _meta (legacy format)
    const photoBase64 = rawData.photoBase64 || meta?.photoBase64 || null;

    const data = { ...rawData };
    delete data._meta;
    delete data.photoBase64;

    migrateSummaryToBio(data, meta?.enabledSections, meta?.customSectionNames);
    ensurePersonalInfoBio(data);

    elements.jsonEditor.value = JSON.stringify(data, null, 2);
    state.resumeData = data;
    deriveSectionOrderFromData(state.resumeData);

    // Initialize all sections as enabled
    initializeEnabledSections(data);
    if (meta?.enabledSections) {
      state.enabledSections = { ...meta.enabledSections };
      migrateSummaryToBio(null, state.enabledSections);
    }

    // Set photo from extracted value
    state.photoBase64 = photoBase64;
    updatePhotoButtonState(!!state.photoBase64);

    // Apply optional metadata (photo/custom names/watermark/theme/color)
    applyMetaSettings(meta);

    flashPreviewStatus('Example data loaded successfully', 'status-success');

    // Update section management UI
    updateSectionManagementUI();

    // Auto-generate preview
    await autoGeneratePreview('json');

    // Transform button to "New Resume" mode
    state.templateLoaded = true;
    const btn = elements.loadExampleBtn;
    btn.className = 'btn btn-success';
    btn.innerHTML = '<i class="fas fa-plus"></i> New Resume';

    // Save to localStorage
    saveStateToLocalStorage();
  } catch (error) {
    console.error('Error loading example data:', error);
    flashPreviewStatus('Error loading example data', 'status-error');
    renderPreviewPlaceholder();
  }
}

// Handle JSON file upload
async function handleFileUpload(event) {
  const input = event.target;
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      const meta = parsed._meta || null;

      // Extract photoBase64 from root level (new format) or from _meta (legacy format)
      const photoBase64 = parsed.photoBase64 || meta?.photoBase64 || null;

      const data = { ...parsed };
      delete data._meta;
      delete data.photoBase64;

      migrateSummaryToBio(data, meta?.enabledSections, meta?.customSectionNames);
      ensurePersonalInfoBio(data);

      elements.jsonEditor.value = JSON.stringify(data, null, 2);
      state.resumeData = data;

      // Initialize enabled sections from file data, then apply meta override if present
      initializeEnabledSections(data);
      if (meta?.enabledSections) {
        state.enabledSections = { ...meta.enabledSections };
        migrateSummaryToBio(null, state.enabledSections);
      }

      // Set photo from extracted value
      state.photoBase64 = photoBase64;
      updatePhotoButtonState(!!state.photoBase64);

      // Apply meta settings (theme/color/customSectionNames)
      applyMetaSettings(meta);

      flashPreviewStatus('JSON file uploaded successfully', 'status-success');

      // Update section management UI
      updateSectionManagementUI();

      // Auto-generate preview
      await autoGeneratePreview('json');

      // Transform button to "Clear Data" mode
      state.templateLoaded = true;
      const btn = elements.loadExampleBtn;
      btn.className = 'btn btn-danger';
      btn.innerHTML = '<i class="fas fa-trash-alt"></i> Clear All Data';

      // Save to localStorage
      saveStateToLocalStorage();
    } catch (error) {
      showError('Invalid JSON file');
    }
    input.value = '';
  };
  reader.onerror = () => {
    input.value = '';
  };
  reader.readAsText(file);
}

// Initialize enabled sections based on loaded data
function initializeEnabledSections(data) {
  state.enabledSections = {};
  ALL_SECTIONS.forEach(section => {
    // Enable section if it has meaningful content
    state.enabledSections[section] = hasSectionContent(data[section]);
  });
}

// Ensure enabledSections has entries for all known sections without overwriting existing user choices
function syncEnabledSectionsWithData(data) {
  if (!data) return;
  ALL_SECTIONS.forEach(section => {
    if (state.enabledSections[section] === undefined) {
      state.enabledSections[section] = hasSectionContent(data[section]);
    }
  });
}

// Resize image proportionally before converting to base64
// Fills transparent backgrounds with white to match resume background
async function resizeImage(file, maxWidth = 400, maxHeight = 400) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        // Create canvas to resize the image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Fill with white background first (matches resume background color)
        // This ensures transparent areas in PNGs become white instead of black
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Draw resized image on top of white background
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 as JPEG (no transparency support, uses white background)
        const resizedBase64 = canvas.toDataURL('image/jpeg', 0.9);
        resolve(resizedBase64);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Handle photo upload
async function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const maxPhotoSizeBytes = state.configLimits?.maxPhotoBase64Bytes || DEFAULT_MAX_PHOTO_SIZE_BYTES;

  if (file.size > maxPhotoSizeBytes) {
    const limitMb = (maxPhotoSizeBytes / (1024 * 1024)).toFixed(1);
    flashPreviewStatus(`Photo file is too large. Please use an image up to ${limitMb} MB.`, 'status-error');
    elements.photoInput.value = '';
    return;
  }

  try {
    // Resize image before storing as base64
    const resizedBase64 = await resizeImage(file);
    state.photoBase64 = resizedBase64;

    flashPreviewStatus(`Photo uploaded and resized: ${file.name}`, 'status-success');

    // Update UI to show remove button
    updatePhotoButtonState(true);

    // Auto-generate preview
    await autoGeneratePreview('photo');

    // Save to localStorage
    saveStateToLocalStorage();
  } catch (error) {
    console.error('Error uploading photo:', error);
    flashPreviewStatus('Failed to upload photo', 'status-error');
  } finally {
    elements.photoInput.value = '';
  }
}

// Handle photo removal
async function handlePhotoRemove() {
  state.photoBase64 = null;

  // Clear the file input
  elements.photoInput.value = '';

  // Update UI to show upload button
  updatePhotoButtonState(false);

  flashPreviewStatus('Photo removed', 'status-success');

  // Auto-generate preview
  await autoGeneratePreview('photo');

  // Save to localStorage
  saveStateToLocalStorage();
}

// Update photo button state (show upload or remove button)
function updatePhotoButtonState(hasPhoto) {
  if (hasPhoto) {
    // Hide upload button and label, show remove button
    elements.photoUploadBtn.style.display = 'none';
    elements.photoUploadLabel.style.visibility = 'hidden';
    elements.photoRemoveBtn.style.display = 'flex';
  } else {
    // Show upload button and label, hide remove button
    elements.photoUploadBtn.style.display = '';
    elements.photoUploadLabel.style.visibility = 'visible';
    elements.photoRemoveBtn.style.display = 'none';
  }
}

// Validate JSON - internal function
function validateJson() {
  hideError();

  const jsonText = elements.jsonEditor.value.trim();
  if (!jsonText) {
    state.resumeData = null;
    updateButtonStates();
    return false;
  }

  try {
    const parsed = JSON.parse(jsonText);
    const migrated = migrateSummaryToBio(parsed, state.enabledSections, state.customSectionNames);
    ensurePersonalInfoBio(parsed);
    state.resumeData = parsed;
    deriveSectionOrderFromData(state.resumeData);
    syncEnabledSectionsWithData(parsed);
    if (migrated) {
      elements.jsonEditor.value = JSON.stringify(state.resumeData, null, 2);
    }
    updateButtonStates();
    return true;
  } catch (error) {
    showError(`Invalid JSON: ${error.message}`);
    state.resumeData = null;
    updateButtonStates();
    return false;
  }
}

async function handleWatermarkChange(event) {
  state.showWatermark = event.target.checked;

  // Auto-generate preview
  await autoGeneratePreview('watermark');

  // Save to localStorage
  saveStateToLocalStorage();
}

async function handleLayoutChange(value) {
  state.layout = value;
  syncLayoutDropupFromState();

  // Auto-generate preview
  await autoGeneratePreview('layout');

  // Save to localStorage
  saveStateToLocalStorage();
}

function handleTermsAcceptanceChange(event) {
  const checkbox = event?.target || elements.termsAcceptanceCheckbox || elements.termsAcceptanceCheckboxDesktop;
  state.termsAccepted = Boolean(checkbox?.checked);
  setStoredTermsAcceptance(state.termsAccepted);
  updateButtonStates();
}
