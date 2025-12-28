const fs = require('fs');
const path = require('path');

const COLORS_DIR = __dirname;

function listColorFiles() {
  return fs
    .readdirSync(COLORS_DIR)
    .filter(file => file.endsWith('.js') && file !== 'index.js');
}

function normalizePalette(palette, colorName) {
  if (!palette || !palette.primary || !palette.accent) {
    throw new Error(`Color "${colorName}" is missing required primary/accent values`);
  }

  return {
    primary: palette.primary,
    accent: palette.accent,
    light: palette.light || palette.accent
  };
}

function loadColorFile(fileName) {
  const colorModule = require(path.join(COLORS_DIR, fileName));
  const fileBaseName = path.basename(fileName, '.js');
  const name = colorModule.name || fileBaseName;
  const palette = normalizePalette(colorModule.palette || colorModule, name);

  const aliases = Array.from(new Set([fileBaseName, name, ...(colorModule.aliases || [])]));

  return { name, palette, aliases };
}

function getAllColors() {
  return listColorFiles().map(loadColorFile).map(color => color.name);
}

function getAllColorDetails() {
  return listColorFiles().map(loadColorFile).map(color => ({
    name: color.name,
    palette: color.palette
  }));
}

function resolveColor(colorName) {
  const colorFiles = listColorFiles();

  if (colorFiles.length === 0) {
    throw new Error('No color schemes found in src/colors');
  }

  const allColors = colorFiles.map(loadColorFile);
  if (!colorName) {
    throw new Error(`Color must be provided. Available colors: ${allColors.map(c => c.name).join(', ')}`);
  }

  const requested = allColors.find(color => color.aliases.includes(colorName));
  if (!requested) {
    throw new Error(`Color "${colorName}" not found. Available colors: ${allColors.map(c => c.name).join(', ')}`);
  }

  return { ...requested, availableColors: allColors.map(color => color.name) };
}

module.exports = {
  getAllColors,
  getAllColorDetails,
  resolveColor
};
