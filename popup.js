// Chrome Profile Locker - Popup Script

// DOM Elements
const lockStatusEl = document.getElementById('lock-status');
const statusTextEl = document.getElementById('status-text');
const lockBtn = document.getElementById('lock-btn');
const settingsBtn = document.getElementById('settings-btn');
const setupWarning = document.getElementById('setup-warning');
const setupPinBtn = document.getElementById('setup-pin-btn');
const lockOnRestartToggle = document.getElementById('lock-on-restart-toggle');

// Initialize popup
async function init() {
  await updateLockStatus();
  await checkPinSetup();
  await loadLockOnRestart();
}

// Update lock status display
async function updateLockStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'checkLockState' });
    const isLocked = response?.isLocked ?? true;

    if (isLocked) {
      lockStatusEl.classList.add('locked');
      statusTextEl.textContent = 'Browser is locked';
      lockBtn.querySelector('span').textContent = 'Unlock';
      lockBtn.classList.remove('primary');
      lockBtn.classList.add('secondary');
    } else {
      lockStatusEl.classList.remove('locked');
      statusTextEl.textContent = 'Browser is unlocked';
      lockBtn.querySelector('span').textContent = 'Lock Now';
      lockBtn.classList.add('primary');
      lockBtn.classList.remove('secondary');
    }
  } catch (e) {
    console.error('Error checking lock status:', e);
    statusTextEl.textContent = 'Status unavailable';
  }
}

// Check if PIN is set up
async function checkPinSetup() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'isPinSet' });
    const isPinSet = response?.isPinSet ?? false;

    if (!isPinSet) {
      setupWarning.classList.add('visible');
    } else {
      setupWarning.classList.remove('visible');
    }
  } catch (e) {
    console.error('Error checking PIN setup:', e);
  }
}

// Handle lock/unlock button click
async function handleLockClick() {
  lockBtn.disabled = true;
  lockBtn.querySelector('span').textContent = 'Processing...';

  try {
    const response = await chrome.runtime.sendMessage({ action: 'checkLockState' });
    const isLocked = response?.isLocked ?? true;

    if (isLocked) {
      // Currently locked - we can't unlock from popup (need to enter PIN)
      // Instead, we'll inform the user
      alert('To unlock, please enter your PIN or password on any webpage.');
    } else {
      // Currently unlocked - lock the browser
      await chrome.runtime.sendMessage({ action: 'lock' });
      statusTextEl.textContent = 'Browser locked!';
    }

    await updateLockStatus();
  } catch (e) {
    console.error('Error toggling lock:', e);
    alert('An error occurred. Please try again.');
  } finally {
    lockBtn.disabled = false;
    // Update button text based on new state
    const response = await chrome.runtime.sendMessage({ action: 'checkLockState' });
    const isLocked = response?.isLocked ?? true;
    lockBtn.querySelector('span').textContent = isLocked ? 'Unlock' : 'Lock Now';
  }
}

// Open settings
function openSettings() {
  chrome.runtime.openOptionsPage();
}

// Load lock on restart setting
async function loadLockOnRestart() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
    const settings = response?.settings || {};
    lockOnRestartToggle.checked = settings.isLocked !== false;
  } catch (e) {
    console.error('Error loading lock on restart setting:', e);
  }
}

// Handle lock on restart toggle
async function handleLockOnRestartToggle() {
  const shouldLock = lockOnRestartToggle.checked;
  
  try {
    if (shouldLock) {
      await chrome.runtime.sendMessage({ action: 'lock' });
    } else {
      await chrome.runtime.sendMessage({ action: 'unlock' });
    }
    await updateLockStatus();
  } catch (e) {
    console.error('Error toggling lock on restart:', e);
  }
}

// Event Listeners
lockBtn.addEventListener('click', handleLockClick);
settingsBtn.addEventListener('click', openSettings);
setupPinBtn.addEventListener('click', openSettings);
lockOnRestartToggle.addEventListener('change', handleLockOnRestartToggle);

// Initialize on load
document.addEventListener('DOMContentLoaded', init);