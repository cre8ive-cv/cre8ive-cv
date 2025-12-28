const fs = require('fs');
const path = require('path');

const THEMES_DIR = __dirname;

function listThemeFiles() {
  return fs
    .readdirSync(THEMES_DIR)
    .filter(file => file.endsWith('.js') && file !== 'index.js');
}

function loadTheme(themeName) {
  if (!themeName) {
    throw new Error('Theme must be provided. Pass --theme <name> or use --generateAll.');
  }

  const themeFiles = listThemeFiles();

  if (themeFiles.length === 0) {
    throw new Error('No themes found in src/themes');
  }

  const requestedName = themeName;
  let requestedFile = themeFiles.find(file => path.basename(file, '.js') === requestedName);

  if (!requestedFile) {
    requestedFile = themeFiles.find(file => {
      const themeModule = require(path.join(THEMES_DIR, file));
      return themeModule.name === requestedName || (themeModule.aliases || []).includes(requestedName);
    });
  }
  if (!requestedFile) {
    throw new Error(`Theme "${requestedName}" not found. Available themes: ${themeFiles
      .map(file => path.basename(file, '.js'))
      .join(', ')}`);
  }

  const fileToLoad = requestedFile;
  const themeModule = require(path.join(THEMES_DIR, fileToLoad));

  if (typeof themeModule.getStyles !== 'function') {
    throw new Error(`Theme "${fileToLoad}" must export a getStyles function`);
  }

  return {
    name: themeModule.name || path.basename(fileToLoad, '.js'),
    monochromatic: Boolean(themeModule.monochromatic),
    getStyles: themeModule.getStyles
  };
}

function getAllThemes() {
  return listThemeFiles().map(file => path.basename(file, '.js'));
}

module.exports = {
  getAllThemes,
  loadTheme
};
