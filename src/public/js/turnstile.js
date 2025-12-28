// Cloudflare Turnstile integration for invisible CAPTCHA protection

const TURNSTILE_SITE_KEY = '0x4AAAAAACIw3wraS0vxYa7K';
let TURNSTILE_ENABLED = false;
let turnstileWidgetId = null;
let turnstileReady = false;

// Fetch config and initialize Turnstile
async function initTurnstile() {
  // First, get the config to check if Turnstile is enabled
  try {
    const response = await fetch('/api/config');
    const config = await response.json();

    TURNSTILE_ENABLED = config.turnstile?.enabled || false;

    if (!TURNSTILE_ENABLED) {
      console.log('[Turnstile] Disabled in config');
      turnstileReady = true; // Mark as ready so we don't block requests
      return;
    }
  } catch (error) {
    console.error('[Turnstile] Failed to fetch config:', error);
    return;
  }

  if (typeof turnstile === 'undefined') {
    console.warn('Turnstile script not loaded yet, retrying...');
    setTimeout(initTurnstile, 100);
    return;
  }

  try {
    // Create invisible container if it doesn't exist
    let container = document.getElementById('turnstile-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'turnstile-container';
      container.style.display = 'none'; // Invisible
      document.body.appendChild(container);
    }

    // Render the invisible Turnstile widget
    turnstileWidgetId = turnstile.render('#turnstile-container', {
      sitekey: TURNSTILE_SITE_KEY,
      theme: 'light',
      size: 'invisible',
      callback: function(token) {
        console.log('Turnstile token obtained');
      },
      'error-callback': function() {
        console.error('Turnstile error');
      },
      'timeout-callback': function() {
        console.warn('Turnstile timeout');
      }
    });

    turnstileReady = true;
    console.log('Turnstile initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Turnstile:', error);
  }
}

// Get a fresh Turnstile token (call before each protected API request)
async function getTurnstileToken() {
  // If Turnstile is disabled, return a dummy token
  if (!TURNSTILE_ENABLED) {
    return 'disabled';
  }

  if (!turnstileReady) {
    throw new Error('Turnstile not ready yet');
  }

  return new Promise((resolve, reject) => {
    try {
      // Execute invisible challenge
      turnstile.execute('#turnstile-container', {
        callback: function(token) {
          resolve(token);
        },
        'error-callback': function() {
          reject(new Error('Turnstile verification failed'));
        },
        'timeout-callback': function() {
          reject(new Error('Turnstile verification timed out'));
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Reset Turnstile widget (call after each request to get a fresh token next time)
function resetTurnstile() {
  if (turnstileReady && turnstileWidgetId !== null) {
    try {
      turnstile.reset(turnstileWidgetId);
    } catch (error) {
      console.warn('Failed to reset Turnstile:', error);
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTurnstile);
} else {
  initTurnstile();
}
