const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

const DEFAULT_INPUT_PATH = path.join(PROJECT_ROOT, 'src', 'cli', 'sample_resume_config.json');
const DEFAULT_OUTPUT_DIR = path.join(PROJECT_ROOT, 'src', 'cli', 'output');

const PHOTO_SEARCH_PATHS = [
  path.join(PROJECT_ROOT, 'src', 'cli', 'sample_resume_image.png'),
  path.join(PROJECT_ROOT, 'src', 'cli', 'sample_resume_image.jpg'),
  path.join(PROJECT_ROOT, 'assets', 'sample_image.jpg'),
  path.join(PROJECT_ROOT, 'sample_image.jpg'),
  path.join(PROJECT_ROOT, 'assets', 'photo.jpg'),
  path.join(PROJECT_ROOT, 'photo.jpg')
];

module.exports = {
  DEFAULT_INPUT_PATH,
  DEFAULT_OUTPUT_DIR,
  PHOTO_SEARCH_PATHS
};
