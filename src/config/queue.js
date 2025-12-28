// Re-export PDF configuration from main config
// This file exists for backward compatibility
const config = require('./config');

module.exports = {
  queue: {
    ...config.pdf.queue,
    cluster: config.pdf.cluster
  }
};
