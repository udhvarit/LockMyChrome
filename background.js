// Chrome Profile Locker - Background Service Worker
// Handles locking state, idle detection, and cross-tab communication

// Default settings
const DEFAULT_SETTINGS = {
  pin: null,                    // Will be set by user (null = not configured)
  passwordHash: null,           // SHA-256 hash of password
  salt: null,                   // Random salt for hashing
  timeoutMinutes: 30,           // Default 30 minutes
  isLocked: true,               // Start locked
  lastActivity: null            // Timestamp of last activity
};

// Lock state that persists in memory
let isLocked = true;
let idleThresholdMinutes = 30;
let idleAlarmName = 'chrome-profile-locker-idle-check';

// Initialize extension on installation or update
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Chrome Profile Locker installed/updated:', details.reason);

  // Load or initialize settings
  const data = await chrome.storage.local.get('settings');
  if (!data.settings) {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
    console.log('Default settings initialized');
  }

  // Set initial lock state
  const settings = await getSettings();
  isLocked = settings.isLocked !== false;
  idleThresholdMinutes = settings.timeoutMinutes || 30;

  // Start idle detection
  setupIdleDetection();

  // If this is a new install, open the options page
  if (details.reason === 'install') {
    chrome.tabs.create({ url: 'options.html' });
  }
});

// Get settings from storage
async function getSettings() {
  const data = await chrome.storage.local.get('settings');
  return data.settings || DEFAULT_SETTINGS;
}

// Save settings to storage
async function saveSettings(settings) {
  await chrome.storage.local.set({ settings });
}

// Setup idle detection using chrome.idle
function setupIdleDetection() {
  // Clear any existing idle state change listeners
  chrome.idle.onStateChanged.removeListener(handleIdleStateChange);

  // Set the idle detection threshold
  chrome.idle.setDetectionInterval(idleThresholdMinutes * 60);

  // Listen for idle state changes
  chrome.idle.onStateChanged.addListener(handleIdleStateChange);
}

// Handle idle state changes
async function handleIdleStateChange(newState) {
  if (newState === 'idle' || newState === 'locked') {
    console.log('Idle state detected:', newState, '- locking browser');
    await lockBrowser();
  }
}

// Lock the browser
async function lockBrowser(reason = 'manual') {
  console.log('Locking browser, reason:', reason);

  // Update in-memory state
  isLocked = true;

  // Update storage
  const settings = await getSettings();
  settings.isLocked = true;
  await saveSettings(settings);

  // Notify all tabs to show lock screen
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'lock' }).catch(() => {
        // Tab might not be ready or content script not loaded
      });
    } catch (e) {
      // Ignore errors for tabs that can't receive messages
    }
  }

  // Update badge
  updateBadge(true);
}

// Unlock the browser
async function unlockBrowser() {
  console.log('Unlocking browser');

  // Update in-memory state
  isLocked = false;

  // Update storage
  const settings = await getSettings();
  settings.isLocked = false;
  settings.lastActivity = Date.now();
  await saveSettings(settings);

  // Restart idle detection with current threshold
  setupIdleDetection();

  // Notify all tabs to unlock
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'unlock' }).catch(() => {
        // Tab might not be ready
      });
    } catch (e) {
      // Ignore errors
    }
  }

  // Update badge
  updateBadge(false);
}

// Update extension badge
function updateBadge(locked) {
  const iconPath = locked
    ? {
        16: 'icons/icon16-locked.svg',
        48: 'icons/icon48-locked.svg',
      }
    : {
        16: 'icons/icon16.svg',
        48: 'icons/icon48.svg',
      };

  chrome.action.setIcon({ path: iconPath }).catch(() => {});
  chrome.action.setBadgeText({ text: locked ? '🔒' : '' }).catch(() => {});
  chrome.action.setBadgeTextColor({ color: '#FFFFFF' }).catch(() => {});
  chrome.action.setBadgeBackgroundColor({ color: '#4A90E2' }).catch(() => {});
}

// Handle messages from content scripts and popups
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message.action);

  (async () => {
    switch (message.action) {
      case 'checkLockState':
        sendResponse({ isLocked });
        break;

      case 'attemptUnlock':
        const success = await verifyCredentials(message.credentials);
        if (success) {
          await unlockBrowser();
        }
        sendResponse({ success });
        break;

      case 'lock':
        await lockBrowser('manual');
        sendResponse({ success: true });
        break;

      case 'unlock':
        await unlockBrowser();
        sendResponse({ success: true });
        break;

      case 'getSettings':
        const settings = await getSettings();
        sendResponse({ settings });
        break;

      case 'updateSettings':
        await saveSettings(message.settings);
        // Update in-memory settings
        if (message.settings.timeoutMinutes !== undefined) {
          idleThresholdMinutes = message.settings.timeoutMinutes;
          setupIdleDetection();
        }
        if (message.settings.isLocked !== undefined) {
          isLocked = message.settings.isLocked;
          updateBadge(isLocked);
        }
        sendResponse({ success: true });
        break;

      case 'setPin':
        await setPin(message.pin);
        sendResponse({ success: true });
        break;

      case 'removePin':
        await removePin();
        sendResponse({ success: true });
        break;

      case 'isPinSet':
        const settingsCheck = await getSettings();
        sendResponse({ isPinSet: !!settingsCheck.passwordHash });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  })();

  // Return true for async response
  return true;
});

// Handle tab updates (check if lock screen should be shown)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const settings = await getSettings();
    if (settings.isLocked) {
      try {
        await chrome.tabs.sendMessage(tabId, { action: 'lock' }).catch(() => {});
      } catch (e) {
        // Ignore errors
      }
    }
  }
});

// Verify credentials (PIN or password)
async function verifyCredentials(credentials) {
  const settings = await getSettings();

  if (!settings.passwordHash || !settings.salt) {
    // No PIN/password set - always unlock (for first-time setup)
    return true;
  }

  // Hash the provided input with the stored salt
  const inputHash = await hashPassword(credentials.input, settings.salt);

  // Compare hashes
  return inputHash === settings.passwordHash;
}

// Hash password with salt using Web Crypto API (SHA-256)
async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

// Set a new PIN/password
async function setPin(pin) {
  // Generate a random salt
  const salt = generateSalt();
  const passwordHash = await hashPassword(pin, salt);

  const settings = await getSettings();
  settings.pin = null; // We only store the hash now
  settings.passwordHash = passwordHash;
  settings.salt = salt;
  await saveSettings(settings);
}

// Remove PIN/password
async function removePin() {
  const settings = await getSettings();
  settings.pin = null;
  settings.passwordHash = null;
  settings.salt = null;
  settings.isLocked = false;
  await saveSettings(settings);
  isLocked = false;
  updateBadge(false);
}

// Generate a random salt
function generateSalt() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// Handle extension startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('Chrome Profile Locker starting up');
  const settings = await getSettings();
  isLocked = settings.isLocked !== false;
  idleThresholdMinutes = settings.timeoutMinutes || 30;
  setupIdleDetection();
  updateBadge(isLocked);
});

// Initialize on load
(async () => {
  const settings = await getSettings();
  isLocked = settings.isLocked !== false;
  idleThresholdMinutes = settings.timeoutMinutes || 30;
  setupIdleDetection();
  updateBadge(isLocked);
})();