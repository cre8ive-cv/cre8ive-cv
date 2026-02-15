// Config-driven defaults with fallbacks
const CONFIG_FALLBACK_THEME = 'default';
const CONFIG_FALLBACK_COLOR = 'blue';
const DEFAULT_DISPLAY_MODE = 'dark';

// Global state
const state = {
  resumeData: null,
  photoBase64: null,
  themes: [],
  colors: [],
  colorPalettes: {},
  themeFonts: {},
  sectionOrder: [],
  selectedTheme: null,
  selectedColor: null,
  lastSelectedColor: null,
  showWatermark: true, // Whether to show the watermark
  layout: 'standard', // Resume layout: 'standard', 'compact', or 'sidebar'
  termsAccepted: false, // Whether the user accepted the terms
  currentHtml: null,
  pdfPreviewUrl: null,
  codeMirrorEditor: null,
  jsonModified: false,
  templateLoaded: false,
  enabledSections: {}, // Tracks which sections are enabled/disabled
  currentEditingSection: null, // Which section is being edited in modal
  sectionErrors: {}, // Tracks which sections have JSON errors
  customSectionNames: {}, // Tracks custom section names (e.g., "experience" -> "Work History")
  displayMode: DEFAULT_DISPLAY_MODE, // UI mode (dark/light)
  appVersion: null, // Application version from config
  previewScroll: null, // Last known scroll position for preview container + iframe
  configDefaults: {
    theme: CONFIG_FALLBACK_THEME,
    color: CONFIG_FALLBACK_COLOR,
    mode: DEFAULT_DISPLAY_MODE
  },
  configLimits: {
    maxResumeJsonBytes: 1 * 1024 * 1024,
    maxPhotoBase64Bytes: 1.5 * 1024 * 1024
  }
};

function getPreferredThemeName() {
  const name = state.configDefaults?.theme || CONFIG_FALLBACK_THEME;
  return typeof name === 'string' ? name.toLowerCase() : CONFIG_FALLBACK_THEME;
}

function getPreferredColorName() {
  const name = state.configDefaults?.color || CONFIG_FALLBACK_COLOR;
  return typeof name === 'string' ? name.toLowerCase() : CONFIG_FALLBACK_COLOR;
}

function getPreferredModeName() {
  return state.configDefaults?.mode || DEFAULT_DISPLAY_MODE;
}

// Section configuration
const ALL_SECTIONS = ['personalInfo', 'skills', 'experience', 'education', 'projects', 'gdprClause'];
const FIXED_SECTIONS = ['personalInfo', 'gdprClause']; // Cannot be reordered (fixed positions)
const REQUIRED_SECTIONS = ['personalInfo']; // Cannot be disabled
const REORDERABLE_SECTIONS = ['skills', 'experience', 'education', 'projects']; // Can be reordered
const MIN_SKILL_FRACTION = 0.5;
const MAX_SKILL_FRACTION = 5;
const SKILL_FRACTION_STEP = 0.5;
const MAX_SKILL_GROUPS = 4; // Limit skills groups shown/edited
const PERSONAL_INFO_FIELDS = ['name', 'title', 'email', 'phone', 'website', 'linkedin', 'github', 'location', 'bio'];
const TEXTUAL_SECTIONS = ['gdprClause'];
const ARRAY_SECTIONS = ['skills', 'experience', 'education', 'projects'];
const PERSONAL_INFO_DEFAULTS = PERSONAL_INFO_FIELDS.reduce((defaults, field) => {
  defaults[field] = null;
  return defaults;
}, {});
const AVAILABLE_DISPLAY_MODES = [
  { name: 'dark', label: 'Dark mode', icon: 'moon' },
  { name: 'light', label: 'Light mode', icon: 'sun' },
  { name: 'hacker', label: 'Hacker mode', icon: 'hacker' }
];

function normalizeTextSection(value) {
  if (value === undefined || value === null) {
    return '';
  }
  return value;
}

function normalizePersonalInfoForExport(personalInfo = {}) {
  const normalized = { ...PERSONAL_INFO_DEFAULTS, ...(personalInfo || {}) };

  PERSONAL_INFO_FIELDS.forEach(field => {
    if (normalized[field] === undefined || normalized[field] === null || normalized[field] === '') {
      normalized[field] = null;
    }
  });

  return normalized;
}

function ensurePersonalInfoBio(resumeData) {
  if (!resumeData || typeof resumeData !== 'object') return false;

  let changed = false;
  if (!resumeData.personalInfo || typeof resumeData.personalInfo !== 'object') {
    resumeData.personalInfo = {};
    changed = true;
  }

  const personalInfoHasBio = Object.prototype.hasOwnProperty.call(resumeData.personalInfo, 'bio');
  if (!personalInfoHasBio &&
      typeof resumeData.bio === 'string' &&
      resumeData.bio.trim()) {
    resumeData.personalInfo.bio = resumeData.bio;
    changed = true;
  }

  if (Object.prototype.hasOwnProperty.call(resumeData, 'bio')) {
    delete resumeData.bio;
    changed = true;
  }

  return changed;
}

function normalizeResumeDataForExport(baseData) {
  const resumeData = baseData && typeof baseData === 'object' ? { ...baseData } : {};

  ensurePersonalInfoBio(resumeData);
  resumeData.personalInfo = normalizePersonalInfoForExport(resumeData.personalInfo);
  if (Object.prototype.hasOwnProperty.call(resumeData, 'bio')) {
    delete resumeData.bio;
  }
  TEXTUAL_SECTIONS.forEach(sectionKey => {
    resumeData[sectionKey] = normalizeTextSection(resumeData[sectionKey]);
  });
  ARRAY_SECTIONS.forEach(sectionKey => {
    const sectionValue = resumeData[sectionKey];
    resumeData[sectionKey] = Array.isArray(sectionValue) ? sectionValue : [];
  });

  return resumeData;
}

function hasSectionContent(value) {
  if (value === undefined || value === null) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (typeof value === 'object') {
    return Object.keys(value).length > 0;
  }

  return true;
}

// DOM Elements
const elements = {
  jsonEditor: document.getElementById('jsonEditor'),
  themeSelect: document.getElementById('themeSelect'),
  themeDropup: document.getElementById('themeDropup'),
  themeDropupButton: document.getElementById('themeDropupButton'),
  themeDropupLabel: document.getElementById('themeDropupLabel'),
  themeDropupMenu: document.getElementById('themeDropupMenu'),
  colorSelect: document.getElementById('colorSelect'),
  colorDropup: document.getElementById('colorDropup'),
  colorDropupButton: document.getElementById('colorDropupButton'),
  colorDropupLabel: document.getElementById('colorDropupLabel'),
  colorDropupSwatch: document.getElementById('colorDropupSwatch'),
  colorDropupMenu: document.getElementById('colorDropupMenu'),
  colorGroup: document.getElementById('colorGroup'),
  showWatermarkCheckbox: document.getElementById('showWatermarkCheckbox'),
  showWatermarkCheckboxMobile: document.getElementById('showWatermarkCheckboxMobile'),
  layoutDropup: document.getElementById('layoutDropup'),
  layoutDropupButton: document.getElementById('layoutDropupButton'),
  layoutDropupLabel: document.getElementById('layoutDropupLabel'),
  layoutDropupMenu: document.getElementById('layoutDropupMenu'),
  termsAcceptanceCheckbox: document.getElementById('termsAcceptanceCheckbox'),
  previewPdfBtn: document.getElementById('previewPdfBtn'),
  exportHtmlBtn: document.getElementById('exportHtmlBtn'),
  exportJsonBtn: document.getElementById('exportJsonBtn'),
  loadExampleBtn: document.getElementById('loadExampleBtn'),
  pdfPreviewModal: document.getElementById('pdfPreviewModal'),
  pdfPreviewContainer: document.getElementById('pdfPreviewContainer'),
  pdfPreviewDownloadBtn: document.getElementById('downloadPdfPreviewBtn'),
  closePdfPreviewBtn: document.getElementById('closePdfPreviewBtn'),
  fileInput: document.getElementById('fileInput'),
  fileInputMobile: document.getElementById('fileInputMobile'),
  photoInput: document.getElementById('photoInput'),
  photoUploadBtn: document.getElementById('photoUploadBtn'),
  photoRemoveBtn: document.getElementById('photoRemoveBtn'),
  photoUploadLabel: document.getElementById('photoUploadLabel'),
  previewContainer: document.getElementById('previewContainer'),
  previewStatus: document.getElementById('previewStatus'),
  mobilePreviewStatus: document.getElementById('mobilePreviewStatus'),
  modeSwitcher: document.getElementById('modeSwitcher'),
  modeSwitcherToggle: document.getElementById('modeSwitcherToggle'),
  modeSwitcherIcon: document.getElementById('modeSwitcherIcon'),
  modeSwitcherMenu: document.getElementById('modeSwitcherMenu'),
  logoTitleLink: document.querySelector('.logo-title-link'),
  mobileEditorActions: document.getElementById('mobileEditorActions'),
  jsonEditorModal: document.getElementById('jsonEditorModal'),
  expandedJsonEditor: document.getElementById('expandedJsonEditor'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  cancelModalBtn: document.getElementById('cancelModalBtn'),
  saveModalBtn: document.getElementById('saveModalBtn'),
  formatJsonBtn: document.getElementById('formatJsonBtn'),
  modalSectionTitle: document.getElementById('modalSectionTitle'),
  sectionsPanel: document.getElementById('sectionsPanel'),
  sectionList: document.getElementById('sectionList'),
  projectsModal: document.getElementById('projectsModal'),
  projectsList: document.getElementById('projectsList'),
  addProjectBtn: document.getElementById('addProjectBtn'),
  closeProjectsModalBtn: document.getElementById('closeProjectsModalBtn'),
  closeProjectsModalFooterBtn: document.getElementById('closeProjectsModalFooterBtn'),
  projectFormModal: document.getElementById('projectFormModal'),
  projectFormTitle: document.getElementById('projectFormTitle'),
  projectForm: document.getElementById('projectForm'),
  projectFormError: document.getElementById('projectFormError'),
  projectName: document.getElementById('projectName'),
  projectDescription: document.getElementById('projectDescription'),
  projectTechnologies: document.getElementById('projectTechnologies'),
  projectLink: document.getElementById('projectLink'),
  closeProjectFormBtn: document.getElementById('closeProjectFormBtn'),
  cancelProjectFormBtn: document.getElementById('cancelProjectFormBtn'),
  saveProjectFormBtn: document.getElementById('saveProjectFormBtn'),
  // Skills Modal
  skillsModal: document.getElementById('skillsModal'),
  skillsList: document.getElementById('skillsList'),
  addSkillBtn: document.getElementById('addSkillBtn'),
  closeSkillsModalBtn: document.getElementById('closeSkillsModalBtn'),
  closeSkillsModalFooterBtn: document.getElementById('closeSkillsModalFooterBtn'),
  renameSkillsSectionBtn: document.getElementById('renameSkillsSectionBtn'),
  skillsLimitPill: document.getElementById('skillsLimitPill'),
  // Skill Form Modal
  skillFormModal: document.getElementById('skillFormModal'),
  skillFormTitle: document.getElementById('skillFormTitle'),
  skillForm: document.getElementById('skillForm'),
  skillFormError: document.getElementById('skillFormError'),
  skillCategoryName: document.getElementById('skillCategoryName'),
  skillFraction: document.getElementById('skillFraction'),
  skillItemsList: document.getElementById('skillItemsList'),
  skillsWeightsPanel: document.getElementById('skillsWeightsPanel'),
  addSkillItemBtn: document.getElementById('addSkillItemBtn'),
  closeSkillFormBtn: document.getElementById('closeSkillFormBtn'),
  cancelSkillFormBtn: document.getElementById('cancelSkillFormBtn'),
  saveSkillFormBtn: document.getElementById('saveSkillFormBtn'),
  experienceModal: document.getElementById('experienceModal'),
  experienceListContainer: document.getElementById('experienceList')?.closest('.experience-list-container'),
  experienceList: document.getElementById('experienceList'),
  addExperienceBtn: document.getElementById('addExperienceBtn'),
  closeExperienceModalBtn: document.getElementById('closeExperienceModalBtn'),
  closeExperienceModalFooterBtn: document.getElementById('closeExperienceModalFooterBtn'),
  experienceFormModal: document.getElementById('experienceFormModal'),
  experienceFormTitle: document.getElementById('experienceFormTitle'),
  experienceForm: document.getElementById('experienceForm'),
  experienceFormError: document.getElementById('experienceFormError'),
  expPosition: document.getElementById('expPosition'),
  expCompany: document.getElementById('expCompany'),
  expStartDate: document.getElementById('expStartDate'),
  expEndDate: document.getElementById('expEndDate'),
  responsibilitiesList: document.getElementById('responsibilitiesList'),
  addResponsibilityBtn: document.getElementById('addResponsibilityBtn'),
  closeExperienceFormBtn: document.getElementById('closeExperienceFormBtn'),
  cancelExperienceFormBtn: document.getElementById('cancelExperienceFormBtn'),
  saveExperienceFormBtn: document.getElementById('saveExperienceFormBtn'),
  // Education Modal
  educationModal: document.getElementById('educationModal'),
  educationListContainer: document.getElementById('educationList')?.closest('.experience-list-container'),
  educationList: document.getElementById('educationList'),
  addEducationBtn: document.getElementById('addEducationBtn'),
  closeEducationModalBtn: document.getElementById('closeEducationModalBtn'),
  closeEducationModalFooterBtn: document.getElementById('closeEducationModalFooterBtn'),
  renameEducationSectionBtn: document.getElementById('renameEducationSectionBtn'),
  educationFormModal: document.getElementById('educationFormModal'),
  educationFormTitle: document.getElementById('educationFormTitle'),
  educationForm: document.getElementById('educationForm'),
  educationFormError: document.getElementById('educationFormError'),
  edDegree: document.getElementById('edDegree'),
  edLevel: document.getElementById('edLevel'),
  edInstitution: document.getElementById('edInstitution'),
  edStartDate: document.getElementById('edStartDate'),
  edGraduationDate: document.getElementById('edGraduationDate'),
  closeEducationFormBtn: document.getElementById('closeEducationFormBtn'),
  cancelEducationFormBtn: document.getElementById('cancelEducationFormBtn'),
  saveEducationFormBtn: document.getElementById('saveEducationFormBtn'),
  // Personal Info Modal
  personalInfoModal: document.getElementById('personalInfoModal'),
  personalInfoForm: document.getElementById('personalInfoForm'),
  personalInfoFormError: document.getElementById('personalInfoFormError'),
  closePersonalInfoModalBtn: document.getElementById('closePersonalInfoModalBtn'),
  cancelPersonalInfoBtn: document.getElementById('cancelPersonalInfoBtn'),
  savePersonalInfoBtn: document.getElementById('savePersonalInfoBtn'),
  piName: document.getElementById('piName'),
  piTitle: document.getElementById('piTitle'),
  piEmail: document.getElementById('piEmail'),
  piPhone: document.getElementById('piPhone'),
  piWebsite: document.getElementById('piWebsite'),
  piLinkedin: document.getElementById('piLinkedin'),
  piGithub: document.getElementById('piGithub'),
  piLocation: document.getElementById('piLocation'),
  piBio: document.getElementById('piBio'),
  // GDPR Modal
  gdprModal: document.getElementById('gdprModal'),
  gdprTextarea: document.getElementById('gdprTextarea'),
  gdprFormError: document.getElementById('gdprFormError'),
  closeGdprModalBtn: document.getElementById('closeGdprModalBtn'),
  cancelGdprBtn: document.getElementById('cancelGdprBtn'),
  saveGdprBtn: document.getElementById('saveGdprBtn'),
  // Modal section icon
  modalSectionIcon: document.getElementById('modalSectionIcon'),
  // Mobile/Tablet view toggle - Segmented control
  mobileEditorOption: document.getElementById('mobileEditorOption'),
  mobilePreviewOption: document.getElementById('mobilePreviewOption'),
  // Desktop duplicate elements (for syncing)
  termsAcceptanceCheckboxDesktop: document.getElementById('termsAcceptanceCheckboxDesktop'),
  previewPdfBtnDesktop: document.getElementById('previewPdfBtnDesktop'),
  exportHtmlBtnDesktop: document.getElementById('exportHtmlBtnDesktop'),
  exportJsonBtnDesktop: document.getElementById('exportJsonBtnDesktop')
};

// Theme font map (mirrors fonts defined in src/themes/*.js body styles)
const THEME_FONT_MAP = {
  default: `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`,
  modern: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
  cre8ive: `'Manrope', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
  classic: `'Georgia', 'Times New Roman', serif`,
  corpo: `'Arial', 'Helvetica Neue', Helvetica, sans-serif`,
  terminal: `'IBM Plex Mono', 'Fira Code', 'JetBrains Mono', 'Consolas', 'Courier New', monospace`
};
