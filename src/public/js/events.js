let exportJsonWidthObserver = null;
let jsonActionResizeHandlerAttached = false;
let mobileEditorActionsResizeHandlerAttached = false;
const mobileEditorActionsLayout = {
  loadExampleWrapper: null,
  loadExampleWrapperParent: null,
  loadExampleWrapperNextSibling: null,
  photoUploadWrapper: null,
  photoUploadWrapperParent: null,
  photoUploadWrapperNextSibling: null
};

// Setup event listeners
function setupEventListeners() {
  elements.loadExampleBtn.addEventListener('click', handleLoadExampleBtn);
  elements.fileInput.addEventListener('change', handleFileUpload);
  if (elements.fileInputMobile) {
    elements.fileInputMobile.addEventListener('change', handleFileUpload);
  }
  elements.photoInput.addEventListener('change', handlePhotoUpload);
  elements.photoRemoveBtn.addEventListener('click', handlePhotoRemove);
  elements.themeSelect.addEventListener('change', handleThemeChange);
  if (elements.themeDropupButton) {
    elements.themeDropupButton.addEventListener('click', toggleThemeDropup);
  }
  elements.colorSelect.addEventListener('change', handleColorChange);
  if (elements.colorDropupButton) {
    elements.colorDropupButton.addEventListener('click', toggleColorDropup);
  }
  document.addEventListener('pointerdown', handleDropupOutsideInteraction, true);
  if (elements.modeSwitcherToggle) {
    elements.modeSwitcherToggle.addEventListener('click', handleModeToggle);
  }
  if (elements.modeSwitcher) {
    elements.modeSwitcher.addEventListener('mouseenter', () => setModeMenuVisibility(true));
    elements.modeSwitcher.addEventListener('mouseleave', () => setModeMenuVisibility(false));
    elements.modeSwitcher.addEventListener('focusin', () => setModeMenuVisibility(true));
    elements.modeSwitcher.addEventListener('focusout', (event) => {
      if (event.relatedTarget && elements.modeSwitcher.contains(event.relatedTarget)) return;
      setModeMenuVisibility(false);
    });
  }
  elements.showWatermarkCheckbox.addEventListener('change', handleWatermarkChange);
  if (elements.layoutDropupButton) {
    elements.layoutDropupButton.addEventListener('click', toggleLayoutDropup);
  }
  if (elements.termsAcceptanceCheckbox) {
    elements.termsAcceptanceCheckbox.addEventListener('change', handleTermsAcceptanceChange);
  }
  elements.previewPdfBtn.addEventListener('click', showPdfPreview);
  elements.exportHtmlBtn.addEventListener('click', exportToHtml);
  elements.exportJsonBtn.addEventListener('click', exportToJson);
  elements.closePdfPreviewBtn.addEventListener('click', closePdfPreview);
  // Mobile view toggle - Segmented control
  if (elements.mobileEditorOption) {
    elements.mobileEditorOption.addEventListener('click', () => handleMobileViewToggle('editor'));
  }
  if (elements.mobilePreviewOption) {
    elements.mobilePreviewOption.addEventListener('click', () => handleMobileViewToggle('preview'));
  }

  // Sync desktop and mobile checkboxes/buttons
  if (elements.termsAcceptanceCheckboxDesktop) {
    elements.termsAcceptanceCheckboxDesktop.addEventListener('change', (e) => {
      if (elements.termsAcceptanceCheckbox) {
        elements.termsAcceptanceCheckbox.checked = e.target.checked;
        handleTermsAcceptanceChange();
      }
    });
  }
  if (elements.termsAcceptanceCheckbox) {
    elements.termsAcceptanceCheckbox.addEventListener('change', (e) => {
      if (elements.termsAcceptanceCheckboxDesktop) {
        elements.termsAcceptanceCheckboxDesktop.checked = e.target.checked;
      }
    });
  }
  if (elements.previewPdfBtnDesktop) {
    elements.previewPdfBtnDesktop.addEventListener('click', showPdfPreview);
  }
  if (elements.exportHtmlBtnDesktop) {
    elements.exportHtmlBtnDesktop.addEventListener('click', exportToHtml);
  }
  if (elements.exportJsonBtnDesktop) {
    elements.exportJsonBtnDesktop.addEventListener('click', exportToJson);
  }

  // Modal event listeners
  elements.closeModalBtn.addEventListener('click', closeEditorModal);
  elements.cancelModalBtn.addEventListener('click', closeEditorModal);
  elements.saveModalBtn.addEventListener('click', saveEditorChanges);
  elements.formatJsonBtn.addEventListener('click', formatExpandedJson);

  // Projects modal event listeners
  elements.closeProjectsModalBtn.addEventListener('click', closeProjectsManagementModal);
  elements.closeProjectsModalFooterBtn.addEventListener('click', closeProjectsManagementModal);
  elements.addProjectBtn.addEventListener('click', addNewProject);
  // Note: renameProjectsSectionBtn listener is attached dynamically when modal opens

  // Skills modal event listeners
  elements.closeSkillsModalBtn.addEventListener('click', closeSkillsManagementModal);
  elements.closeSkillsModalFooterBtn.addEventListener('click', closeSkillsManagementModal);
  elements.addSkillBtn.addEventListener('click', addNewSkill);
  if (elements.renameSkillsSectionBtn) {
    elements.renameSkillsSectionBtn.addEventListener('click', () => renameSectionPrompt('skills'));
  }

  // Skill form modal event listeners
  elements.closeSkillFormBtn.addEventListener('click', () => closeSkillFormModal());
  elements.cancelSkillFormBtn.addEventListener('click', () => closeSkillFormModal());
  elements.saveSkillFormBtn.addEventListener('click', saveSkillForm);
  elements.addSkillItemBtn.addEventListener('click', () => {
    const newInput = addSkillItemField('', true);
    updateSkillItemDeleteButtons();
    if (newInput) {
      newInput.focus({ preventScroll: true });
      newInput.setSelectionRange(newInput.value.length, newInput.value.length);
    }
  });
  if (elements.skillFraction) {
    elements.skillFraction.addEventListener('input', (e) => syncSkillFraction(Number(e.target.value)));
    elements.skillFraction.addEventListener('change', (e) => syncSkillFraction(Number(e.target.value)));
  }

  // Global drag listeners for section list to allow long moves
  if (elements.sectionList && !elements.sectionList.dataset.dragListenersAttached) {
    elements.sectionList.addEventListener('dragover', handleListDragOver);
    elements.sectionList.addEventListener('drop', handleListDrop);
    elements.sectionList.dataset.dragListenersAttached = 'true';
  }

  // Project form modal event listeners
  elements.closeProjectFormBtn.addEventListener('click', closeProjectFormModal);
  elements.cancelProjectFormBtn.addEventListener('click', closeProjectFormModal);
  elements.saveProjectFormBtn.addEventListener('click', saveProjectForm);

  // Experience modal event listeners
  elements.closeExperienceModalBtn.addEventListener('click', closeExperienceManagementModal);
  elements.closeExperienceModalFooterBtn.addEventListener('click', closeExperienceManagementModal);
  elements.addExperienceBtn.addEventListener('click', addNewExperience);
  // Note: renameExperienceSectionBtn listener is attached dynamically when modal opens

  // Experience form modal event listeners
  elements.closeExperienceFormBtn.addEventListener('click', closeExperienceFormModal);
  elements.cancelExperienceFormBtn.addEventListener('click', closeExperienceFormModal);
  elements.saveExperienceFormBtn.addEventListener('click', saveExperienceForm);
  elements.addResponsibilityBtn.addEventListener('click', () => {
    const input = addResponsibilityField();
    if (input) {
      const list = elements.responsibilitiesList;
      requestAnimationFrame(() => {
        list.scrollTop = list.scrollHeight;
        input.focus({ preventScroll: true });
        const len = input.value.length;
        input.setSelectionRange(len, len);
      });
    }
  });

  // Education modal event listeners
  elements.closeEducationModalBtn.addEventListener('click', closeEducationManagementModal);
  elements.closeEducationModalFooterBtn.addEventListener('click', closeEducationManagementModal);
  elements.addEducationBtn.addEventListener('click', addNewEducation);
  if (elements.renameEducationSectionBtn) {
    elements.renameEducationSectionBtn.addEventListener('click', () => renameSectionPrompt('education'));
  }

  // Education form modal event listeners
  elements.closeEducationFormBtn.addEventListener('click', closeEducationFormModal);
  elements.cancelEducationFormBtn.addEventListener('click', closeEducationFormModal);
  elements.saveEducationFormBtn.addEventListener('click', saveEducationForm);

  // Personal info modal event listeners
  elements.closePersonalInfoModalBtn.addEventListener('click', closePersonalInfoModal);
  elements.cancelPersonalInfoBtn.addEventListener('click', closePersonalInfoModal);
  elements.savePersonalInfoBtn.addEventListener('click', savePersonalInfoForm);

  // GDPR modal event listeners
  elements.closeGdprModalBtn.addEventListener('click', closeGdprModal);
  elements.cancelGdprBtn.addEventListener('click', closeGdprModal);
  elements.saveGdprBtn.addEventListener('click', saveGdprForm);

  // Close modal when clicking outside
  elements.jsonEditorModal.addEventListener('click', (e) => {
    if (e.target === elements.jsonEditorModal) {
      closeEditorModal();
    }
  });

  elements.projectsModal.addEventListener('click', (e) => {
    if (e.target === elements.projectsModal) {
      closeProjectsManagementModal();
    }
  });

  elements.skillsModal.addEventListener('click', (e) => {
    if (e.target === elements.skillsModal) {
      closeSkillsManagementModal();
    }
  });

  elements.skillFormModal.addEventListener('click', (e) => {
    if (e.target === elements.skillFormModal) {
      closeSkillFormModal();
    }
  });

  elements.projectFormModal.addEventListener('click', (e) => {
    if (e.target === elements.projectFormModal) {
      closeProjectFormModal();
    }
  });

  elements.experienceModal.addEventListener('click', (e) => {
    if (e.target === elements.experienceModal) {
      closeExperienceManagementModal();
    }
  });

  elements.educationModal.addEventListener('click', (e) => {
    if (e.target === elements.educationModal) {
      closeEducationManagementModal();
    }
  });

  elements.educationFormModal.addEventListener('click', (e) => {
    if (e.target === elements.educationFormModal) {
      closeEducationFormModal();
    }
  });

  // Keep experience badges positioned on scroll
  elements.experienceList.addEventListener('scroll', () => {
    // Use rAF to avoid thrashing layout
    requestAnimationFrame(renderExperienceBadges);
  });

  if (elements.educationList) {
    elements.educationList.addEventListener('scroll', () => {
      requestAnimationFrame(renderEducationBadges);
    });
  }

  window.addEventListener('resize', () => {
    updateListVerticalCentering(elements.experienceList);
    updateListVerticalCentering(elements.educationList);
  });

  elements.experienceFormModal.addEventListener('click', (e) => {
    if (e.target === elements.experienceFormModal) {
      closeExperienceFormModal();
    }
  });

  elements.personalInfoModal.addEventListener('click', (e) => {
    if (e.target === elements.personalInfoModal) {
      closePersonalInfoModal();
    }
  });

  elements.gdprModal.addEventListener('click', (e) => {
    if (e.target === elements.gdprModal) {
      closeGdprModal();
    }
  });

  // Close modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.jsonEditorModal.classList.contains('show')) {
      closeEditorModal();
    }
    if (e.key === 'Escape' && elements.projectsModal.classList.contains('show')) {
      closeProjectsManagementModal();
    }
    if (e.key === 'Escape' && elements.skillsModal.classList.contains('show')) {
      closeSkillsManagementModal();
    }
    if (e.key === 'Escape' && elements.skillFormModal.classList.contains('show')) {
      closeSkillFormModal();
    }
    if (e.key === 'Escape' && elements.projectFormModal.classList.contains('show')) {
      closeProjectFormModal();
    }
    if (e.key === 'Escape' && elements.experienceModal.classList.contains('show')) {
      closeExperienceManagementModal();
    }
    if (e.key === 'Escape' && elements.educationModal.classList.contains('show')) {
      closeEducationManagementModal();
    }
    if (e.key === 'Escape' && elements.educationFormModal.classList.contains('show')) {
      closeEducationFormModal();
    }
    if (e.key === 'Escape' && elements.experienceFormModal.classList.contains('show')) {
      closeExperienceFormModal();
    }
    if (e.key === 'Escape' && elements.personalInfoModal.classList.contains('show')) {
      closePersonalInfoModal();
    }
    if (e.key === 'Escape' && elements.gdprModal.classList.contains('show')) {
      closeGdprModal();
    }
    if (e.key === 'Escape' && elements.educationModal.classList.contains('show')) {
      closeEducationManagementModal();
    }
    if (e.key === 'Escape' && elements.educationFormModal.classList.contains('show')) {
      closeEducationFormModal();
    }
  });
}

function initializeSidebarControlWidths() {
  const exportBtn = elements.exportJsonBtn;
  if (!exportBtn || !document.querySelector('.button-group.button-row')) return;

  const applyWidth = () => {
    const width = exportBtn.getBoundingClientRect().width;
    if (!width) return;
    document.documentElement.style.setProperty('--json-action-width', `${width}px`);
  };

  applyWidth();

  if (typeof ResizeObserver !== 'undefined') {
    if (exportJsonWidthObserver) {
      exportJsonWidthObserver.disconnect();
    }
    exportJsonWidthObserver = new ResizeObserver(() => {
      requestAnimationFrame(applyWidth);
    });
    exportJsonWidthObserver.observe(exportBtn);
  } else if (!jsonActionResizeHandlerAttached) {
    window.addEventListener('resize', () => {
      requestAnimationFrame(applyWidth);
    });
    jsonActionResizeHandlerAttached = true;
  }
}

function updateMobileEditorActionsPlacement() {
  const container = elements.mobileEditorActions;
  if (!container || !elements.loadExampleBtn || !elements.photoUploadBtn) return;

  if (!mobileEditorActionsLayout.loadExampleWrapper) {
    const loadExampleWrapper = elements.loadExampleBtn.closest('.button-with-label');
    mobileEditorActionsLayout.loadExampleWrapper = loadExampleWrapper;
    mobileEditorActionsLayout.loadExampleWrapperParent = loadExampleWrapper?.parentElement || null;
    mobileEditorActionsLayout.loadExampleWrapperNextSibling = loadExampleWrapper?.nextElementSibling || null;
  }

  if (!mobileEditorActionsLayout.photoUploadWrapper) {
    const photoUploadWrapper = elements.photoUploadBtn.closest('.photo-upload-wrapper');
    mobileEditorActionsLayout.photoUploadWrapper = photoUploadWrapper;
    mobileEditorActionsLayout.photoUploadWrapperParent = photoUploadWrapper?.parentElement || null;
    mobileEditorActionsLayout.photoUploadWrapperNextSibling = photoUploadWrapper?.nextElementSibling || null;
  }

  const isMobile = window.innerWidth <= 1024;

  if (isMobile) {
    if (elements.loadExampleBtn.parentElement !== container) {
      container.appendChild(elements.loadExampleBtn);
    }
    if (mobileEditorActionsLayout.loadExampleWrapper) {
      mobileEditorActionsLayout.loadExampleWrapper.style.display = 'none';
    }
    if (mobileEditorActionsLayout.photoUploadWrapper && mobileEditorActionsLayout.photoUploadWrapper.parentElement !== container) {
      container.appendChild(mobileEditorActionsLayout.photoUploadWrapper);
    }
  } else {
    if (mobileEditorActionsLayout.loadExampleWrapper) {
      mobileEditorActionsLayout.loadExampleWrapper.style.display = '';
      if (elements.loadExampleBtn.parentElement !== mobileEditorActionsLayout.loadExampleWrapper) {
        mobileEditorActionsLayout.loadExampleWrapper.appendChild(elements.loadExampleBtn);
      }
    }
    if (
      mobileEditorActionsLayout.loadExampleWrapperParent &&
      mobileEditorActionsLayout.loadExampleWrapper &&
      mobileEditorActionsLayout.loadExampleWrapper.parentElement !== mobileEditorActionsLayout.loadExampleWrapperParent
    ) {
      mobileEditorActionsLayout.loadExampleWrapperParent.insertBefore(
        mobileEditorActionsLayout.loadExampleWrapper,
        mobileEditorActionsLayout.loadExampleWrapperNextSibling
      );
    }
    if (
      mobileEditorActionsLayout.photoUploadWrapperParent &&
      mobileEditorActionsLayout.photoUploadWrapper &&
      mobileEditorActionsLayout.photoUploadWrapper.parentElement !== mobileEditorActionsLayout.photoUploadWrapperParent
    ) {
      mobileEditorActionsLayout.photoUploadWrapperParent.insertBefore(
        mobileEditorActionsLayout.photoUploadWrapper,
        mobileEditorActionsLayout.photoUploadWrapperNextSibling
      );
    }
  }
}

function initializeMobileEditorActions() {
  updateMobileEditorActionsPlacement();
  if (!mobileEditorActionsResizeHandlerAttached) {
    window.addEventListener('resize', () => {
      requestAnimationFrame(updateMobileEditorActionsPlacement);
    });
    mobileEditorActionsResizeHandlerAttached = true;
  }
}

// Handle mobile/tablet view toggle - Segmented control
function handleMobileViewToggle(mode) {
  const body = document.body;

  if (mode === 'preview') {
    // Switch to preview mode
    body.classList.add('mobile-preview-mode');
    elements.mobileEditorOption.classList.remove('active');
    elements.mobilePreviewOption.classList.add('active');
  } else if (mode === 'editor') {
    // Switch to editor mode
    body.classList.remove('mobile-preview-mode');
    elements.mobilePreviewOption.classList.remove('active');
    elements.mobileEditorOption.classList.add('active');
  }
}
