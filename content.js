// Chrome Profile Locker - Content Script
// Injects lock screen overlay and handles lock state for each tab

let lockOverlay = null;
let isLocked = true;
let originalBodyOverflow = '';

// URLs where we should NOT inject the lock screen
const EXCLUDED_URLS = [
  'chrome://',
  'chrome-extension://',
  'edge://',
  'about:',
  'data:',
  'file://'
];

// Check if current URL should be excluded
function shouldExclude() {
  return EXCLUDED_URLS.some(url => window.location.href.startsWith(url));
}

// Initialize on page load
function init() {
  if (shouldExclude()) {
    console.log('Chrome Profile Locker: Excluded URL, skipping');
    return;
  }

  console.log('Chrome Profile Locker: Content script initialized');

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkLockState);
  } else {
    checkLockState();
  }

  // Listen for messages from background
  chrome.runtime.onMessage.addListener(handleMessage);

  // Track user activity to prevent idle lock
  trackActivity();
}

// Check current lock state from background
async function checkLockState() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'checkLockState' });
    if (response && response.isLocked) {
      showLockScreen();
    } else {
      hideLockScreen();
    }
  } catch (e) {
    console.error('Chrome Profile Locker: Error checking lock state', e);
    // If we can't communicate, show lock screen for safety
    showLockScreen();
  }
}

// Handle messages from background script
function handleMessage(message, sender, sendResponse) {
  console.log('Content script received message:', message.action);

  switch (message.action) {
    case 'lock':
      showLockScreen();
      sendResponse({ success: true });
      break;

    case 'unlock':
      hideLockScreen();
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ success: false });
  }

  return true;
}

// Show lock screen overlay
function showLockScreen() {
  if (isLocked && lockOverlay) {
    return; // Already locked
  }

  isLocked = true;

  // Prevent scrolling
  if (document.body) {
    originalBodyOverflow = document.body.style.overflow || '';
    document.body.style.overflow = 'hidden';
    document.body.style.pointerEvents = 'none';
  }

  // Create lock overlay if it doesn't exist
  if (!lockOverlay) {
    createLockOverlay();
  }

  lockOverlay.style.display = 'flex';
}

// Hide lock screen overlay
function hideLockScreen() {
  if (!isLocked) {
    return; // Already unlocked
  }

  isLocked = false;

  // Restore scrolling
  if (document.body) {
    document.body.style.overflow = originalBodyOverflow;
    document.body.style.pointerEvents = '';
  }

  if (lockOverlay) {
    lockOverlay.style.display = 'none';
  }
}

// Create the lock overlay DOM
function createLockOverlay() {
  lockOverlay = document.createElement('div');
  lockOverlay.id = 'chrome-profile-locker-overlay';
  lockOverlay.className = 'chrome-profile-locker-overlay';
  lockOverlay.style.pointerEvents = 'auto';

  lockOverlay.innerHTML = `
    <div class="lock-container">
      <div class="lock-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      </div>
      <h1 class="lock-title">Browser Locked</h1>
      <p class="lock-message">Enter your PIN or password to unlock</p>

      <div class="input-group">
        <input
          type="password"
          id="chrome-profile-locker-input"
          class="lock-input"
          placeholder="Enter PIN or password"
          maxlength="50"
          autocomplete="off"
        >
        <button id="chrome-profile-locker-show-btn" class="show-password-btn" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
      </div>

      <button id="chrome-profile-locker-submit" class="lock-button">
        <span>Unlock</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>

      <div id="chrome-profile-locker-error" class="error-message"></div>
      <div id="chrome-profile-locker-success" class="success-message"></div>
    </div>
  `;

  // Append to body
  document.documentElement.appendChild(lockOverlay);

  // Add event listeners
  setupEventListeners();
}

// Setup event listeners for the lock screen
function setupEventListeners() {
  const input = document.getElementById('chrome-profile-locker-input');
  const showBtn = document.getElementById('chrome-profile-locker-show-btn');
  const submitBtn = document.getElementById('chrome-profile-locker-submit');
  const errorEl = document.getElementById('chrome-profile-locker-error');
  const successEl = document.getElementById('chrome-profile-locker-success');

  if (!input || !submitBtn) return;

  // Handle Enter key
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      attemptUnlock();
    }
  });

  // Clear error on input
  input.addEventListener('input', () => {
    errorEl.textContent = '';
    successEl.textContent = '';
  });

  // Show/hide password toggle
  showBtn.addEventListener('click', () => {
    const type = input.type === 'password' ? 'text' : 'password';
    input.type = type;
    showBtn.classList.toggle('visible', type === 'text');
  });

  // Submit button
  submitBtn.addEventListener('click', attemptUnlock);

  // Focus input on load
  setTimeout(() => input.focus(), 100);

  // Prevent keyboard shortcuts that could bypass the lock
  document.addEventListener('keydown', preventShortcuts);
}

// Attempt to unlock with credentials
async function attemptUnlock() {
  const input = document.getElementById('chrome-profile-locker-input');
  const errorEl = document.getElementById('chrome-profile-locker-error');
  const successEl = document.getElementById('chrome-profile-locker-success');
  const submitBtn = document.getElementById('chrome-profile-locker-submit');

  if (!input) return;

  const credentials = input.value.trim();

  if (!credentials) {
    showError('Please enter your PIN or password');
    return;
  }

  // Disable button during verification
  submitBtn.disabled = true;
  submitBtn.classList.add('loading');

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'attemptUnlock',
      credentials: { input: credentials }
    });

    if (response && response.success) {
      // Show success message
      successEl.textContent = 'Unlocking...';
      input.value = '';

      // Hide lock screen after short delay
      setTimeout(() => {
        hideLockScreen();
      }, 500);
    } else {
      showError('Incorrect PIN or password');
      input.value = '';
      input.focus();
    }
  } catch (e) {
    console.error('Chrome Profile Locker: Error during unlock', e);
    showError('An error occurred. Please try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');
  }
}

// Show error message
function showError(message) {
  const errorEl = document.getElementById('chrome-profile-locker-error');
  if (errorEl) {
    errorEl.textContent = message;
    // Shake animation
    errorEl.classList.remove('shake');
    void errorEl.offsetWidth; // Trigger reflow
    errorEl.classList.add('shake');
  }
}

// Prevent keyboard shortcuts that could bypass the lock
function preventShortcuts(e) {
  if (!isLocked) return;

  // Common shortcuts to prevent
  const dangerousShortcuts = [
    { ctrl: true, key: 'w' },  // Close tab
    { ctrl: true, key: 't' },  // New tab
    { ctrl: true, key: 'l' },  // Focus address bar
    { ctrl: true, key: 'd' },  // Bookmark
    { ctrl: true, key: 'h' },  // History
    { ctrl: true, shift: true, key: 't' }, // Reopen closed tab
  ];

  for (const shortcut of dangerousShortcuts) {
    const ctrlMatch = shortcut.ctrl === (e.ctrlKey || e.metaKey);
    const shiftMatch = shortcut.shift === e.shiftKey;
    const keyMatch = shortcut.key.toLowerCase() === e.key.toLowerCase();

    if (ctrlMatch && shiftMatch && keyMatch) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  }

  // Prevent Ctrl+W specifically (close tab)
  if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
    e.preventDefault();
    e.stopPropagation();
  }
}

// Track user activity to update last activity timestamp
function trackActivity() {
  const activities = [
    'mousedown',
    'mousemove',
    'keydown',
    'scroll',
    'touchstart',
    'click'
  ];

  let lastActivityTime = Date.now();
  let activityThrottle = null;

  function updateActivity() {
    lastActivityTime = Date.now();

    if (!activityThrottle) {
      activityThrottle = setTimeout(() => {
        activityThrottle = null;
        // We could send activity to background here
        // Currently handled by chrome.idle API
      }, 5000); // Throttle to once every 5 seconds
    }
  }

  activities.forEach(event => {
    document.addEventListener(event, updateActivity, { passive: true });
  });
}

// Handle page visibility changes (SPA support)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    checkLockState();
  }
});

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}