// Entry point for the resume builder UI.
// Assumes supporting modules have already been loaded via script tags.

function bootstrapApp() {
  init().catch(error => {
    console.error('Failed to initialize Resume Builder:', error);
    flashPreviewStatus('Failed to initialize app', 'status-error');
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapApp);
} else {
  bootstrapApp();
}
