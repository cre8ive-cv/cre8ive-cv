// Section Editor Modal Functions
function openSectionEditor(sectionKey) {
  state.currentEditingSection = sectionKey;

  // Initialize CodeMirror if not already done
  if (!state.codeMirrorEditor) {
    state.codeMirrorEditor = CodeMirror(elements.expandedJsonEditor, {
      mode: { name: 'javascript', json: true },
      lineNumbers: true,
      lineWrapping: true,
      foldGutter: false,
      gutters: ['CodeMirror-linenumbers'],
      matchBrackets: true,
      autoCloseBrackets: true,
      indentUnit: 2,
      tabSize: 2,
      theme: 'default'
    });

    // Add real-time validation on change
    state.codeMirrorEditor.on('change', validateJsonRealtime);
  }

  // Clear any previous errors
  clearJsonErrors();
  hideError();

  // Update modal icon to match section icon
  const sectionIcon = getSectionIcon(sectionKey);
  elements.modalSectionIcon.textContent = '';
  elements.modalSectionIcon.className = sectionIcon;

  // Sections that have visible headers in the CV
  const sectionsWithHeaders = ['experience', 'education', 'skills', 'projects'];
  const hasHeader = sectionsWithHeaders.includes(sectionKey);

  // Update modal title - use CV header name for sections with headers, sidebar name otherwise
  const sectionName = hasHeader ? getCVHeaderName(sectionKey) : getSectionDisplayName(sectionKey);

  const spanElement = document.createElement('span');
  spanElement.textContent = sectionName;

  elements.modalSectionTitle.innerHTML = '';
  elements.modalSectionTitle.appendChild(spanElement);

  // Only add rename button for sections that have headers in the CV
  if (hasHeader) {
    const btnElement = document.createElement('button');
    btnElement.className = 'btn-rename-section-modal';
    btnElement.title = 'Rename CV section header';
    btnElement.innerHTML = '<i class="fas fa-pen"></i>';

    elements.modalSectionTitle.appendChild(btnElement);

    // Add click listener for rename button in modal
    btnElement.addEventListener('click', () => {
      renameSectionPrompt(sectionKey);
    });
  }

  // Get section-specific JSON
  const sectionData = state.resumeData[sectionKey];

  if (sectionData !== undefined) {
    try {
      // Format the section JSON
      state.codeMirrorEditor.setValue(JSON.stringify(sectionData, null, 2));
    } catch (error) {
      state.codeMirrorEditor.setValue('');
      showError(`Error loading section data: ${error.message}`);
    }
  } else {
    state.codeMirrorEditor.setValue('');
  }

  // Show modal
  showModal(elements.jsonEditorModal);

  // Refresh CodeMirror and focus
  setTimeout(() => {
    state.codeMirrorEditor.refresh();
    state.codeMirrorEditor.focus();
  }, 100);
}

function closeEditorModal() {
  hideModal(elements.jsonEditorModal);
  state.currentEditingSection = null;
}

function saveEditorChanges() {
  // Check if we're editing a single project
  if (currentEditingProjectIndex !== null) {
    const projectJson = state.codeMirrorEditor.getValue().trim();

    try {
      const projectData = JSON.parse(projectJson);

      // Update the specific project
      state.resumeData.projects[currentEditingProjectIndex] = projectData;

      // Update the hidden JSON editor
      elements.jsonEditor.value = JSON.stringify(state.resumeData, null, 2);

      // Mark as modified
      state.jsonModified = true;
      updateButtonStates();

      // Close modal and reopen projects management
      closeEditorModal();
      currentEditingProjectIndex = null;
      openProjectsManagementModal();

      // Show success message
      flashPreviewStatus('Project updated successfully', 'status-success');

    } catch (error) {
      showError(`Invalid JSON for project: ${error.message}`);
      highlightJsonError(projectJson, error);
    }
    return;
  }

  // Regular section editing
  if (!state.currentEditingSection || !state.codeMirrorEditor) {
    closeEditorModal();
    return;
  }

  const sectionKey = state.currentEditingSection;
  const sectionJson = state.codeMirrorEditor.getValue().trim();

  // Validate the section JSON
  try {
    const sectionData = JSON.parse(sectionJson);

    // Update the section in resume data
    state.resumeData[sectionKey] = sectionData;

    // Update the hidden JSON editor
    elements.jsonEditor.value = JSON.stringify(state.resumeData, null, 2);

    // Clear any error state for this section
    state.sectionErrors[sectionKey] = false;

    // Mark as modified
    state.jsonModified = true;
    updateButtonStates();

    // Close modal
    closeEditorModal();

    // Update section UI to remove error indicator
    updateSectionManagementUI();

    // Show success message
    flashPreviewStatus(`${getSectionDisplayName(sectionKey)} updated successfully`, 'status-success');

    // Auto-generate preview
    autoGeneratePreview('section-edit');
  } catch (error) {
    // Mark this section as having an error
    state.sectionErrors[sectionKey] = true;

    // Update section UI to show error indicator
    updateSectionManagementUI();

    showError(`Invalid JSON for ${getSectionDisplayName(sectionKey)}: ${error.message}`);
    highlightJsonError(sectionJson, error);
  }
}

function formatExpandedJson() {
  if (!state.codeMirrorEditor) return;

  // Clear any previous error markers
  clearJsonErrors();

  const jsonText = state.codeMirrorEditor.getValue().trim();

  if (!jsonText) {
    showError('No JSON to format');
    return;
  }

  try {
    // First, try to fix common JSON errors
    const fixedJson = fixCommonJsonErrors(jsonText);

    // Then parse and format
    const parsed = JSON.parse(fixedJson);
    const formatted = JSON.stringify(parsed, null, 2);

    // Update CodeMirror value
    state.codeMirrorEditor.setValue(formatted);

    // Clear errors on success
    hideError();

    // Show temporary success message
    const originalText = elements.formatJsonBtn.innerHTML;

    // Check if we made any fixes
    if (fixedJson !== jsonText) {
      elements.formatJsonBtn.innerHTML = '<i class="fas fa-magic"></i> Fixed & Formatted!';
    } else {
      elements.formatJsonBtn.innerHTML = '<i class="fas fa-check"></i> Formatted!';
    }

    elements.formatJsonBtn.disabled = true;

    setTimeout(() => {
      elements.formatJsonBtn.innerHTML = originalText;
      elements.formatJsonBtn.disabled = false;
    }, 1500);
  } catch (error) {
    // Try to highlight the error location
    highlightJsonError(jsonText, error);

    // Show the error
    showError(`JSON Error: ${error.message}`);
  }
}

// Helper function to parse error location from JSON parse error
function getErrorPosition(jsonText, error) {
  const message = error.message;

  // Try to extract position from error message
  // Chrome/V8: "Unexpected token } in JSON at position 123"
  // Firefox: "JSON.parse: unexpected character at line 5 column 10"

  let line = null;
  let column = null;

  // Try Firefox format first (most specific)
  const firefoxMatch = message.match(/line (\d+) column (\d+)/);
  if (firefoxMatch) {
    line = parseInt(firefoxMatch[1]) - 1; // 0-indexed
    column = parseInt(firefoxMatch[2]) - 1;
    return { line, column };
  }

  // Try Chrome format
  const chromeMatch = message.match(/position (\d+)/);
  if (chromeMatch) {
    const position = parseInt(chromeMatch[1]);
    let currentPos = 0;
    const lines = jsonText.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (currentPos + lines[i].length >= position) {
        line = i;
        column = position - currentPos;
        return { line, column };
      }
      currentPos += lines[i].length + 1; // +1 for newline
    }
  }

  return { line: 0, column: 0 };
}

// Clear JSON error markers
function clearJsonErrors() {
  if (!state.codeMirrorEditor) return;

  // Clear all marks
  const marks = state.codeMirrorEditor.getAllMarks();
  marks.forEach(mark => mark.clear());
}

// Highlight JSON error in CodeMirror
function highlightJsonError(jsonText, error) {
  if (!state.codeMirrorEditor) return;

  const { line, column } = getErrorPosition(jsonText, error);

  // Highlight the line with the error
  state.codeMirrorEditor.addLineClass(line, 'background', 'json-error-line');

  // Scroll to the error line
  state.codeMirrorEditor.scrollIntoView({ line, ch: column }, 100);

  // Set cursor to error position
  state.codeMirrorEditor.setCursor({ line, ch: column });
  state.codeMirrorEditor.focus();
}

// Escape HTML to avoid user-provided content altering the app shell
function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Section Management Functions
function updateSectionManagementUI() {
  if (!state.resumeData) {
    elements.sectionsPanel.style.display = 'none';
    return;
  }

  // Clean up any custom names that now match defaults
  cleanupCustomSectionNames();

  elements.sectionsPanel.style.display = 'block';
  elements.sectionList.innerHTML = '';

  // Get ordered sections using tracked order
  const currentSections = getOrderedSectionKeys(state.resumeData);

  currentSections.forEach((sectionKey) => {
    const item = document.createElement('div');
    item.className = 'section-item';
    item.dataset.section = sectionKey;

    // Determine if section is fixed (non-draggable)
    const isFixed = FIXED_SECTIONS.includes(sectionKey);
    const isRequired = REQUIRED_SECTIONS.includes(sectionKey);
    const isEnabled = state.enabledSections[sectionKey];
    const hasError = state.sectionErrors[sectionKey] === true;

    if (isFixed) {
      item.classList.add('section-item-fixed');
      item.draggable = false;
    } else {
      item.draggable = true;
    }

    if (!isEnabled) {
      item.classList.add('section-item-disabled');
    }

    if (hasError) {
      item.classList.add('section-item-error');
    }

    // Build section HTML
    const sectionIcon = getSectionIcon(sectionKey);
    const sectionIconMarkup = `<i class="${sectionIcon}" aria-hidden="true"></i>`;
    const sectionName = getDefaultSectionName(sectionKey); // Always use default name in sidebar
    const errorWarning = hasError ? '<i class="fas fa-exclamation-triangle section-error-icon" title="This section has a JSON error"></i>' : '';

    // Check if section can be renamed and has a custom name that differs from default
    const renamableSections = ['skills', 'experience', 'education', 'projects'];
    const canRename = renamableSections.includes(sectionKey);
    const customName = state.customSectionNames && state.customSectionNames[sectionKey];
    const defaultCVName = getDefaultCVHeaderName(sectionKey);
    const isActuallyCustom = customName && customName !== defaultCVName;
    const safeCustomName = customName ? escapeHtml(customName) : '';
    const customNameMarkup = (canRename && isActuallyCustom)
      ? `<span class="section-item-custom-name" title="${safeCustomName}">${safeCustomName}</span>`
      : '';

    item.innerHTML = `
      <i class="fas fa-grip-vertical section-item-grip"></i>
      <div class="section-item-info">
        <div class="section-item-name">
          ${sectionIconMarkup}
          ${sectionName}
          ${errorWarning}
        </div>
        ${customNameMarkup}
      </div>
      <div class="section-item-controls">
        <label class="section-item-toggle">
          <input type="checkbox"
                 ${isEnabled ? 'checked' : ''}
                 ${isRequired ? 'disabled' : ''}
                 data-section="${sectionKey}">
          <span class="section-item-toggle-slider"></span>
        </label>
        <button class="btn-edit-section" data-section="${sectionKey}">
          <i class="fas fa-edit"></i> Edit
        </button>
      </div>
    `;

    // Add event listeners
    const toggleCheckbox = item.querySelector('input[type="checkbox"]');
    const editBtn = item.querySelector('.btn-edit-section');

    toggleCheckbox.addEventListener('change', (e) => handleSectionToggle(sectionKey, e.target.checked));
    editBtn.addEventListener('click', () => {
      if (sectionKey === 'skills') {
        openSkillsManagementModal();
      } else if (sectionKey === 'projects') {
        openProjectsManagementModal();
      } else if (sectionKey === 'experience') {
        openExperienceManagementModal();
      } else if (sectionKey === 'personalInfo') {
        openPersonalInfoModal();
      } else if (sectionKey === 'gdprClause') {
        openGdprModal();
      } else if (sectionKey === 'education') {
        openEducationManagementModal();
      } else {
        openSectionEditor(sectionKey);
      }
    });

    // Add drag-and-drop event listeners only for reorderable sections
    if (!isFixed) {
      item.addEventListener('dragstart', handleDragStart);
      item.addEventListener('dragover', handleDragOver);
      item.addEventListener('drop', handleDrop);
      item.addEventListener('dragend', handleDragEnd);
    }

    elements.sectionList.appendChild(item);
  });
}

// Handle section enable/disable toggle
function handleSectionToggle(sectionKey, enabled) {
  state.enabledSections[sectionKey] = enabled;
  state.jsonModified = true;
  updateButtonStates();

  // Don't rebuild the entire UI - just update the specific section item class
  const sectionItem = document.querySelector(`.section-item[data-section="${sectionKey}"]`);
  if (sectionItem) {
    if (enabled) {
      sectionItem.classList.remove('section-item-disabled');
    } else {
      sectionItem.classList.add('section-item-disabled');
    }
  }

  // Auto-regenerate preview
  autoGeneratePreview('section-toggle');

  // Save to localStorage
  saveStateToLocalStorage();
}

// Clean up custom section names that match defaults (useful after default name changes)
function cleanupCustomSectionNames() {
  if (!state.customSectionNames) return;

  const renamableSections = ['skills', 'experience', 'education', 'projects'];
  renamableSections.forEach(sectionKey => {
    const customName = state.customSectionNames[sectionKey];
    if (customName) {
      const defaultName = getDefaultCVHeaderName(sectionKey);
      if (customName === defaultName) {
        console.log(`Cleaning up custom name for ${sectionKey}: "${customName}" matches default`);
        delete state.customSectionNames[sectionKey];
      }
    }
  });
}

// Update custom name display for a specific section without rebuilding entire sidebar
function updateSectionCustomNameDisplay(sectionKey) {
  const sectionItem = document.querySelector(`.section-item[data-section="${sectionKey}"]`);
  if (!sectionItem) return;

  const sectionInfo = sectionItem.querySelector('.section-item-info');
  if (!sectionInfo) return;

  // Remove existing custom name display if present
  const existingCustomName = sectionInfo.querySelector('.section-item-custom-name');
  if (existingCustomName) {
    existingCustomName.remove();
  }

  // Check if section can be renamed and has a custom name that differs from default
  const renamableSections = ['skills', 'experience', 'education', 'projects'];
  const canRename = renamableSections.includes(sectionKey);
  const customName = state.customSectionNames && state.customSectionNames[sectionKey];
  const defaultCVName = getDefaultCVHeaderName(sectionKey);
  const isActuallyCustom = customName && customName !== defaultCVName;

  // Add new custom name display if applicable
  if (canRename && isActuallyCustom) {
    const customNameSpan = document.createElement('span');
    customNameSpan.className = 'section-item-custom-name';
    customNameSpan.title = customName;
    customNameSpan.textContent = customName;
    sectionInfo.appendChild(customNameSpan);
  }
}

// Get icon for section
function getSectionIcon(section) {
  const icons = {
    personalInfo: 'fas fa-user',
    skills: 'fas fa-code',
    experience: 'fas fa-briefcase',
    education: 'fas fa-graduation-cap',
    projects: 'fas fa-code-branch',
    gdprClause: 'fas fa-shield-alt'
  };
  return icons[section] || 'fas fa-file';
}

// Get display name for section (sidebar names)
function getSectionDisplayName(section) {
  // Check if there's a custom name first
  if (state.customSectionNames && state.customSectionNames[section]) {
    return state.customSectionNames[section];
  }

  // Fall back to default names
  const names = {
    personalInfo: 'Personal Information',
    skills: 'Skills & Languages',
    experience: 'Professional Experience',
    education: 'Education',
    projects: 'Side Projects',
    gdprClause: 'GDPR Clause'
  };
  return names[section] || section;
}

// Get CV header name for section (what appears in the actual CV)
function getCVHeaderName(section) {
  // Check if there's a custom name first
  if (state.customSectionNames && state.customSectionNames[section]) {
    return state.customSectionNames[section];
  }

  // Default CV header names
  const cvHeaders = {
    skills: 'Skills & Languages',
    experience: 'Professional Experience',
    education: 'Education',
    projects: 'Side Projects'
  };
  return cvHeaders[section] || section;
}

// Rename a section with inline editing
function renameSectionPrompt(sectionKey) {
  const currentName = getCVHeaderName(sectionKey);
  const defaultName = getDefaultCVHeaderName(sectionKey);

  // Find which modal title to use based on section
  let titleElement;
  let containerElement;
  let existingRenameBtn = null;

  if (state.currentEditingSection === sectionKey) {
    titleElement = elements.modalSectionTitle.querySelector('span');
    containerElement = elements.modalSectionTitle;
    existingRenameBtn = elements.modalSectionTitle.querySelector('.btn-rename-section-modal');
  } else if (sectionKey === 'skills') {
    titleElement = document.getElementById('skillsModalTitle');
    containerElement = titleElement?.parentElement;
    existingRenameBtn = document.getElementById('renameSkillsSectionBtn');
  } else if (sectionKey === 'projects') {
    titleElement = document.getElementById('projectsModalTitle');
    containerElement = titleElement.parentElement;
    existingRenameBtn = document.getElementById('renameProjectsSectionBtn');
  } else if (sectionKey === 'experience') {
    titleElement = document.getElementById('experienceModalTitle');
    containerElement = titleElement.parentElement;
    existingRenameBtn = document.getElementById('renameExperienceSectionBtn');
  } else if (sectionKey === 'education') {
    titleElement = document.getElementById('educationModalTitle');
    containerElement = titleElement.parentElement;
    existingRenameBtn = document.getElementById('renameEducationSectionBtn');
  }

  if (!titleElement) return;

  // Store original HTML of the span
  const originalSpanHTML = titleElement.outerHTML;

  // IMPORTANT: Hide the existing rename button while editing
  if (existingRenameBtn) {
    existingRenameBtn.style.display = 'none';
  }

  // Create editing container
  const editingDiv = document.createElement('div');
  editingDiv.className = 'section-name-editing';

  // Create input
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'section-name-input';
  input.value = currentName;

  // Create controls container
  const controlsDiv = document.createElement('div');
  controlsDiv.className = 'section-name-edit-controls';

  // Create save button
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn-save-section-name';
  saveBtn.innerHTML = '<i class="fas fa-check"></i> Save';

  // Create cancel button
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-cancel-section-name';
  cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancel';

  // Assemble the elements
  controlsDiv.appendChild(saveBtn);
  controlsDiv.appendChild(cancelBtn);
  editingDiv.appendChild(input);
  editingDiv.appendChild(controlsDiv);

  // Replace title span with input
  titleElement.replaceWith(editingDiv);

  // Save function
  const saveName = () => {
    console.log('Save button clicked');
    const trimmedName = input.value.trim();
    console.log('New name:', trimmedName);

    if (!trimmedName) {
      alert('Section name cannot be empty.');
      input.focus();
      return;
    }

    // If the new name is the same as the default, remove the custom name
    if (trimmedName === defaultName) {
      delete state.customSectionNames[sectionKey];
      console.log('Removed custom name (reverting to default)');
    } else {
      state.customSectionNames[sectionKey] = trimmedName;
      console.log('Set custom name:', sectionKey, '=', trimmedName);
    }

    console.log('Current customSectionNames:', state.customSectionNames);

    // Close edit mode by restoring the normal view
    const displayName = trimmedName;

    // Create the restored span with proper ID
    const spanElement = document.createElement('span');
    spanElement.textContent = displayName;

    // Restore the proper ID for Projects/Experience modal titles
    if (sectionKey === 'projects') {
      spanElement.id = 'projectsModalTitle';
    } else if (sectionKey === 'experience') {
      spanElement.id = 'experienceModalTitle';
    } else if (sectionKey === 'education') {
      spanElement.id = 'educationModalTitle';
    } else if (sectionKey === 'skills') {
      spanElement.id = 'skillsModalTitle';
    }

    // Replace the editing div with the restored span
    editingDiv.replaceWith(spanElement);

    // Show the existing rename button again and reattach its listener
    if (existingRenameBtn) {
      existingRenameBtn.style.display = '';

      // Clone and replace to remove old listeners, then add fresh one
      const newBtn = existingRenameBtn.cloneNode(true);
      existingRenameBtn.parentNode.replaceChild(newBtn, existingRenameBtn);
      if (sectionKey === 'skills') {
        elements.renameSkillsSectionBtn = newBtn;
      }

      newBtn.addEventListener('click', () => {
        console.log('Pen icon clicked for section:', sectionKey);
        renameSectionPrompt(sectionKey);
      });

      console.log('Edit mode closed, existing pen icon restored and clickable');
    }

    // Update sidebar custom name display without rebuilding entire sidebar
    updateSectionCustomNameDisplay(sectionKey);

    // Regenerate preview with new section name
    autoGeneratePreview('section-edit');

    flashPreviewStatus(`CV section header renamed to "${displayName}"`, 'status-success');

    // Save to localStorage
    saveStateToLocalStorage();
  };

  // Cancel function
  const cancelEdit = () => {
    // Create a temp div to parse the original HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = originalSpanHTML;
    const restoredElement = tempDiv.firstChild;

    // Replace editing div with original span element
    editingDiv.replaceWith(restoredElement);

    // Show the existing rename button again and reattach its listener
    if (existingRenameBtn) {
      existingRenameBtn.style.display = '';

      // Clone and replace to remove old listeners, then add fresh one
      const newBtn = existingRenameBtn.cloneNode(true);
      existingRenameBtn.parentNode.replaceChild(newBtn, existingRenameBtn);
      if (sectionKey === 'skills') {
        elements.renameSkillsSectionBtn = newBtn;
      }

      newBtn.addEventListener('click', () => {
        console.log('Pen icon clicked for section (after cancel):', sectionKey);
        renameSectionPrompt(sectionKey);
      });
    }
  };

  // Event listeners
  saveBtn.addEventListener('click', saveName);
  cancelBtn.addEventListener('click', cancelEdit);

  // Enter to save, Escape to cancel
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveName();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  });

  // Focus and select input
  setTimeout(() => {
    input.focus();
    input.select();
  }, 10);
}

// Helper function to update section names in all open modals
function updateSectionNameInModals(sectionKey, newName) {
  console.log('Updating section name in modals:', sectionKey, newName);

  // Update regular section editor modal
  if (state.currentEditingSection === sectionKey) {
    console.log('Updating modal section title');
    const spanElement = document.createElement('span');
    spanElement.textContent = newName;

    const btnElement = document.createElement('button');
    btnElement.className = 'btn-rename-section-modal';
    btnElement.title = 'Rename section';
    btnElement.innerHTML = '<i class="fas fa-pen"></i>';

    elements.modalSectionTitle.innerHTML = '';
    elements.modalSectionTitle.appendChild(spanElement);
    elements.modalSectionTitle.appendChild(btnElement);

    // Re-attach event listener
    btnElement.addEventListener('click', () => {
      renameSectionPrompt(sectionKey);
    });
  }

  // Update Projects modal title if open
  if (sectionKey === 'projects') {
    const titleEl = document.getElementById('projectsModalTitle');
    if (titleEl) {
      titleEl.textContent = newName;
      console.log('Updated projects modal title to:', newName);

      // Reattach event listener to rename button
      const renameBtn = document.getElementById('renameProjectsSectionBtn');
      if (renameBtn) {
        const newRenameBtn = renameBtn.cloneNode(true);
        renameBtn.parentNode.replaceChild(newRenameBtn, renameBtn);
        newRenameBtn.addEventListener('click', () => {
          console.log('Projects rename button clicked (after save)');
          renameSectionPrompt('projects');
        });
      }
    }
  }

  // Update Skills modal title if open
  if (sectionKey === 'skills') {
    const titleEl = document.getElementById('skillsModalTitle');
    if (titleEl) {
      titleEl.textContent = newName;

      const renameBtn = document.getElementById('renameSkillsSectionBtn');
      if (renameBtn) {
        const newBtn = renameBtn.cloneNode(true);
        renameBtn.parentNode.replaceChild(newBtn, renameBtn);
        elements.renameSkillsSectionBtn = newBtn;
        newBtn.addEventListener('click', () => {
          renameSectionPrompt('skills');
        });
      }
    }
  }

  // Update Experience modal title if open
  if (sectionKey === 'experience') {
    const titleEl = document.getElementById('experienceModalTitle');
    if (titleEl) {
      titleEl.textContent = newName;
      console.log('Updated experience modal title to:', newName);

      // Reattach event listener to rename button
      const renameBtn = document.getElementById('renameExperienceSectionBtn');
      if (renameBtn) {
        const newRenameBtn = renameBtn.cloneNode(true);
        renameBtn.parentNode.replaceChild(newRenameBtn, renameBtn);
        newRenameBtn.addEventListener('click', () => {
          console.log('Experience rename button clicked (after save)');
          renameSectionPrompt('experience');
        });
      }
    }
  }

  // Update Education modal title if open
  if (sectionKey === 'education') {
    const titleEl = document.getElementById('educationModalTitle');
    if (titleEl) {
      titleEl.textContent = newName;

      const renameBtn = document.getElementById('renameEducationSectionBtn');
      if (renameBtn) {
        const newBtn = renameBtn.cloneNode(true);
        renameBtn.parentNode.replaceChild(newBtn, renameBtn);
        newBtn.addEventListener('click', () => {
          renameSectionPrompt('education');
        });
      }
    }
  }
}

// Get default section name for sidebar (without custom overrides)
function getDefaultSectionName(section) {
  const names = {
    personalInfo: 'Personal Information',
    skills: 'Skills & Languages',
    experience: 'Professional Experience',
    education: 'Education',
    projects: 'Side Projects',
    gdprClause: 'GDPR Clause'
  };
  return names[section] || section;
}

// Get default CV header name (without custom overrides)
function getDefaultCVHeaderName(section) {
  const cvHeaders = {
    skills: 'Skills & Languages',
    experience: 'Professional Experience',
    education: 'Education',
    projects: 'Side Projects'
  };
  return cvHeaders[section] || section;
}

// Drag-and-drop handlers for section reordering
let draggedItem = null;

function handleDragStart(e) {
  // Only allow dragging non-fixed sections
  const sectionKey = this.dataset.section;
  if (FIXED_SECTIONS.includes(sectionKey)) {
    e.preventDefault();
    return;
  }

  draggedItem = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }

  if (!draggedItem) return false;

  e.dataTransfer.dropEffect = 'move';

  // Only allow dropping in reorderable section area
  const afterElement = getDragAfterElement(elements.sectionList, e.clientY);

  if (afterElement == null) {
    // Find the last reorderable section to insert before gdprClause
    const allItems = elements.sectionList.querySelectorAll('.section-item');
    const gdprItem = Array.from(allItems).find(item => item.dataset.section === 'gdprClause');
    const personalInfoItem = Array.from(allItems).find(item => item.dataset.section === 'personalInfo');

    if (gdprItem) {
      elements.sectionList.insertBefore(draggedItem, gdprItem);
    } else if (personalInfoItem && personalInfoItem.nextSibling) {
      elements.sectionList.insertBefore(draggedItem, personalInfoItem.nextSibling);
    } else {
      // If no gdpr clause is present, append to the end
      elements.sectionList.appendChild(draggedItem);
    }
  } else {
    if (afterElement.dataset.section === 'personalInfo') {
      const personalInfoItem = afterElement;
      if (personalInfoItem.nextSibling) {
        elements.sectionList.insertBefore(draggedItem, personalInfoItem.nextSibling);
      }
      return false;
    }
    elements.sectionList.insertBefore(draggedItem, afterElement);
  }

  return false;
}

function handleListDragOver(e) {
  if (!draggedItem) return;
  e.preventDefault();
  const afterElement = getDragAfterElement(elements.sectionList, e.clientY);
  if (afterElement == null) {
    const allItems = elements.sectionList.querySelectorAll('.section-item');
    const gdprItem = Array.from(allItems).find(item => item.dataset.section === 'gdprClause');
    const personalInfoItem = Array.from(allItems).find(item => item.dataset.section === 'personalInfo');
    if (gdprItem) {
      elements.sectionList.insertBefore(draggedItem, gdprItem);
    } else if (personalInfoItem && personalInfoItem.nextSibling) {
      elements.sectionList.insertBefore(draggedItem, personalInfoItem.nextSibling);
    } else {
      elements.sectionList.appendChild(draggedItem);
    }
  } else {
    if (afterElement.dataset.section === 'personalInfo') {
      const personalInfoItem = afterElement;
      if (personalInfoItem.nextSibling) {
        elements.sectionList.insertBefore(draggedItem, personalInfoItem.nextSibling);
      }
      return;
    }
    elements.sectionList.insertBefore(draggedItem, afterElement);
  }
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }

  if (!draggedItem) return false;

  // Capture the current DOM order BEFORE any rebuilds
  const items = elements.sectionList.querySelectorAll('.section-item');
  const finalOrder = Array.from(items).map(item => item.dataset.section);

  // Update JSON based on the captured order
  updateJsonOrder(finalOrder);

  return false;
}

function handleListDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  if (!draggedItem) return false;

  const items = elements.sectionList.querySelectorAll('.section-item');
  const finalOrder = Array.from(items).map(item => item.dataset.section);
  updateJsonOrder(finalOrder);
  return false;
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  draggedItem = null;
}

function getDragAfterElement(container, y) {
  // Only consider reorderable sections (exclude all fixed sections)
  const draggableElements = [...container.querySelectorAll('.section-item:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updateJsonOrder(providedOrder = null) {
  try {
    const data = state.resumeData;

    let currentOrder;
    if (providedOrder) {
      // Use the provided order (captured at drop time)
      currentOrder = providedOrder;
    } else {
      // Fallback to reading from DOM (for backward compatibility)
      const items = elements.sectionList.querySelectorAll('.section-item');
      currentOrder = Array.from(items).map(item => item.dataset.section);
    }

    // Extract only reorderable sections from current order
    const reorderableSectionsOrder = currentOrder.filter(key => REORDERABLE_SECTIONS.includes(key));

    // Update tracked section order (deduped)
    const newOrder = [];
    reorderableSectionsOrder.forEach(key => {
      if (!newOrder.includes(key)) newOrder.push(key);
    });
    state.sectionOrder = newOrder.length ? newOrder : deriveSectionOrderFromData(data, true);

    // Build new data object using tracked order
    const orderedData = rebuildResumeDataWithOrder(data);

    // Update state and editor
    state.resumeData = orderedData;
    elements.jsonEditor.value = JSON.stringify(orderedData, null, 2);
    state.jsonModified = true;
    updateButtonStates();

    // Refresh UI to show correct order
    updateSectionManagementUI();

    // Auto-generate preview immediately
    autoGeneratePreview('section-reorder');

    // Save to localStorage
    saveStateToLocalStorage();
  } catch (error) {
    console.error('Error updating JSON order:', error);
  }
}

// Skills Management Functions
let currentEditingSkillIndex = null;

function clampSkillFraction(value) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(MAX_SKILL_FRACTION, Math.max(MIN_SKILL_FRACTION, value));
}

function syncSkillFraction(value) {
  const clamped = clampSkillFraction(value);
  if (elements.skillFraction) {
    elements.skillFraction.value = clamped;
  }
  return clamped;
}

function sanitizeSkillsArray(skills) {
  if (!Array.isArray(skills)) return [];

  const sanitized = skills.map(category => {
    const name = category?.name ? String(category.name).trim() : '';
    const rawFraction = Number(category?.fraction);
    const fraction = clampSkillFraction(Number.isFinite(rawFraction) && rawFraction > 0 ? parseFloat(rawFraction.toFixed(2)) : 1);
    const items = Array.isArray(category?.items)
      ? category.items.map(item => String(item).trim()).filter(Boolean)
      : [];

    return { name, fraction, items };
  });

  if (sanitized.length > MAX_SKILL_GROUPS) {
    flashPreviewStatus('Skills are limited to the first 3 groups.', 'status-info');
  }

  return sanitized.slice(0, MAX_SKILL_GROUPS);
}

function openSkillsManagementModal() {
  if (!state.resumeData) return;

  // Ensure skills array exists and is sanitized
  if (!Array.isArray(state.resumeData.skills)) {
    state.resumeData.skills = [];
  }

  const cleanedSkills = sanitizeSkillsArray(state.resumeData.skills);
  const lengthChanged = cleanedSkills.length !== (state.resumeData.skills?.length || 0);
  state.resumeData.skills = cleanedSkills;

  if (lengthChanged) {
    elements.jsonEditor.value = JSON.stringify(state.resumeData, null, 2);
    state.jsonModified = true;
    updateButtonStates();
  }

  populateSkillsList();

  const sectionName = getCVHeaderName('skills');
  const titleElement = document.getElementById('skillsModalTitle');
  if (titleElement) {
    titleElement.textContent = sectionName;
  }

  const renameBtnRef = elements.renameSkillsSectionBtn || document.getElementById('renameSkillsSectionBtn');
  if (renameBtnRef && renameBtnRef.parentNode) {
    const newRenameBtn = renameBtnRef.cloneNode(true);
    renameBtnRef.parentNode.replaceChild(newRenameBtn, renameBtnRef);
    newRenameBtn.addEventListener('click', () => renameSectionPrompt('skills'));
    elements.renameSkillsSectionBtn = newRenameBtn;
  }

  showModal(elements.skillsModal);
  requestAnimationFrame(() => applySkillTagOverflowHandling());
}

function closeSkillsManagementModal() {
  hideModal(elements.skillsModal);
  updateSectionManagementUI();
  debouncedSkillPreview();
}

function updateSkillsLimitUI(count) {
  const atLimit = count >= MAX_SKILL_GROUPS;
  if (elements.addSkillBtn) {
    elements.addSkillBtn.disabled = atLimit;
    elements.addSkillBtn.title = atLimit ? 'You can keep up to 4 skill groups' : '';
  }
}

function populateSkillsList() {
  if (!elements.skillsList) return;

  const skills = sanitizeSkillsArray(state.resumeData?.skills || []);
  const previousJson = elements.jsonEditor.value;
  state.resumeData.skills = skills;
  const newJson = JSON.stringify(state.resumeData, null, 2);
  elements.jsonEditor.value = newJson;
  if (newJson !== previousJson) {
    state.jsonModified = true;
    updateButtonStates();
  }

  updateSkillsLimitUI(skills.length);

  if (!skills.length) {
    elements.skillsList.innerHTML = '<p class="skill-list-empty">No skills added. Click "Add skill group" to create one.</p>';
    renderSkillWeightsPanel([], 0);
    return;
  }

  const totalFraction = skills.reduce((sum, skill) => sum + (Number(skill.fraction) || 1), 0) || skills.length || 1;

  elements.skillsList.innerHTML = skills.map((skill, index) => {
    const fraction = Number(skill.fraction) || 1;
    const share = Math.round((fraction / totalFraction) * 100);
    const displayName = escapeHtml(skill.name || 'Untitled group');
    const totalItems = Array.isArray(skill.items) ? skill.items.length : 0;
    const itemsMarkup = totalItems
      ? skill.items.map(item => `<span class="skill-tag">${escapeHtml(item)}</span>`).join('')
      : '<span class="skill-tag skill-tag-empty">Add at least one skill</span>';

    const metaLabel = `${totalItems} skill${totalItems === 1 ? '' : 's'}`;

    return `
    <div class="skill-list-item-row" data-skill-index="${index}" style="flex: 0 0 ${share}%; max-width: ${share}%;">
      <div class="skill-list-item">
        <div class="skill-list-header">
          <div class="skill-list-title">
            <div class="skill-list-name">${displayName}</div>
          </div>
          <div class="skill-list-meta">${metaLabel}</div>
        </div>
        <div class="skill-tags">
          ${itemsMarkup}
        </div>
        <div class="experience-list-item-controls">
          <button class="btn btn-secondary btn-small" onclick="openSkillEditor(${index})">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="btn btn-danger btn-small" onclick="deleteSkill(${index})">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    </div>
    `;
  }).join('');

  if (skills.length >= 2) {
    const rows = elements.skillsList.querySelectorAll('.skill-list-item-row');
    rows.forEach(row => {
      const card = row.querySelector('.skill-list-item');
      if (!card) return;
      card.draggable = true;
      card.addEventListener('dragstart', handleSkillGroupDragStart);
      card.addEventListener('dragend', handleSkillGroupDragEnd);

      row.addEventListener('dragover', handleSkillGroupDragOver);
      row.addEventListener('drop', handleSkillGroupDrop);
      row.addEventListener('dragleave', handleSkillGroupDragLeave);
    });
  }

  applySkillTagOverflowHandling();
  renderSkillWeightsPanel(skills, totalFraction);

}

function openSkillEditor(skillIndex) {
  currentEditingSkillIndex = skillIndex;
  const skill = state.resumeData.skills[skillIndex];

  elements.skillCategoryName.value = skill.name || '';
  refreshSkillFormTitle();

  populateSkillItems(skill.items || []);
  updateSkillSaveButton();

  transitionModals(elements.skillsModal, elements.skillFormModal);
  focusSkillGroupNameInput();
}

function addNewSkill() {
  const skillsCount = Array.isArray(state.resumeData?.skills) ? state.resumeData.skills.length : 0;
  if (skillsCount >= MAX_SKILL_GROUPS) {
    flashPreviewStatus('You can keep up to 4 skill groups. Remove one to add another.', 'status-error');
    return;
  }

  if (!Array.isArray(state.resumeData.skills)) {
    state.resumeData.skills = [];
  }

  currentEditingSkillIndex = null;
  elements.skillCategoryName.value = '';
  refreshSkillFormTitle();
  populateSkillItems([]);
  hideSkillFormError();
  updateSkillSaveButton();

  transitionModals(elements.skillsModal, elements.skillFormModal);
  focusSkillGroupNameInput();
}

function deleteSkill(skillIndex) {
  const skills = state.resumeData.skills || [];

  if (!confirm('Are you sure you want to delete this skill group?')) return;

  state.resumeData.skills.splice(skillIndex, 1);
  elements.jsonEditor.value = JSON.stringify(state.resumeData, null, 2);
  state.jsonModified = true;

  populateSkillsList();
  flashPreviewStatus('Skill group deleted', 'status-success');
  debouncedSkillPreview();

  // Save to localStorage
  saveStateToLocalStorage();
}

function closeSkillFormModal(reopenList = true) {
  if (reopenList) {
    // Transition to list modal first with backward animation
    transitionModals(elements.skillFormModal, elements.skillsModal, 'backward');

    // Wait for modal fade-out before clearing form to avoid showing empty fields
    setTimeout(() => {
      currentEditingSkillIndex = null;
      elements.skillForm.reset();
      elements.skillItemsList.innerHTML = '';
      hideSkillFormError();
    }, 150);
  } else {
    hideModal(elements.skillFormModal);
    setTimeout(() => {
      currentEditingSkillIndex = null;
      elements.skillForm.reset();
      elements.skillItemsList.innerHTML = '';
      hideSkillFormError();
    }, 150);
  }
}

function showSkillFormError(message) {
  elements.skillFormError.textContent = message;
  elements.skillFormError.classList.add('show');
}

function hideSkillFormError() {
  elements.skillFormError.textContent = '';
  elements.skillFormError.classList.remove('show');
}

function updateSkillSaveButton() {
  const name = elements.skillCategoryName.value.trim();
  const hasItems = Array.from(elements.skillItemsList.querySelectorAll('.skill-item input[type="text"]'))
    .some(input => input.value.trim() !== '');
  elements.saveSkillFormBtn.disabled = !name || !hasItems;
}

function refreshSkillFormTitle() {
  if (!elements.skillFormTitle) return;
  const name = elements.skillCategoryName.value.trim();
  if (currentEditingSkillIndex !== null) {
    elements.skillFormTitle.textContent = name ? `Edit skill group: ${name}` : 'Edit skill group';
  } else {
    elements.skillFormTitle.textContent = name ? `Add skill group: ${name}` : 'Add skill group';
  }
}

function focusSkillGroupNameInput() {
  if (!elements.skillCategoryName) return;
  const applyFocus = () => {
    elements.skillCategoryName.focus({ preventScroll: true });
    const len = elements.skillCategoryName.value.length;
    elements.skillCategoryName.setSelectionRange(len, len);
  };
  requestAnimationFrame(applyFocus);
  setTimeout(applyFocus, 280);
}

function saveSkillForm() {
  hideSkillFormError();

  const name = elements.skillCategoryName.value.trim();

  // Keep existing fraction if editing, otherwise default to 1
  let fraction = 1;
  if (currentEditingSkillIndex !== null && state.resumeData.skills[currentEditingSkillIndex]) {
    fraction = state.resumeData.skills[currentEditingSkillIndex].fraction || 1;
  }

  if (!name) {
    showSkillFormError('Please provide a group name.');
    return;
  }

  const items = [];
  elements.skillItemsList.querySelectorAll('.skill-item input[type="text"]').forEach(input => {
    const value = input.value.trim();
    if (value) items.push(value);
  });

  if (items.length === 0) {
    showSkillFormError('Add at least one item to this group.');
    return;
  }

  const skills = Array.isArray(state.resumeData.skills) ? state.resumeData.skills : [];
  if (currentEditingSkillIndex === null && skills.length >= MAX_SKILL_GROUPS) {
    showSkillFormError('You can keep up to 4 skill groups. Remove one to add another.');
    return;
  }

  const skillData = {
    name,
    fraction: parseFloat(fraction.toFixed(2)),
    items
  };

  if (currentEditingSkillIndex !== null) {
    state.resumeData.skills[currentEditingSkillIndex] = skillData;
    flashPreviewStatus('Skill group updated', 'status-success');
  } else {
    state.resumeData.skills.push(skillData);
    flashPreviewStatus('Skill group added', 'status-success');

    // Automatically enable skills section when creating the first group
    if (state.enabledSections && state.enabledSections.skills === false) {
      state.enabledSections.skills = true;
    } else if (state.enabledSections && state.enabledSections.skills === undefined) {
      state.enabledSections.skills = true;
    }
  }

  state.sectionErrors.skills = false;
  state.resumeData.skills = sanitizeSkillsArray(state.resumeData.skills);
  elements.jsonEditor.value = JSON.stringify(state.resumeData, null, 2);
  state.jsonModified = true;
  updateButtonStates();

  closeSkillFormModal(true);
  populateSkillsList();
  debouncedSkillPreview();

  // Save to localStorage
  saveStateToLocalStorage();
}

function populateSkillItems(items) {
  elements.skillItemsList.innerHTML = '';

  if (!items || items.length === 0) {
    addSkillItemField('', false);
    addSkillItemField('', false);
    updateSkillItemDeleteButtons();
    return;
  }

  items.forEach(item => addSkillItemField(item, false));
  updateSkillItemDeleteButtons();
}

function addSkillItemField(text = '', scrollToNew = false) {
  const safeValue = text
    ? text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
    : '';
  const item = document.createElement('div');
  item.className = 'skill-item';
  item.innerHTML = `
    <button type="button" class="skill-drag-handle" title="Drag to reorder">
      <i class="fas fa-grip-vertical"></i>
    </button>
    <input type="text" value="${safeValue}">
    <button type="button" class="btn-icon" onclick="removeSkillItem(this)" title="Remove">
      <i class="fas fa-trash-alt"></i>
    </button>
  `;

  const handle = item.querySelector('.skill-drag-handle');
  if (handle) {
    handle.draggable = true;
    handle.addEventListener('dragstart', handleSkillItemDragStart);
    handle.addEventListener('dragend', handleSkillItemDragEnd);
  }

  item.addEventListener('dragover', handleSkillItemDragOver);
  item.addEventListener('drop', handleSkillItemDrop);
  // Add input event listener for validation
  const input = item.querySelector('input[type="text"]');
  if (input) {
    input.addEventListener('input', updateSkillSaveButton);
  }

  elements.skillItemsList.appendChild(item);

  if (scrollToNew && item && typeof item.scrollIntoView === 'function') {
    requestAnimationFrame(() => {
      item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }
  return input || null;
}

function updateSkillItemDeleteButtons() {
  const items = elements.skillItemsList.querySelectorAll('.skill-item');
  const deleteButtons = elements.skillItemsList.querySelectorAll('.skill-item .btn-icon');
  const shouldDisable = items.length <= 1;

  deleteButtons.forEach(btn => {
    btn.disabled = shouldDisable;
    if (shouldDisable) {
      btn.style.opacity = '0.4';
      btn.style.cursor = 'not-allowed';
    } else {
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
    }
  });
}

function removeSkillItem(button) {
  const items = elements.skillItemsList.querySelectorAll('.skill-item');
  if (items.length <= 1) {
    return; // Don't remove the last item
  }

  const item = button.closest('.skill-item');
  if (item) {
    item.remove();
    updateSkillSaveButton();
    updateSkillItemDeleteButtons();
  }
}

// Drag-and-drop for skill items inside a group
let draggedSkillItem = null;

function handleSkillItemDragStart(e) {
  draggedSkillItem = e.currentTarget.closest('.skill-item');
  if (!draggedSkillItem) return;
  draggedSkillItem.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', '');

  const rect = draggedSkillItem.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const offsetY = e.clientY - rect.top;
  e.dataTransfer.setDragImage(draggedSkillItem, offsetX, offsetY);
}

function handleSkillItemDragOver(e) {
  if (!draggedSkillItem) return;
  e.preventDefault();

  const overItem = e.target.closest('.skill-item');
  if (!overItem || overItem === draggedSkillItem) return;

  const rect = overItem.getBoundingClientRect();
  const isSameRow = e.clientY >= rect.top && e.clientY <= rect.bottom;
  const insertBefore = isSameRow
    ? e.clientX < rect.left + rect.width / 2
    : e.clientY < rect.top + rect.height / 2;

  if (insertBefore) {
    elements.skillItemsList.insertBefore(draggedSkillItem, overItem);
  } else {
    elements.skillItemsList.insertBefore(draggedSkillItem, overItem.nextSibling);
  }
}

function handleSkillItemDrop(e) {
  e.preventDefault();
}

function handleSkillItemDragEnd() {
  if (draggedSkillItem) {
    draggedSkillItem.classList.remove('dragging');
  }
  draggedSkillItem = null;
}

function getSkillItemDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.skill-item:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    }
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updateSkillFractionInline(index, value, showStatus = false) {
  if (!Array.isArray(state.resumeData.skills)) return;
  const clamped = clampSkillFraction(value);
  if (!state.resumeData.skills[index]) return;

  state.resumeData.skills[index].fraction = clamped;
  elements.jsonEditor.value = JSON.stringify(state.resumeData, null, 2);
  state.jsonModified = true;
  updateButtonStates();

  // Sync slider and pill text
  const slider = elements.skillsWeightsPanel?.querySelector(`.skill-weight-slider[data-skill-index="${index}"]`);
  if (slider) slider.value = clamped;
  refreshSkillFractionPills();
  updateSkillCardWidths();

  if (showStatus) {
    flashPreviewStatus('Updated column weights for skills', 'status-success');
  }

  debouncedSkillPreview();

  // Save to localStorage
  saveStateToLocalStorage();
}

function refreshSkillFractionPills() {
  const skills = state.resumeData?.skills || [];
  if (!skills.length) return;
  const totalFraction = skills.reduce((sum, skill) => sum + (Number(skill.fraction) || 1), 0) || skills.length || 1;

  skills.forEach((skill, index) => {
    const fraction = Number(skill.fraction) || 1;
    const share = Math.round((fraction / totalFraction) * 100);
    const pill = elements.skillsWeightsPanel?.querySelector(`.skill-weight-pill[data-skill-index="${index}"]`);
    if (pill) {
      pill.innerHTML = `<i class="fas fa-ruler-horizontal"></i> ${fraction}x • ${share}% width`;
    }
  });
}

function renderSkillWeightsPanel(skills, totalFraction) {
  if (!elements.skillsWeightsPanel) return;
  if (!skills.length) {
    elements.skillsWeightsPanel.innerHTML = '';
    return;
  }

  const rows = skills.map((skill, index) => {
    const fraction = Number(skill.fraction) || 1;
    const share = Math.round((fraction / totalFraction) * 100);
    const displayName = escapeHtml(skill.name || 'Untitled group');
    return `
      <div class="skill-weight-row">
        <div class="skill-weight-name" title="${displayName}">${displayName}</div>
        <input class="skill-weight-slider" type="range"
               min="${MIN_SKILL_FRACTION}" max="${MAX_SKILL_FRACTION}" step="${SKILL_FRACTION_STEP}"
               value="${fraction}" data-skill-index="${index}">
        <span class="skill-weight-pill" data-skill-index="${index}"><i class="fas fa-ruler-horizontal"></i> ${fraction}x • ${share}% width</span>
      </div>
    `;
  }).join('');

  elements.skillsWeightsPanel.innerHTML = `
    <div class="skills-weights-panel-title">Adjust column widths</div>
    ${rows}
  `;

  // Attach handlers
  const sliders = elements.skillsWeightsPanel.querySelectorAll('.skill-weight-slider');
  sliders.forEach(slider => {
    slider.addEventListener('input', (e) => {
      const idx = parseInt(e.target.dataset.skillIndex, 10);
      const val = parseFloat(e.target.value);
      updateSkillFractionInline(idx, val, false);
    });
    slider.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.skillIndex, 10);
      const val = parseFloat(e.target.value);
      updateSkillFractionInline(idx, val, true);
    });
  });

  updateSkillCardWidths();
}

function updateSkillCardWidths() {
  const skills = state.resumeData?.skills || [];
  if (!skills.length || !elements.skillsList) return;
  const totalFraction = skills.reduce((sum, skill) => sum + (Number(skill.fraction) || 1), 0) || skills.length || 1;

  skills.forEach((skill, index) => {
    const fraction = Number(skill.fraction) || 1;
    const share = Math.round((fraction / totalFraction) * 100);
    const row = elements.skillsList.querySelector(`.skill-list-item-row[data-skill-index="${index}"]`);
    if (row) {
      row.style.flex = `0 0 ${share}%`;
      row.style.maxWidth = `${share}%`;
    }
  });

  applySkillTagOverflowHandling();
}

function applySkillTagOverflowHandling() {
  if (!elements.skillsList) return;
  requestAnimationFrame(() => {
    const containers = elements.skillsList.querySelectorAll('.skill-list-item-row .skill-tags');
    containers.forEach(container => adjustSkillTagsForContainer(container));
  });
}

function adjustSkillTagsForContainer(container) {
  if (!container) return;
  const existingBadges = container.querySelectorAll('.skill-tag-more');
  existingBadges.forEach(badge => badge.remove());
  container.classList.remove('skill-tags-overflow');

  const tags = Array.from(container.querySelectorAll('.skill-tag'));
  if (!tags.length) return;

  tags.forEach(tag => tag.classList.remove('skill-tag-hidden'));

  const nonPlaceholderTags = tags.filter(tag => !tag.classList.contains('skill-tag-empty'));
  if (!nonPlaceholderTags.length) return;

  const card = container.closest('.skill-list-item');
  let availableHeight = 0;
  if (card) {
    const header = card.querySelector('.skill-list-header');
    const controls = card.querySelector('.experience-list-item-controls');
    const cardStyles = window.getComputedStyle(card);
    const paddingTop = parseFloat(cardStyles.paddingTop || '0');
    const paddingBottom = parseFloat(cardStyles.paddingBottom || '0');
    const cardInnerHeight = card.clientHeight - paddingTop - paddingBottom;
    availableHeight = cardInnerHeight
      - (header?.offsetHeight || 0)
      - (controls?.offsetHeight || 0)
      - 12;
  }
  if (!availableHeight || availableHeight <= 0) {
    availableHeight = container.clientHeight || container.offsetHeight || 0;
  }
  availableHeight = Math.max(32, availableHeight);
  container.style.maxHeight = `${availableHeight}px`;

  let hiddenCount = 0;
  const visibleTags = [];

  const hideTag = (tag) => {
    if (!tag.classList.contains('skill-tag-hidden')) {
      tag.classList.add('skill-tag-hidden');
      hiddenCount += 1;
    }
  };

  nonPlaceholderTags.forEach(tag => {
    const tagBottom = tag.offsetTop + tag.offsetHeight;
    if (tagBottom <= availableHeight + 1) {
      visibleTags.push(tag);
    } else {
      hideTag(tag);
    }
  });

  if (hiddenCount === 0) {
    return;
  }

  const moreTag = document.createElement('span');
  moreTag.className = 'skill-tag skill-tag-more';
  container.appendChild(moreTag);
  container.classList.add('skill-tags-overflow');

  const updateMoreLabel = () => {
    moreTag.textContent = `+${hiddenCount} more`;
    moreTag.title = `${hiddenCount} more skill${hiddenCount === 1 ? '' : 's'} hidden`;
  };

  const badgeFits = () => (moreTag.offsetTop + moreTag.offsetHeight) <= (availableHeight + 1);

  updateMoreLabel();

  while (!badgeFits() && visibleTags.length > 0) {
    const lastVisible = visibleTags.pop();
    if (lastVisible) {
      hideTag(lastVisible);
      updateMoreLabel();
    }
  }

  if (!badgeFits()) {
    moreTag.remove();
    container.classList.remove('skill-tags-overflow');
  }
}

let skillTagsOverflowTimeout = null;

function scheduleSkillTagsOverflowUpdate() {
  if (!elements.skillsModal || !elements.skillsModal.classList.contains('show')) {
    return;
  }
  if (skillTagsOverflowTimeout) {
    clearTimeout(skillTagsOverflowTimeout);
  }
  skillTagsOverflowTimeout = setTimeout(() => {
    skillTagsOverflowTimeout = null;
    applySkillTagOverflowHandling();
  }, 150);
}

if (typeof window !== 'undefined') {
  window.addEventListener('resize', scheduleSkillTagsOverflowUpdate);
}

// Skills drag-and-drop for reordering groups
let draggedSkillGroupRow = null;

function handleSkillGroupDragStart(e) {
  if (e.target.closest('.experience-list-item-controls')) {
    e.preventDefault();
    return;
  }
  draggedSkillGroupRow = e.currentTarget.closest('.skill-list-item-row');
  if (!draggedSkillGroupRow) return;
  draggedSkillGroupRow.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', '');

  const card = draggedSkillGroupRow.querySelector('.skill-list-item');
  if (card) {
    const rect = card.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    e.dataTransfer.setDragImage(card, offsetX, offsetY);
  }
}

function handleSkillGroupDragOver(e) {
  if (!draggedSkillGroupRow || !elements.skillsList) return;
  e.preventDefault();

  const rows = elements.skillsList.querySelectorAll('.skill-list-item-row');
  rows.forEach(row => row.classList.remove('drag-over'));
  const overRow = e.currentTarget.closest('.skill-list-item-row');
  if (overRow) overRow.classList.add('drag-over');

  const afterElement = getSkillGroupDragAfterElement(elements.skillsList, e.clientX);
  if (!afterElement) {
    elements.skillsList.appendChild(draggedSkillGroupRow);
  } else {
    elements.skillsList.insertBefore(draggedSkillGroupRow, afterElement);
  }
}

function handleSkillGroupDrop(e) {
  if (!elements.skillsList) return;
  e.preventDefault();
  elements.skillsList.querySelectorAll('.skill-list-item-row').forEach(row => row.classList.remove('drag-over'));
  applySkillsReorder();
}

function handleSkillGroupDragLeave(e) {
  const row = e.currentTarget.closest('.skill-list-item-row');
  if (row) row.classList.remove('drag-over');
}

function handleSkillGroupDragEnd() {
  if (draggedSkillGroupRow) {
    draggedSkillGroupRow.classList.remove('dragging');
  }
  if (elements.skillsList) {
    elements.skillsList.querySelectorAll('.skill-list-item-row').forEach(row => row.classList.remove('drag-over'));
  }
  applySkillsReorder();
  draggedSkillGroupRow = null;
}

function getSkillGroupDragAfterElement(container, clientX) {
  if (!container) return null;
  const draggableElements = [...container.querySelectorAll('.skill-list-item-row:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = clientX - box.left - box.width / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    }
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function applySkillsReorder() {
  if (!elements.skillsList) return;
  const existing = state.resumeData.skills || [];
  if (existing.length < 2) return;

  const rows = [...elements.skillsList.querySelectorAll('.skill-list-item-row')];
  if (!rows.length) return;

  const newOrder = [];
  rows.forEach(row => {
    const originalIndex = parseInt(row.dataset.skillIndex, 10);
    if (!Number.isNaN(originalIndex) && existing[originalIndex] !== undefined) {
      newOrder.push(existing[originalIndex]);
    }
  });

  if (newOrder.length !== existing.length) return;

  state.resumeData.skills = newOrder;
  elements.jsonEditor.value = JSON.stringify(state.resumeData, null, 2);
  state.jsonModified = true;
  updateButtonStates();

  populateSkillsList();
  debouncedSkillPreview();
}

// Projects Management Functions
let currentEditingProjectIndex = null;

function openProjectsManagementModal() {
  populateProjectsList();

  // Update modal title with CV header name
  const sectionName = getCVHeaderName('projects');
  const titleElement = document.getElementById('projectsModalTitle');
  titleElement.textContent = sectionName;

  // Make sure the rename button event listener is attached
  const renameBtn = document.getElementById('renameProjectsSectionBtn');
  if (renameBtn) {
    // Remove old listeners by cloning and replacing
    const newRenameBtn = renameBtn.cloneNode(true);
    renameBtn.parentNode.replaceChild(newRenameBtn, renameBtn);

    // Add fresh event listener
    newRenameBtn.addEventListener('click', () => {
      console.log('Projects rename button clicked');
      renameSectionPrompt('projects');
    });
  }

  showModal(elements.projectsModal);
}

function closeProjectsManagementModal() {
  hideModal(elements.projectsModal);
  updateSectionManagementUI();
  autoGeneratePreview('section-edit');
}

function populateProjectsList() {
  if (!state.resumeData || !state.resumeData.projects || state.resumeData.projects.length === 0) {
    elements.projectsList.innerHTML = '<p style="color: var(--text-secondary); padding: 20px; text-align: center;">No project entries added. Click "Add new entry" to create one.</p>';
    return;
  }

  const projects = state.resumeData.projects;
  elements.projectsList.innerHTML = projects.map((project, index) => `
    <div class="project-list-item" data-project-index="${index}">
      <div class="project-drag-handle" title="Drag to reorder" aria-hidden="true">
        <i class="fas fa-grip-vertical"></i>
      </div>
      <div class="project-list-item-info">
        <div class="project-list-item-name">${escapeHtml(project.name || 'Untitled Project')}</div>
        <div class="project-list-item-desc">${escapeHtml(project.description || 'No description')}</div>
      </div>
      <div class="project-list-item-controls">
        <button class="btn btn-secondary btn-small" onclick="openProjectEditor(${index})">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn btn-danger btn-small" onclick="deleteProject(${index})">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    </div>
  `).join('');

  // Enable drag-and-drop reordering (grid supports both axes)
  const cards = elements.projectsList.querySelectorAll('.project-list-item');
  cards.forEach(card => {
    if (projects.length < 2) return;
    card.draggable = true;
    card.addEventListener('dragstart', handleProjectDragStart);
    card.addEventListener('dragend', handleProjectDragEnd);
    card.addEventListener('dragover', handleProjectDragOver);
  });
}

function openProjectEditor(projectIndex) {
  currentEditingProjectIndex = projectIndex;
  state.currentEditingSection = null; // Clear section editing state
  const project = state.resumeData.projects[projectIndex];

  // Populate form fields
  elements.projectFormTitle.textContent = `Edit Project: ${project.name || 'Untitled'}`;
  elements.projectName.value = project.name || '';
  elements.projectDescription.value = project.description || '';
  elements.projectTechnologies.value = project.technologies ? project.technologies.join(', ') : '';
  elements.projectLink.value = project.link || '';
  refreshProjectFormTitle();
  hideProjectFormError();
  updateProjectSaveButton();

  // Transition from list modal to form modal without flashing the backdrop
  transitionModals(elements.projectsModal, elements.projectFormModal);
  scheduleProjectFormFocus();
}

function addNewProject() {
  currentEditingProjectIndex = null;
  elements.projectFormTitle.textContent = 'Add New Project';
  elements.projectName.value = '';
  elements.projectDescription.value = '';
  elements.projectTechnologies.value = '';
  elements.projectLink.value = '';
  refreshProjectFormTitle();
  hideProjectFormError();
  updateProjectSaveButton();

  transitionModals(elements.projectsModal, elements.projectFormModal);
  scheduleProjectFormFocus();
}

function deleteProject(projectIndex) {
  if (!confirm('Are you sure you want to delete this project?')) {
    return;
  }

  state.resumeData.projects.splice(projectIndex, 1);
  elements.jsonEditor.value = JSON.stringify(state.resumeData, null, 2);
  state.jsonModified = true;

  populateProjectsList();
  flashPreviewStatus('Project deleted', 'status-success');
  autoGeneratePreview('section-edit');

  // Save to localStorage
  saveStateToLocalStorage();
}

function closeProjectFormModal() {
  // Transition to list modal first with backward animation
  transitionModals(elements.projectFormModal, elements.projectsModal, 'backward');

  // Wait for modal fade-out before clearing form to avoid showing empty fields
  setTimeout(() => {
    currentEditingProjectIndex = null;
    elements.projectForm.reset();
    hideProjectFormError();
  }, 150);
}

function showProjectFormError(message) {
  elements.projectFormError.textContent = message;
  elements.projectFormError.classList.add('show');
}

function hideProjectFormError() {
  elements.projectFormError.textContent = '';
  elements.projectFormError.classList.remove('show');
}

function updateProjectSaveButton() {
  const name = elements.projectName.value.trim();
  elements.saveProjectFormBtn.disabled = !name;
}

function scheduleProjectFormFocus() {
  const TRANSITION_BUFFER = 280;
  setTimeout(focusFirstProjectInput, TRANSITION_BUFFER);
}

function focusFirstProjectInput() {
  const fields = [
    elements.projectName,
    elements.projectDescription,
    elements.projectTechnologies,
    elements.projectLink
  ].filter(Boolean);

  if (!fields.length) {
    return;
  }

  const target = fields.find(field => !field.value.trim()) || fields[0];
  if (!target) {
    return;
  }

  requestAnimationFrame(() => {
    target.focus();
    if (typeof target.setSelectionRange === 'function') {
      const valueLength = target.value.length;
      target.setSelectionRange(valueLength, valueLength);
    }
  });
}

function saveProjectForm() {
  hideProjectFormError();

  const name = elements.projectName.value.trim();
  const description = elements.projectDescription.value.trim();
  const technologiesText = elements.projectTechnologies.value.trim();
  const link = elements.projectLink.value.trim();

  if (!name) {
    showProjectFormError('Project name is required');
    return;
  }

  const technologies = technologiesText
    ? technologiesText.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  const projectData = {
    name,
    description,
    technologies,
    link: link || ''
  };

  if (!state.resumeData.projects) {
    state.resumeData.projects = [];
  }

  if (currentEditingProjectIndex !== null) {
    state.resumeData.projects[currentEditingProjectIndex] = projectData;
    flashPreviewStatus('Project updated successfully', 'status-success');
  } else {
    state.resumeData.projects.push(projectData);
    flashPreviewStatus('Project added successfully', 'status-success');
  }

  elements.jsonEditor.value = JSON.stringify(state.resumeData, null, 2);
  state.jsonModified = true;
  updateButtonStates();

  closeProjectFormModal();
  populateProjectsList();
  autoGeneratePreview('section-edit');

  // Save to localStorage
  saveStateToLocalStorage();
}

// Experience Management Functions
let currentEditingExperienceIndex = null;

function openExperienceManagementModal() {
  populateExperienceList();

  // Update modal title with CV header name
  const sectionName = getCVHeaderName('experience');
  const titleElement = document.getElementById('experienceModalTitle');
  titleElement.textContent = sectionName;

  // Make sure the rename button event listener is attached
  const renameBtn = document.getElementById('renameExperienceSectionBtn');
  if (renameBtn) {
    // Remove old listeners by cloning and replacing
    const newRenameBtn = renameBtn.cloneNode(true);
    renameBtn.parentNode.replaceChild(newRenameBtn, renameBtn);

    // Add fresh event listener
    newRenameBtn.addEventListener('click', () => {
      console.log('Experience rename button clicked');
      renameSectionPrompt('experience');
    });
  }

  showModal(elements.experienceModal);

  // Position badges after initial render
  requestAnimationFrame(renderExperienceBadges);
}

function closeExperienceManagementModal() {
  hideModal(elements.experienceModal);
  updateSectionManagementUI();
  autoGeneratePreview('section-edit');
}

// Education Management Functions
let currentEditingEducationIndex = null;

function openEducationManagementModal() {
  populateEducationList();

  // Update modal title with CV header name
  const sectionName = getCVHeaderName('education');
  const titleElement = document.getElementById('educationModalTitle');
  titleElement.textContent = sectionName;

  // Attach rename button listener fresh
  const renameBtn = document.getElementById('renameEducationSectionBtn');
  if (renameBtn) {
    const newRenameBtn = renameBtn.cloneNode(true);
    renameBtn.parentNode.replaceChild(newRenameBtn, renameBtn);
    newRenameBtn.addEventListener('click', () => {
      renameSectionPrompt('education');
    });
  }

  showModal(elements.educationModal);

  requestAnimationFrame(renderEducationBadges);
}

function closeEducationManagementModal() {
  hideModal(elements.educationModal);
  removeEducationBadges();
  updateSectionManagementUI();
  autoGeneratePreview('section-edit');
}

function populateEducationList() {
  if (!state.resumeData || !state.resumeData.education || state.resumeData.education.length === 0) {
    elements.educationList.innerHTML = '<p style="color: var(--text-secondary); padding: 20px; text-align: center;">No education entries added. Click "Add new entry" to create one.</p>';
    removeEducationBadges();
    return;
  }

  const education = state.resumeData.education;
  const total = education.length;

  elements.educationList.innerHTML = education.map((edu, index) => {
    const startDate = edu.startDate ? formatDateForDisplay(edu.startDate) : '';
    const gradDate = edu.graduationDate ? formatDateForDisplay(edu.graduationDate) : 'Present';
    const dateRange = startDate ? `${startDate} - ${gradDate}` : gradDate;

    return `
    <div class="experience-list-item-row" data-edu-index="${index}">
      <div class="experience-list-item">
        <div class="experience-drag-handle" title="Drag to reorder">
          <i class="fas fa-grip-vertical"></i>
        </div>
        <div class="experience-list-item-info">
          <div class="experience-list-item-position">${escapeHtml(edu.degree || 'Untitled Degree')}</div>
          <div class="experience-list-item-company">${escapeHtml(edu.institution || 'No institution')}</div>
          <div class="experience-list-item-date">${dateRange}</div>
          <div class="experience-list-item-company">${escapeHtml(edu.level || '')}</div>
        </div>
        <div class="experience-list-item-controls">
          <button class="btn btn-secondary btn-small" onclick="openEducationEditor(${index})">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="btn btn-danger btn-small" onclick="deleteEducation(${index})">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    </div>
    `;
  }).join('');

  // Attach drag-and-drop handlers for reordering
  const rows = elements.educationList.querySelectorAll('.experience-list-item-row');
  rows.forEach(row => {
    if (total < 2) return;
    const handle = row.querySelector('.experience-list-item');
    if (!handle) return;

    handle.draggable = true;
    handle.addEventListener('dragstart', handleEducationDragStart);
    handle.addEventListener('dragend', handleEducationDragEnd);

    row.addEventListener('dragover', handleEducationDragOver);
    row.addEventListener('drop', handleEducationDrop);
    row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
  });

  requestAnimationFrame(() => updateListVerticalCentering(elements.educationList));
  renderEducationBadges();
}
function populateExperienceList() {
  if (!state.resumeData || !state.resumeData.experience || state.resumeData.experience.length === 0) {
    elements.experienceList.innerHTML = '<p style="color: var(--text-secondary); padding: 20px; text-align: center;">No experience entries added. Click "Add new entry" to create one.</p>';
    return;
  }

  const experiences = state.resumeData.experience;
  const total = experiences.length;

  elements.experienceList.innerHTML = experiences.map((exp, index) => {
    const startDate = exp.startDate ? formatDateForDisplay(exp.startDate) : '';
    const endDate = exp.endDate ? formatDateForDisplay(exp.endDate) : 'Present';
    const dateRange = startDate ? `${startDate} - ${endDate}` : endDate;

    return `
    <div class="experience-list-item-row" data-index="${index}">
      <div class="experience-list-item">
        <div class="experience-drag-handle" title="Drag to reorder">
          <i class="fas fa-grip-vertical"></i>
        </div>
        <div class="experience-list-item-info">
          <div class="experience-list-item-position">${escapeHtml(exp.position || 'Untitled Position')}</div>
          <div class="experience-list-item-company">${escapeHtml(exp.company || 'No company')}</div>
          <div class="experience-list-item-date">${dateRange}</div>
        </div>
        <div class="experience-list-item-controls">
          <button class="btn btn-secondary btn-small" onclick="openExperienceEditor(${index})">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="btn btn-danger btn-small" onclick="deleteExperience(${index})">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    </div>
    `;
  }).join('');

  // Attach drag-and-drop handlers for reordering (card initiates drag, rows are drop targets)
  const rows = elements.experienceList.querySelectorAll('.experience-list-item-row');
  rows.forEach(row => {
    if (total < 2) return;
    const handle = row.querySelector('.experience-list-item');
    if (!handle) return;

    handle.draggable = true;
    handle.addEventListener('dragstart', handleExperienceDragStart);
    handle.addEventListener('dragend', handleExperienceDragEnd);

    row.addEventListener('dragover', handleExperienceDragOver);
    row.addEventListener('drop', handleExperienceDrop);
    row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
  });

  requestAnimationFrame(() => updateListVerticalCentering(elements.experienceList));
  renderExperienceBadges();
}

function formatDateForDisplay(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}.${year}`;
}

// Experience drag-and-drop for reordering
let draggedExperienceRow = null;
let draggedExperienceIndex = null;

function handleExperienceDragStart(e) {
  if (e.target.closest('.experience-list-item-controls')) {
    e.preventDefault();
    return;
  }
  draggedExperienceRow = e.currentTarget.closest('.experience-list-item-row');
  if (!draggedExperienceRow) return;
  draggedExperienceIndex = parseInt(draggedExperienceRow.dataset.index, 10);
  draggedExperienceRow.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', '');

  // Use the full card as the drag image for clearer feedback
  const card = draggedExperienceRow.querySelector('.experience-list-item');
  if (card) {
    const rect = card.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    e.dataTransfer.setDragImage(card, offsetX, offsetY);
  }
}

function handleExperienceDragOver(e) {
  if (!draggedExperienceRow) return;
  e.preventDefault();
  elements.experienceList.querySelectorAll('.experience-list-item-row').forEach(row => row.classList.remove('drag-over'));
  const overRow = e.currentTarget.closest('.experience-list-item-row');
  if (overRow) overRow.classList.add('drag-over');

  const afterElement = getExperienceDragAfterElement(elements.experienceList, e.clientY);
  if (afterElement == null) {
    elements.experienceList.appendChild(draggedExperienceRow);
  } else {
    elements.experienceList.insertBefore(draggedExperienceRow, afterElement);
  }
}

function handleExperienceDrop(e) {
  e.preventDefault();
  elements.experienceList.querySelectorAll('.experience-list-item-row').forEach(row => row.classList.remove('drag-over'));
  applyExperienceReorder();
}

function handleExperienceDragEnd() {
  if (draggedExperienceRow) {
    draggedExperienceRow.classList.remove('dragging');
  }
  elements.experienceList.querySelectorAll('.experience-list-item-row').forEach(row => row.classList.remove('drag-over'));
  applyExperienceReorder();

  draggedExperienceRow = null;
  draggedExperienceIndex = null;

  renderExperienceBadges();
}

function getExperienceDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.experience-list-item-row:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    }
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function renderExperienceBadges() {
  requestAnimationFrame(() => {
    const rows = elements.experienceList.querySelectorAll('.experience-list-item-row');
    const total = rows.length;

    if (total < 2) {
      removeExperienceBadges();
      return;
    }

    const newestBadge = getOrCreateExperienceBadge('experienceBadgeNewest', 'Most recent', 'age-newest');
    const oldestBadge = getOrCreateExperienceBadge('experienceBadgeOldest', 'Oldest', 'age-oldest');

    positionExperienceBadge(newestBadge, 'top');
    positionExperienceBadge(oldestBadge, 'bottom');
  });
}

function getOrCreateExperienceBadge(id, label, extraClass) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('span');
    el.id = id;
    el.className = `experience-age-pill ${extraClass}`;
    el.textContent = label;
    el.setAttribute('aria-hidden', 'true');
    const modalBody = elements.experienceModal?.querySelector('.modal-body');
    if (modalBody) {
      modalBody.appendChild(el);
    }
  } else {
    el.className = `experience-age-pill ${extraClass}`;
    el.textContent = label;
  }
  return el;
}

function positionExperienceBadge(badgeEl, position) {
  if (!badgeEl) return;
  badgeEl.style.top = position === 'top' ? '35%' : 'auto';
  badgeEl.style.bottom = position === 'bottom' ? '35%' : 'auto';
  badgeEl.style.display = 'inline-flex';
}

function removeExperienceBadges() {
  ['experienceBadgeNewest', 'experienceBadgeOldest'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });
}

function applyExperienceReorder() {
  const existing = state.resumeData.experience || [];
  if (existing.length < 2) return;

  const rows = [...elements.experienceList.querySelectorAll('.experience-list-item-row')];
  const newOrder = [];

  rows.forEach(row => {
    const originalIndex = parseInt(row.dataset.index, 10);
    if (!isNaN(originalIndex) && existing[originalIndex] !== undefined) {
      newOrder.push(existing[originalIndex]);
    }
  });

  if (newOrder.length !== existing.length) return;

  state.resumeData.experience = newOrder;
  elements.jsonEditor.value = JSON.stringify(state.resumeData, null, 2);
  state.jsonModified = true;
  updateButtonStates();

  // Refresh list to reset data-index and badges
  populateExperienceList();

  autoGeneratePreview('section-reorder');

  draggedExperienceIndex = null;
}

// Education drag-and-drop for reordering
let draggedEducationRow = null;
let draggedEducationIndex = null;

function handleEducationDragStart(e) {
  if (e.target.closest('.experience-list-item-controls')) {
    e.preventDefault();
    return;
  }
  draggedEducationRow = e.currentTarget.closest('.experience-list-item-row');
  if (!draggedEducationRow) return;
  draggedEducationIndex = parseInt(draggedEducationRow.dataset.eduIndex, 10);
  draggedEducationRow.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', '');

  const card = draggedEducationRow.querySelector('.experience-list-item');
  if (card) {
    const rect = card.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    e.dataTransfer.setDragImage(card, offsetX, offsetY);
  }
}

function handleEducationDragOver(e) {
  if (!draggedEducationRow) return;
  e.preventDefault();
  elements.educationList.querySelectorAll('.experience-list-item-row').forEach(row => row.classList.remove('drag-over'));
  const overRow = e.currentTarget.closest('.experience-list-item-row');
  if (overRow) overRow.classList.add('drag-over');

  const afterElement = getEducationDragAfterElement(elements.educationList, e.clientY);
  if (afterElement == null) {
    elements.educationList.appendChild(draggedEducationRow);
  } else {
    elements.educationList.insertBefore(draggedEducationRow, afterElement);
  }

  renderEducationBadges();
}

function handleEducationDrop(e) {
  e.preventDefault();
  elements.educationList.querySelectorAll('.experience-list-item-row').forEach(row => row.classList.remove('drag-over'));
  applyEducationReorder();
}

function handleEducationDragEnd() {
  if (draggedEducationRow) {
    draggedEducationRow.classList.remove('dragging');
  }
  elements.educationList.querySelectorAll('.experience-list-item-row').forEach(row => row.classList.remove('drag-over'));
  applyEducationReorder();

  draggedEducationRow = null;
  draggedEducationIndex = null;
}

function getEducationDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.experience-list-item-row:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    }
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function applyEducationReorder() {
  const existing = state.resumeData.education || [];
  if (existing.length < 2) return;

  const rows = [...elements.educationList.querySelectorAll('.experience-list-item-row')];
  const newOrder = [];

  rows.forEach(row => {
    const originalIndex = parseInt(row.dataset.eduIndex, 10);
    if (!isNaN(originalIndex) && existing[originalIndex] !== undefined) {
      newOrder.push(existing[originalIndex]);
    }
  });

  if (newOrder.length !== existing.length) return;

  state.resumeData.education = newOrder;
  elements.jsonEditor.value = JSON.stringify(state.resumeData, null, 2);
  state.jsonModified = true;
  updateButtonStates();

  populateEducationList();
  autoGeneratePreview('section-reorder');
}

// Projects drag-and-drop for reordering (supports grid layout)
let draggedProjectCard = null;

function handleProjectDragStart(e) {
  if (e.target.closest('.project-list-item-controls')) {
    e.preventDefault();
    return;
  }
  draggedProjectCard = e.currentTarget;
  draggedProjectCard.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', '');

  const rect = draggedProjectCard.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const offsetY = e.clientY - rect.top;
  e.dataTransfer.setDragImage(draggedProjectCard, offsetX, offsetY);
}

function handleProjectDragOver(e) {
  if (!draggedProjectCard) return;
  e.preventDefault();

  const overCard = e.target.closest('.project-list-item');
  if (!overCard || overCard === draggedProjectCard) return;

  const rect = overCard.getBoundingClientRect();
  const isSameRow = e.clientY >= rect.top && e.clientY <= rect.bottom;
  const insertBefore = isSameRow
    ? e.clientX < rect.left + rect.width / 2
    : e.clientY < rect.top + rect.height / 2;

  if (insertBefore) {
    elements.projectsList.insertBefore(draggedProjectCard, overCard);
  } else {
    elements.projectsList.insertBefore(draggedProjectCard, overCard.nextSibling);
  }
}

function handleProjectDragEnd() {
  if (draggedProjectCard) {
    draggedProjectCard.classList.remove('dragging');
  }
  applyProjectsReorder();
  draggedProjectCard = null;
}

function applyProjectsReorder() {
  const existing = state.resumeData.projects || [];
  if (existing.length < 2) return;

  const cards = [...elements.projectsList.querySelectorAll('.project-list-item')];
  const newOrder = [];

  cards.forEach(card => {
    const originalIndex = parseInt(card.dataset.projectIndex, 10);
    if (!isNaN(originalIndex) && existing[originalIndex] !== undefined) {
      newOrder.push(existing[originalIndex]);
    }
  });

  if (newOrder.length !== existing.length) return;

  state.resumeData.projects = newOrder;
  elements.jsonEditor.value = JSON.stringify(state.resumeData, null, 2);
  state.jsonModified = true;
  updateButtonStates();

  populateProjectsList();
  autoGeneratePreview('section-reorder');
}

function renderEducationBadges() {
  requestAnimationFrame(() => {
    const rows = elements.educationList.querySelectorAll('.experience-list-item-row');
    const total = rows.length;

    if (total < 2) {
      removeEducationBadges();
      return;
    }

    const newestBadge = getOrCreateEducationBadge('educationBadgeNewest', 'Most recent', 'age-newest');
    const oldestBadge = getOrCreateEducationBadge('educationBadgeOldest', 'Oldest', 'age-oldest');

    positionEducationBadge(newestBadge, 'top');
    positionEducationBadge(oldestBadge, 'bottom');
  });
}

function getOrCreateEducationBadge(id, label, extraClass) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('span');
    el.id = id;
    el.className = `experience-age-pill ${extraClass}`;
    el.textContent = label;
    el.setAttribute('aria-hidden', 'true');
    const modalBody = elements.educationModal?.querySelector('.modal-body');
    if (modalBody) {
      modalBody.appendChild(el);
    }
  } else {
    el.className = `experience-age-pill ${extraClass}`;
    el.textContent = label;
  }
  return el;
}

function positionEducationBadge(badgeEl, position) {
  if (!badgeEl) return;
  badgeEl.style.top = position === 'top' ? '35%' : 'auto';
  badgeEl.style.bottom = position === 'bottom' ? '35%' : 'auto';
  badgeEl.style.display = 'inline-flex';
}

function updateListVerticalCentering(listEl) {
  if (!listEl) return;
  const shouldCenter = listEl.scrollHeight <= listEl.clientHeight;
  listEl.classList.toggle('is-centered', shouldCenter);
}

function removeEducationBadges() {
  ['educationBadgeNewest', 'educationBadgeOldest'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });
}

function openExperienceEditor(experienceIndex) {
  currentEditingExperienceIndex = experienceIndex;
  const experience = state.resumeData.experience[experienceIndex];

  // Populate form fields
  elements.experienceFormTitle.textContent = `Edit Experience: ${experience.position || 'Untitled'}`;
  elements.expPosition.value = experience.position || '';
  elements.expCompany.value = experience.company || '';
  setSplitDate(experience.startDate, 'expStartDateYear', 'expStartDateMonth');
  setSplitDate(experience.endDate, 'expEndDateYear', 'expEndDateMonth', 'expStillWorking');
  captureNullableDateSnapshot('expStillWorking', 'expEndDateYear', 'expEndDateMonth');
  refreshExperienceFormTitle();

  // Populate responsibilities
  populateResponsibilities(experience.responsibilities || []);

  // Crossfade from list modal to form modal to avoid backdrop flicker
  transitionModals(elements.experienceModal, elements.experienceFormModal);
  focusExperienceFormFirstEmptyField();
}

function addNewExperience() {
  currentEditingExperienceIndex = null; // Indicate this is a new experience

  // Clear form fields
  elements.experienceFormTitle.textContent = 'Add New Experience';
  elements.expPosition.value = '';
  elements.expCompany.value = '';
  setSplitDate(null, 'expStartDateYear', 'expStartDateMonth');
  setSplitDate(null, 'expEndDateYear', 'expEndDateMonth', 'expStillWorking');
  captureNullableDateSnapshot('expStillWorking', 'expEndDateYear', 'expEndDateMonth');
  refreshExperienceFormTitle();

  // Add one empty responsibility field
  populateResponsibilities([]);

  transitionModals(elements.experienceModal, elements.experienceFormModal);
  focusExperienceFormFirstEmptyField();
}

function deleteExperience(experienceIndex) {
  if (!confirm('Are you sure you want to delete this experience?')) {
    return;
  }

  state.resumeData.experience.splice(experienceIndex, 1);
  elements.jsonEditor.value = JSON.stringify(state.resumeData, null, 2);
  state.jsonModified = true;

  populateExperienceList();
  flashPreviewStatus('Experience deleted', 'status-success');
  autoGeneratePreview('section-edit');

  // Save to localStorage
  saveStateToLocalStorage();
}

function refreshExperienceFormTitle() {
  if (!elements.experienceFormTitle) return;
  const position = elements.expPosition.value.trim();
  const base = currentEditingExperienceIndex !== null ? 'Edit Experience' : 'Add New Experience';
  elements.experienceFormTitle.textContent = position ? `${base}: ${position}` : base;
}

function focusExperienceFormFirstEmptyField() {
  const orderedFields = [
    'expPosition',
    'expCompany',
    'expStartDateYear',
    'expStartDateMonth',
    'expEndDateYear',
    'expEndDateMonth'
  ];

  const findFieldToFocus = () => {
    for (const fieldId of orderedFields) {
      const input = document.getElementById(fieldId);
      if (!input || input.disabled) continue;
      if (input.value.trim() === '') {
        return input;
      }
    }

    for (const fieldId of orderedFields) {
      const input = document.getElementById(fieldId);
      if (input && !input.disabled) {
        return input;
      }
    }

    return null;
  };

  const focusField = () => {
    const target = findFieldToFocus();
    if (!target) return;
    target.focus({ preventScroll: true });
    if (typeof target.setSelectionRange === 'function') {
      const length = target.value.length;
      target.setSelectionRange(length, length);
    }
  };

  requestAnimationFrame(() => requestAnimationFrame(focusField));
}

// Education Form Functions
function openEducationEditor(educationIndex) {
  currentEditingEducationIndex = educationIndex;
  const edu = state.resumeData.education[educationIndex];

  elements.educationFormTitle.textContent = `Edit Education: ${edu.degree || 'Untitled'}`;
  elements.edDegree.value = edu.degree || '';
  elements.edLevel.value = edu.level || '';
  elements.edInstitution.value = edu.institution || '';
  setSplitDate(edu.startDate, 'edStartDateYear', 'edStartDateMonth');
  setSplitDate(edu.graduationDate, 'edGraduationDateYear', 'edGraduationDateMonth', 'edStillStudying');
  captureNullableDateSnapshot('edStillStudying', 'edGraduationDateYear', 'edGraduationDateMonth');
  refreshEducationFormTitle();

  hideEducationFormError();

  transitionModals(elements.educationModal, elements.educationFormModal);
  updateSaveButtonState('educationForm', 'saveEducationFormBtn');
  focusEducationFormFirstEmptyField();
}

function addNewEducation() {
  currentEditingEducationIndex = null;

  elements.educationFormTitle.textContent = 'Add Education';
  elements.edDegree.value = '';
  elements.edLevel.value = '';
  elements.edInstitution.value = '';
  setSplitDate(null, 'edStartDateYear', 'edStartDateMonth');
  setSplitDate(null, 'edGraduationDateYear', 'edGraduationDateMonth', 'edStillStudying');
  captureNullableDateSnapshot('edStillStudying', 'edGraduationDateYear', 'edGraduationDateMonth');
  refreshEducationFormTitle();

  hideEducationFormError();

  transitionModals(elements.educationModal, elements.educationFormModal);
  updateSaveButtonState('educationForm', 'saveEducationFormBtn');
  focusEducationFormFirstEmptyField();
}

function deleteEducation(index) {
  if (!confirm('Are you sure you want to delete this education entry?')) return;

  state.resumeData.education.splice(index, 1);
  elements.jsonEditor.value = JSON.stringify(state.resumeData, null, 2);
  state.jsonModified = true;

  populateEducationList();
  flashPreviewStatus('Education entry deleted', 'status-success');
  autoGeneratePreview('section-edit');

  // Save to localStorage
  saveStateToLocalStorage();
}

function refreshEducationFormTitle() {
  if (!elements.educationFormTitle) return;
  const degree = elements.edDegree.value.trim();
  const base = currentEditingEducationIndex !== null ? 'Edit Education' : 'Add Education';
  elements.educationFormTitle.textContent = degree ? `${base}: ${degree}` : base;
}

function focusEducationFormFirstEmptyField() {
  const orderedFields = [
    'edDegree',
    'edLevel',
    'edInstitution',
    'edStartDateYear',
    'edStartDateMonth',
    'edGraduationDateYear',
    'edGraduationDateMonth'
  ];

  const findFieldToFocus = () => {
    for (const fieldId of orderedFields) {
      const input = document.getElementById(fieldId);
      if (!input || input.disabled) continue;
      if (input.value.trim() === '') {
        return input;
      }
    }

    for (const fieldId of orderedFields) {
      const input = document.getElementById(fieldId);
      if (input && !input.disabled) {
        return input;
      }
    }

    return null;
  };

  const focusField = () => {
    const target = findFieldToFocus();
    if (!target) return;
    target.focus({ preventScroll: true });
    if (typeof target.setSelectionRange === 'function') {
      const length = target.value.length;
      target.setSelectionRange(length, length);
    }
  };

  requestAnimationFrame(() => requestAnimationFrame(focusField));
}

function refreshProjectFormTitle() {
  if (!elements.projectFormTitle) return;
  const name = elements.projectName.value.trim();
  const base = currentEditingProjectIndex !== null ? 'Edit Project' : 'Add New Project';
  elements.projectFormTitle.textContent = name ? `${base}: ${name}` : base;
}

// Experience Form Functions
function populateResponsibilities(responsibilities) {
  elements.responsibilitiesList.innerHTML = '';

  if (responsibilities.length === 0) {
    addResponsibilityField();
  } else {
    responsibilities.forEach(resp => addResponsibilityField(resp));
  }

  const items = elements.responsibilitiesList.querySelectorAll('.responsibility-item');
  items.forEach(item => {
    const handle = item.querySelector('.responsibility-drag-handle');
    if (handle) {
      handle.draggable = true;
      handle.addEventListener('dragstart', handleResponsibilityDragStart);
      handle.addEventListener('dragend', handleResponsibilityDragEnd);
    }
    item.addEventListener('dragover', handleResponsibilityDragOver);
  });

  updateAddResponsibilityButton();
}

function updateAddResponsibilityButton() {
  const count = elements.responsibilitiesList.querySelectorAll('.responsibility-item').length;
  const addBtn = elements.addResponsibilityBtn;

  addBtn.disabled = false;
  addBtn.title = 'Add Responsibility';
}

function addResponsibilityField(text = '') {
  const count = elements.responsibilitiesList.querySelectorAll('.responsibility-item').length;

  const item = document.createElement('div');
  item.className = 'responsibility-item';
  item.innerHTML = `
    <button type="button" class="responsibility-drag-handle" title="Drag to reorder">
      <i class="fas fa-grip-vertical"></i>
    </button>
    <input type="text" value="${escapeHtml(text || '')}" />
    <button type="button" class="btn-icon" onclick="removeResponsibility(this)" title="Remove">
      <i class="fas fa-trash-alt"></i>
    </button>
  `;
  elements.responsibilitiesList.appendChild(item);
  const handle = item.querySelector('.responsibility-drag-handle');
  if (handle) {
    handle.draggable = true;
    handle.addEventListener('dragstart', handleResponsibilityDragStart);
    handle.addEventListener('dragend', handleResponsibilityDragEnd);
  }
  item.addEventListener('dragover', handleResponsibilityDragOver);
  updateAddResponsibilityButton();

  return item.querySelector('input[type="text"]') || null;
}

function removeResponsibility(button) {
  const item = button.closest('.responsibility-item');
  item.remove();
  updateAddResponsibilityButton();
}

// Responsibility drag-and-drop
let draggedResponsibilityItem = null;

function handleResponsibilityDragStart(e) {
  draggedResponsibilityItem = e.currentTarget.closest('.responsibility-item');
  if (draggedResponsibilityItem) {
    draggedResponsibilityItem.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
    const rect = draggedResponsibilityItem.getBoundingClientRect();
    e.dataTransfer.setDragImage(draggedResponsibilityItem, e.clientX - rect.left, e.clientY - rect.top);
  }
}

function handleResponsibilityDragEnd() {
  if (draggedResponsibilityItem) {
    draggedResponsibilityItem.classList.remove('dragging');
  }
  draggedResponsibilityItem = null;
  renumberResponsibilities();
}

function handleResponsibilityDragOver(e) {
  if (!draggedResponsibilityItem) return;
  e.preventDefault();
  const overItem = e.currentTarget.closest('.responsibility-item');
  if (!overItem || overItem === draggedResponsibilityItem) return;
  const rect = overItem.getBoundingClientRect();
  const insertBefore = e.clientY < rect.top + rect.height / 2;
  if (insertBefore) {
    elements.responsibilitiesList.insertBefore(draggedResponsibilityItem, overItem);
  } else {
    elements.responsibilitiesList.insertBefore(draggedResponsibilityItem, overItem.nextSibling);
  }
}

function renumberResponsibilities() {
  const items = elements.responsibilitiesList.querySelectorAll('.responsibility-item');
  items.forEach((item, index) => {
    const input = item.querySelector('input[type="text"]');
    if (input) {
      input.dataset.index = index;
    }
  });
}

function closeExperienceFormModal(reopenList = false) {
  if (reopenList) {
    transitionModals(elements.experienceFormModal, elements.experienceModal, 'backward');
    // Wait for modal fade-out before clearing form to avoid showing empty fields
    setTimeout(() => {
      currentEditingExperienceIndex = null;
      elements.experienceForm.reset();
      elements.responsibilitiesList.innerHTML = '';
      hideExperienceFormError();
    }, 150);
  } else {
    hideModal(elements.experienceFormModal);
    setTimeout(() => {
      currentEditingExperienceIndex = null;
      elements.experienceForm.reset();
      elements.responsibilitiesList.innerHTML = '';
      hideExperienceFormError();
    }, 150);
  }
}

function showExperienceFormError(message) {
  elements.experienceFormError.textContent = message;
  elements.experienceFormError.classList.add('show');
}

function hideExperienceFormError() {
  elements.experienceFormError.textContent = '';
  elements.experienceFormError.classList.remove('show');
}

function saveExperienceForm() {
  hideExperienceFormError();

  // Get dates from split inputs
  const startDate = getCombinedDate('expStartDateYear', 'expStartDateMonth');
  const endDate = getCombinedDate('expEndDateYear', 'expEndDateMonth', 'expStillWorking');

  // Validate required fields
  if (!elements.expPosition.value.trim() || !elements.expCompany.value.trim() || !startDate) {
    showExperienceFormError('Please fill in all required fields (Position, Company, Start Date)');
    return;
  }

  // Validate dates
  if (!validateDateFormatWithError(startDate, showExperienceFormError)) {
    return;
  }

  if (endDate && !validateDateFormatWithError(endDate, showExperienceFormError)) {
    return;
  }

  // Check that end date is not before start date
  if (endDate && startDate > endDate) {
    showExperienceFormError('End date cannot be before start date');
    return;
  }

  // Collect responsibilities
  const responsibilities = [];
  const responsibilityInputs = elements.responsibilitiesList.querySelectorAll('.responsibility-item input[type="text"]');
  responsibilityInputs.forEach(input => {
    const text = input.value.trim();
    if (text) {
      responsibilities.push(text);
    }
  });

  // Create experience object
  const experienceData = {
    position: elements.expPosition.value.trim(),
    company: elements.expCompany.value.trim(),
    startDate: startDate,
    endDate: endDate || null,
    responsibilities: responsibilities
  };

  // Update or add experience
  if (currentEditingExperienceIndex !== null) {
    // Update existing
    state.resumeData.experience[currentEditingExperienceIndex] = experienceData;
    flashPreviewStatus('Experience updated successfully', 'status-success');
  } else {
    // Add new
    if (!state.resumeData.experience) {
      state.resumeData.experience = [];
    }
    state.resumeData.experience.push(experienceData);
    flashPreviewStatus('New experience added', 'status-success');
  }

  // Update JSON editor
  elements.jsonEditor.value = JSON.stringify(state.resumeData, null, 2);
  state.jsonModified = true;

  // Close form and reopen experience list
  closeExperienceFormModal(true);
  openExperienceManagementModal();
  autoGeneratePreview('section-edit');

  // Save to localStorage
  saveStateToLocalStorage();
}

// Validate date format (YYYY-MM)
function validateDateFormat(dateStr) {
  return validateDateFormatWithError(dateStr, showError);
}

// Validate date format with custom error display function
function validateDateFormatWithError(dateStr, errorFn) {
  // Check format YYYY-MM
  const datePattern = /^(\d{4})-(\d{2})$/;
  const match = dateStr.match(datePattern);

  if (!match) {
    errorFn('Date must be in YYYY-MM format (e.g., 2023-06)');
    return false;
  }

  const year = parseInt(match[1]);
  const month = parseInt(match[2]);

  // Validate year (reasonable range)
  if (year < 1900 || year > 2100) {
    errorFn('Year must be between 1900 and 2100');
    return false;
  }

  // Validate month (01-12)
  if (month < 1 || month > 12) {
    errorFn('Month must be between 01 and 12');
    return false;
  }

  return true;
}

function closeEducationFormModal(reopenList = false) {
  if (reopenList) {
    transitionModals(elements.educationFormModal, elements.educationModal, 'backward');
    // Wait for modal fade-out before clearing form to avoid showing empty fields
    setTimeout(() => {
      currentEditingEducationIndex = null;
      elements.educationForm.reset();
      hideEducationFormError();
    }, 150);
  } else {
    hideModal(elements.educationFormModal);
    setTimeout(() => {
      currentEditingEducationIndex = null;
      elements.educationForm.reset();
      hideEducationFormError();
    }, 150);
  }
}

function showEducationFormError(message) {
  elements.educationFormError.textContent = message;
  elements.educationFormError.classList.add('show');
}

function hideEducationFormError() {
  elements.educationFormError.textContent = '';
  elements.educationFormError.classList.remove('show');
}

function saveEducationForm() {
  hideEducationFormError();

  const degree = elements.edDegree.value.trim();
  const level = elements.edLevel.value.trim();
  const institution = elements.edInstitution.value.trim();
  const startDate = getCombinedDate('edStartDateYear', 'edStartDateMonth');
  const graduationDate = getCombinedDate('edGraduationDateYear', 'edGraduationDateMonth', 'edStillStudying');

  if (!degree || !level || !institution || !startDate) {
    showEducationFormError('Please fill in all required fields (Degree, Level, Institution, Start Date)');
    return;
  }

  if (!validateDateFormatWithError(startDate, showEducationFormError)) {
    return;
  }

  if (graduationDate && !validateDateFormatWithError(graduationDate, showEducationFormError)) {
    return;
  }

  if (graduationDate && startDate > graduationDate) {
    showEducationFormError('Graduation date cannot be before start date');
    return;
  }

  const educationData = {
    degree,
    level,
    institution,
    startDate,
    graduationDate: graduationDate || null
  };

  if (currentEditingEducationIndex !== null) {
    state.resumeData.education[currentEditingEducationIndex] = educationData;
    flashPreviewStatus('Education updated successfully', 'status-success');
  } else {
    if (!state.resumeData.education) {
      state.resumeData.education = [];
    }
    state.resumeData.education.push(educationData);
    flashPreviewStatus('Education added successfully', 'status-success');
  }

  elements.jsonEditor.value = JSON.stringify(state.resumeData, null, 2);
  state.jsonModified = true;
  updateButtonStates();

  closeEducationFormModal(true);
  populateEducationList();

  updateSectionManagementUI();
  autoGeneratePreview('section-edit');

  // Save to localStorage
  saveStateToLocalStorage();
}

// Helper function to extract slug from LinkedIn URL
function extractLinkedinSlug(url) {
  if (!url) return '';
  // Remove protocol
  const cleaned = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
  // Extract slug after linkedin.com/in/ or linkedin.com/company/
  const match = cleaned.match(/linkedin\.com\/(in|company)\/([^\/\?]+)/);
  if (match) {
    return match[2]; // Return just the username/company name
  }
  // If it's already just a slug, return it
  if (!cleaned.includes('/') && !cleaned.includes('.')) {
    return cleaned;
  }
  return url;
}

// Helper function to extract slug from GitHub URL
function extractGithubSlug(url) {
  if (!url) return '';
  // Remove protocol
  const cleaned = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
  // Extract slug after github.com/
  const match = cleaned.match(/github\.com\/([^\/\?]+)/);
  if (match) {
    return match[1]; // Return just the username
  }
  // If it's already just a slug, return it
  if (!cleaned.includes('/') && !cleaned.includes('.')) {
    return cleaned;
  }
  return url;
}

// Personal Info Modal Functions
function updatePersonalInfoSaveButton() {
  const name = elements.piName.value.trim();
  elements.savePersonalInfoBtn.disabled = !name;
}

function openPersonalInfoModal() {
  // Populate form with current data
  const personalInfo = state.resumeData?.personalInfo || {};

  elements.piName.value = personalInfo.name || '';
  elements.piTitle.value = personalInfo.title || '';
  elements.piEmail.value = personalInfo.email || '';
  elements.piPhone.value = personalInfo.phone || '';
  elements.piLinkedin.value = extractLinkedinSlug(personalInfo.linkedin) || '';
  elements.piGithub.value = extractGithubSlug(personalInfo.github) || '';
  elements.piWebsite.value = personalInfo.website || '';
  elements.piLocation.value = personalInfo.location || '';
  const hasPersonalBio = personalInfo && Object.prototype.hasOwnProperty.call(personalInfo, 'bio');
  elements.piBio.value = hasPersonalBio ? (personalInfo.bio || '') : '';

  // Hide any previous errors
  hidePersonalInfoFormError();

  // Update save button state
  updatePersonalInfoSaveButton();

  showModal(elements.personalInfoModal);

  const personalInfoFields = [
    elements.piName,
    elements.piTitle,
    elements.piEmail,
    elements.piPhone,
    elements.piLinkedin,
    elements.piGithub,
    elements.piWebsite,
    elements.piLocation,
    elements.piBio
  ];
  const fieldToFocus = personalInfoFields.find(input => input && !input.value.trim()) || elements.piName;

  setTimeout(() => {
    if (fieldToFocus) {
      fieldToFocus.focus({ preventScroll: true });
      const len = fieldToFocus.value.length;
      fieldToFocus.setSelectionRange(len, len);
    }
  }, 100);
}

function closePersonalInfoModal() {
  hideModal(elements.personalInfoModal);
  hidePersonalInfoFormError();
}

function showPersonalInfoFormError(message) {
  elements.personalInfoFormError.textContent = message;
  elements.personalInfoFormError.classList.add('show');
}

function hidePersonalInfoFormError() {
  elements.personalInfoFormError.textContent = '';
  elements.personalInfoFormError.classList.remove('show');
}

function savePersonalInfoForm() {
  hidePersonalInfoFormError();

  // Validate required fields
  const name = elements.piName.value.trim();

  if (!name) {
    showPersonalInfoFormError('Full Name is required');
    return;
  }

  // Build personalInfo object - only include non-empty fields
  const personalInfo = { name };
  const existingPersonalInfo = state.resumeData?.personalInfo || {};

  const title = elements.piTitle.value.trim();
  if (title) personalInfo.title = title;

  // Only add optional fields if they have values
  const email = elements.piEmail.value.trim();
  if (email) personalInfo.email = email;

  const phone = elements.piPhone.value.trim();
  if (phone) personalInfo.phone = phone;

  const website = normalizeUrlValue(elements.piWebsite.value.trim());
  if (website) personalInfo.website = website;

  const linkedinSlug = elements.piLinkedin.value.trim();
  if (linkedinSlug) {
    // Prepend linkedin.com/in/ if user only entered slug
    const linkedin = linkedinSlug.includes('://') || linkedinSlug.startsWith('linkedin.com')
      ? normalizeUrlValue(linkedinSlug)
      : normalizeUrlValue(`linkedin.com/in/${linkedinSlug}`);
    personalInfo.linkedin = linkedin;
  }

  const githubSlug = elements.piGithub.value.trim();
  if (githubSlug) {
    // Prepend github.com/ if user only entered slug
    const github = githubSlug.includes('://') || githubSlug.startsWith('github.com')
      ? normalizeUrlValue(githubSlug)
      : normalizeUrlValue(`github.com/${githubSlug}`);
    personalInfo.github = github;
  }

  const location = elements.piLocation.value.trim();
  if (location) personalInfo.location = location;

  const bio = elements.piBio.value.trim();
  const hadPersonalBio = Object.prototype.hasOwnProperty.call(existingPersonalInfo, 'bio');
  if (bio) {
    personalInfo.bio = bio;
  } else if (hadPersonalBio) {
    personalInfo.bio = null;
  }

  // Update state
  state.resumeData.personalInfo = personalInfo;

  // Update hidden JSON editor
  elements.jsonEditor.value = JSON.stringify(state.resumeData, null, 2);
  state.jsonModified = true;
  updateButtonStates();

  // Close modal
  closePersonalInfoModal();

  // Update UI and preview
  updateSectionManagementUI();
  flashPreviewStatus('Personal information updated successfully', 'status-success');
  autoGeneratePreview('section-edit');

  // Save to localStorage
  saveStateToLocalStorage();
}

// Simple email validation
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Ensure URLs have a protocol so links remain valid
function normalizeUrlValue(url) {
  if (!url) return '';
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(url)) {
    return url;
  }
  return `https://${url}`;
}

// GDPR Clause Modal Functions
function openGdprModal() {
  const clause = state.resumeData?.gdprClause || '';
  elements.gdprTextarea.value = clause;

  hideGdprFormError();

  showModal(elements.gdprModal);

  setTimeout(() => {
    elements.gdprTextarea.focus();
    elements.gdprTextarea.setSelectionRange(0, 0);
  }, 100);
}

function closeGdprModal() {
  hideModal(elements.gdprModal);
  hideGdprFormError();
}

function showGdprFormError(message) {
  elements.gdprFormError.textContent = message;
  elements.gdprFormError.classList.add('show');
}

function hideGdprFormError() {
  elements.gdprFormError.textContent = '';
  elements.gdprFormError.classList.remove('show');
}

function saveGdprForm() {
  hideGdprFormError();

  const clause = elements.gdprTextarea.value.trim();

  // GDPR clause is optional; keep the key with empty string if cleared
  state.resumeData.gdprClause = clause || '';

  // Clear any previous JSON error flags for this section
  state.sectionErrors.gdprClause = false;

  elements.jsonEditor.value = JSON.stringify(state.resumeData, null, 2);
  state.jsonModified = true;
  updateButtonStates();

  closeGdprModal();

  updateSectionManagementUI();
  flashPreviewStatus('GDPR clause updated successfully', 'status-success');
  autoGeneratePreview('section-edit');

  // Save to localStorage
  saveStateToLocalStorage();
}

// ============================================================================
// Date Input Formatting (YYYY-MM with separate inputs)
// ============================================================================

/**
 * Allow only digits in date part inputs
 */
function restrictToDigits(input) {
  input.addEventListener('keydown', function(e) {
    // Allow: backspace, delete, tab, escape, enter, arrows, home, end
    if ([8, 9, 27, 13, 46, 37, 38, 39, 40, 36, 35].indexOf(e.keyCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.ctrlKey && [65, 67, 86, 88].indexOf(e.keyCode) !== -1)) {
      return;
    }
    // Ensure it's a number
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) &&
        (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  });

  input.addEventListener('input', function() {
    // Remove non-digits
    this.value = this.value.replace(/\D/g, '');
  });

  // Auto-pad month inputs (1-9 becomes 01-09)
  if (input.classList.contains('date-part-month')) {
    input.addEventListener('blur', function() {
      if (this.value.length === 1 && parseInt(this.value) >= 1 && parseInt(this.value) <= 9) {
        this.value = '0' + this.value;
      }
    });
  }
}

/**
 * Setup checkbox to toggle date inputs (for "still studying/working")
 */
function setupDateNullableCheckbox(checkboxId, yearInputId, monthInputId) {
  const checkbox = document.getElementById(checkboxId);
  const yearInput = document.getElementById(yearInputId);
  const monthInput = document.getElementById(monthInputId);

  if (!checkbox || !yearInput || !monthInput) return;

  const saveCurrentValues = () => {
    checkbox.dataset.savedYear = yearInput.value;
    checkbox.dataset.savedMonth = monthInput.value;
  };

  yearInput.addEventListener('input', () => {
    if (!checkbox.checked) {
      saveCurrentValues();
    }
  });

  monthInput.addEventListener('input', () => {
    if (!checkbox.checked) {
      saveCurrentValues();
    }
  });

  checkbox.addEventListener('change', function() {
    if (this.checked) {
      // Preserve current values before clearing
      saveCurrentValues();
      yearInput.disabled = true;
      monthInput.disabled = true;
      yearInput.value = '';
      monthInput.value = '';
    } else {
      yearInput.disabled = false;
      monthInput.disabled = false;
      yearInput.value = checkbox.dataset.savedYear || '';
      monthInput.value = checkbox.dataset.savedMonth || '';
    }
  });

  saveCurrentValues();
}

function captureNullableDateSnapshot(checkboxId, yearInputId, monthInputId) {
  const checkbox = document.getElementById(checkboxId);
  const yearInput = document.getElementById(yearInputId);
  const monthInput = document.getElementById(monthInputId);
  if (!checkbox || !yearInput || !monthInput) return;
  checkbox.dataset.savedYear = yearInput.value;
  checkbox.dataset.savedMonth = monthInput.value;
}

/**
 * Combine year and month inputs into YYYY-MM format
 * Returns null if checkbox is checked or both inputs are empty
 */
function getCombinedDate(yearInputId, monthInputId, checkboxId) {
  const checkbox = checkboxId ? document.getElementById(checkboxId) : null;

  // If checkbox exists and is checked, return null
  if (checkbox && checkbox.checked) {
    return null;
  }

  const yearInput = document.getElementById(yearInputId);
  const monthInput = document.getElementById(monthInputId);
  const year = yearInput.value.trim();
  const month = monthInput.value.trim();

  // Both must be filled or both empty
  if (!year && !month) {
    return null;
  }

  if (year && month) {
    return `${year}-${month}`;
  }

  // One is filled but not the other - validation will catch this
  return `${year}-${month}`;
}

/**
 * Split YYYY-MM date into separate year and month inputs
 */
function setSplitDate(dateStr, yearInputId, monthInputId, checkboxId) {
  const yearInput = document.getElementById(yearInputId);
  const monthInput = document.getElementById(monthInputId);
  const checkbox = checkboxId ? document.getElementById(checkboxId) : null;

  if (!dateStr || dateStr === null || dateStr === 'null') {
    // Null date - check the checkbox if it exists
    yearInput.value = '';
    monthInput.value = '';
    if (checkbox) {
      checkbox.checked = true;
      yearInput.disabled = true;
      monthInput.disabled = true;
    }
    return;
  }

  // Parse YYYY-MM format
  const parts = dateStr.split('-');
  if (parts.length === 2) {
    yearInput.value = parts[0];
    monthInput.value = parts[1];
    if (checkbox) {
      checkbox.checked = false;
      yearInput.disabled = false;
      monthInput.disabled = false;
    }
  }
}

/**
 * Validate year input (4 digits, 1950-current year)
 */
function validateYear(value) {
  if (!value) return true; // Empty is okay
  if (value.length !== 4) return false;
  const year = parseInt(value);
  const currentYear = new Date().getFullYear();
  return year >= 1950 && year <= currentYear + 1;
}

/**
 * Validate month input (2 digits, 01-12)
 */
function validateMonth(value) {
  if (!value) return true; // Empty is okay
  if (value.length !== 2) return false;
  const month = parseInt(value);
  return month >= 1 && month <= 12;
}

/**
 * Get specific error message for invalid date inputs
 */
function getDateErrorMessage(formId) {
  const form = document.getElementById(formId);
  if (!form) return '';

  const yearInputs = form.querySelectorAll('.date-part-year');
  const monthInputs = form.querySelectorAll('.date-part-month');
  const currentYear = new Date().getFullYear();
  const errors = [];

  // Check all year inputs
  for (const input of yearInputs) {
    if (input.value && !validateYear(input.value)) {
      errors.push(`Year must be between 1950 and ${currentYear + 1}`);
      break;
    }
  }

  // Check all month inputs
  for (const input of monthInputs) {
    if (input.value && !validateMonth(input.value)) {
      errors.push('Month must be between 01 and 12');
      break;
    }
  }

  // Check chronological order for Education (only if dates are valid)
  if (formId === 'educationForm' && errors.length === 0) {
    const startYear = document.getElementById('edStartDateYear').value.trim();
    const startMonth = document.getElementById('edStartDateMonth').value.trim();
    const gradYear = document.getElementById('edGraduationDateYear').value.trim();
    const gradMonth = document.getElementById('edGraduationDateMonth').value.trim();

    if (startYear && startMonth && gradYear && gradMonth) {
      // Verify all date parts are valid before comparing
      if (validateYear(startYear) && validateMonth(startMonth) &&
          validateYear(gradYear) && validateMonth(gradMonth)) {
        const startDate = `${startYear}-${startMonth}`;
        const gradDate = `${gradYear}-${gradMonth}`;
        if (startDate > gradDate) {
          errors.push('Graduation date cannot be before start date');
        }
      }
    }
  }

  // Check chronological order for Experience (only if dates are valid)
  if (formId === 'experienceForm' && errors.length === 0) {
    const startYear = document.getElementById('expStartDateYear').value.trim();
    const startMonth = document.getElementById('expStartDateMonth').value.trim();
    const endYear = document.getElementById('expEndDateYear').value.trim();
    const endMonth = document.getElementById('expEndDateMonth').value.trim();

    if (startYear && startMonth && endYear && endMonth) {
      // Verify all date parts are valid before comparing
      if (validateYear(startYear) && validateMonth(startMonth) &&
          validateYear(endYear) && validateMonth(endMonth)) {
        const startDate = `${startYear}-${startMonth}`;
        const endDate = `${endYear}-${endMonth}`;
        if (startDate > endDate) {
          errors.push('End date cannot be before start date');
        }
      }
    }
  }

  return errors.length > 0 ? errors.join('. ') : '';
}

/**
 * Check if any date inputs in a form are invalid
 */
function hasInvalidDateInputs(formId) {
  return getDateErrorMessage(formId) !== '';
}

/**
 * Check if Education form is valid (all required fields filled, dates complete)
 */
function isEducationFormValid() {
  const degree = document.getElementById('edDegree').value.trim();
  const level = document.getElementById('edLevel').value.trim();
  const institution = document.getElementById('edInstitution').value.trim();
  const startYear = document.getElementById('edStartDateYear').value.trim();
  const startMonth = document.getElementById('edStartDateMonth').value.trim();
  const gradYear = document.getElementById('edGraduationDateYear').value.trim();
  const gradMonth = document.getElementById('edGraduationDateMonth').value.trim();
  const stillStudying = document.getElementById('edStillStudying').checked;

  // Check required fields
  if (!degree || !level || !institution || !startYear || !startMonth) {
    return false;
  }

  // Check graduation date
  if (!stillStudying) {
    // If not still studying, BOTH year and month are REQUIRED
    if (!gradYear || !gradMonth) {
      return false;
    }
  } else {
    // If still studying is checked, date should be empty
    if (gradYear || gradMonth) {
      return false;
    }
  }

  return true;
}

/**
 * Check if Experience form is valid (all required fields filled, dates complete)
 */
function isExperienceFormValid() {
  const position = document.getElementById('expPosition').value.trim();
  const company = document.getElementById('expCompany').value.trim();
  const startYear = document.getElementById('expStartDateYear').value.trim();
  const startMonth = document.getElementById('expStartDateMonth').value.trim();
  const endYear = document.getElementById('expEndDateYear').value.trim();
  const endMonth = document.getElementById('expEndDateMonth').value.trim();
  const stillWorking = document.getElementById('expStillWorking').checked;

  // Check required fields
  if (!position || !company || !startYear || !startMonth) {
    return false;
  }

  // Check end date
  if (!stillWorking) {
    // If not still working, BOTH year and month are REQUIRED
    if (!endYear || !endMonth) {
      return false;
    }
  } else {
    // If still working is checked, date should be empty
    if (endYear || endMonth) {
      return false;
    }
  }

  return true;
}

/**
 * Update save button state based on form validity (called on every input)
 */
function updateSaveButtonState(formId, saveButtonId) {
  const saveButton = document.getElementById(saveButtonId);
  if (!saveButton) return;

  const errorMessage = getDateErrorMessage(formId);
  let isFormValid = true;

  if (formId === 'educationForm') {
    isFormValid = isEducationFormValid();
  } else if (formId === 'experienceForm') {
    isFormValid = isExperienceFormValid();
  }

  // Disable save button if there are date errors OR form is invalid
  saveButton.disabled = errorMessage !== '' || !isFormValid;
}

/**
 * Update date validation warning visibility (called only on blur)
 */
function updateDateWarning(formId, warningId) {
  const warning = document.getElementById(warningId);
  if (!warning) return;

  const errorMessage = getDateErrorMessage(formId);

  if (errorMessage) {
    // Update warning text with specific error
    const iconHtml = '<i class="fas fa-exclamation-triangle"></i> ';
    warning.innerHTML = iconHtml + errorMessage;
    warning.classList.add('show');
  } else {
    warning.classList.remove('show');
  }
}

/**
 * Setup validation for all form inputs
 */
function setupDateValidation(formId, warningId, saveButtonId) {
  const form = document.getElementById(formId);
  if (!form) return;

  // Show warning only on blur for date inputs
  const dateInputs = form.querySelectorAll('.date-part-year, .date-part-month');
  dateInputs.forEach(input => {
    input.addEventListener('blur', () => {
      // Show/hide warning on blur
      updateDateWarning(formId, warningId);
      // Update save button state
      updateSaveButtonState(formId, saveButtonId);
    });

    // Update save button while typing (but don't show warning)
    input.addEventListener('input', () => {
      updateSaveButtonState(formId, saveButtonId);

      // Clear warning if it's showing and dates become valid
      const warning = document.getElementById(warningId);
      if (warning && warning.classList.contains('show')) {
        if (!hasInvalidDateInputs(formId)) {
          warning.classList.remove('show');
        }
      }
    });
  });

  // Update save button state on all required field inputs
  const allInputs = form.querySelectorAll('input[required], select[required], input[type="text"]');
  allInputs.forEach(input => {
    input.addEventListener('input', () => {
      updateSaveButtonState(formId, saveButtonId);
    });
    input.addEventListener('blur', () => {
      updateSaveButtonState(formId, saveButtonId);
    });
  });

  // Update on checkbox change
  const checkboxes = form.querySelectorAll('.date-nullable-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      updateSaveButtonState(formId, saveButtonId);
    });
  });
}

// Initialize all date part inputs to only accept digits
document.querySelectorAll('.date-part-year, .date-part-month').forEach(input => {
  restrictToDigits(input);
});

// Setup checkboxes for nullable dates
setupDateNullableCheckbox('edStillStudying', 'edGraduationDateYear', 'edGraduationDateMonth');
setupDateNullableCheckbox('expStillWorking', 'expEndDateYear', 'expEndDateMonth');

// Setup instant date validation
setupDateValidation('educationForm', 'educationDateWarning', 'saveEducationFormBtn');
setupDateValidation('experienceForm', 'experienceDateWarning', 'saveExperienceFormBtn');

// Personal Info validation - update save button on name input
if (elements.piName) {
  elements.piName.addEventListener('input', updatePersonalInfoSaveButton);
}

// Project form validation - update save button on required field input
if (elements.projectName && elements.projectDescription) {
  elements.projectName.addEventListener('input', updateProjectSaveButton);
  elements.projectDescription.addEventListener('input', updateProjectSaveButton);
}

// Skill form validation - update save button on group name input
if (elements.skillCategoryName) {
  elements.skillCategoryName.addEventListener('input', () => {
    updateSkillSaveButton();
    refreshSkillFormTitle();
  });
}

if (elements.edDegree) {
  elements.edDegree.addEventListener('input', refreshEducationFormTitle);
}

if (elements.expPosition) {
  elements.expPosition.addEventListener('input', refreshExperienceFormTitle);
}

if (elements.projectName) {
  elements.projectName.addEventListener('input', refreshProjectFormTitle);
}
