// Chrome Profile Locker - Options Page Script

// DOM Elements
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.section');

// General settings elements
const timeoutSelect = document.getElementById('timeout-select');
const lockOnRestart = document.getElementById('lock-on-restart');
const lockNowBtn = document.getElementById('lock-now-btn');

// Security elements
const pinStatusCard = document.getElementById('pin-status-card');
const pinStatusTitle = document.getElementById('pin-status-title');
const pinStatusDesc = document.getElementById('pin-status-desc');
const pinStatusIcon = document.getElementById('pin-status-icon');
const pinFormCard = document.getElementById('pin-form-card');
const changePinCard = document.getElementById('change-pin-btn')?.parentElement?.parentElement || document.getElementById('change-pin-card');
const setPinBtn = document.getElementById('set-pin-btn');
const changePinBtn = document.getElementById('change-pin-btn');
const removePinBtn = document.getElementById('remove-pin-btn');
const savePinBtn = document.getElementById('save-pin-btn');
const cancelPinBtn = document.getElementById('cancel-pin-btn');
const newPinInput = document.getElementById('new-pin');
const confirmPinInput = document.getElementById('confirm-pin');
const strengthFill = document.getElementById('strength-fill');
const strengthText = document.getElementById('strength-text');
const toggleVisibilityBtns = document.querySelectorAll('.toggle-visibility');

// Modal elements
const confirmModal = document.getElementById('confirm-modal');
const cancelRemoveBtn = document.getElementById('cancel-remove-btn');
const confirmRemoveBtn = document.getElementById('confirm-remove-btn');

// Toast element
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// State
let currentSettings = null;

// Initialize
async function init() {
  await loadSettings();
  setupEventListeners();
  updatePinStatus();
  updateStrengthMeter();
}

// Load settings from storage
async function loadSettings() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
    currentSettings = response?.settings || {};

    // Update UI
    if (currentSettings.timeoutMinutes !== undefined) {
      timeoutSelect.value = currentSettings.timeoutMinutes;
    }
    if (currentSettings.lockOnRestart !== undefined) {
      lockOnRestart.checked = currentSettings.lockOnRestart;
    } else {
      lockOnRestart.checked = true; // Default to enabled
    }
  } catch (e) {
    console.error('Error loading settings:', e);
  }
}

// Save settings to storage
async function saveSettings() {
  try {
    const settings = {
      timeoutMinutes: parseInt(timeoutSelect.value),
      lockOnRestart: lockOnRestart.checked
    };

    await chrome.runtime.sendMessage({
      action: 'updateSettings',
      settings
    });

    showToast('Settings saved successfully', 'success');
  } catch (e) {
    console.error('Error saving settings:', e);
    showToast('Failed to save settings', 'error');
  }
}

// Update PIN status display
async function updatePinStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'isPinSet' });
    const isPinSet = response?.isPinSet ?? false;

    if (isPinSet) {
      // PIN is set
      pinStatusCard.style.display = 'none';
      if (changePinCard && changePinCard.id) {
        changePinCard.style.display = 'flex';
      } else {
        // Find the change pin card by ID
        const changeCard = document.getElementById('change-pin-card');
        if (changeCard) changeCard.style.display = 'flex';
      }
    } else {
      // PIN is not set
      pinStatusCard.style.display = 'flex';
      const changeCard = document.getElementById('change-pin-card');
      if (changeCard) changeCard.style.display = 'none';
    }
  } catch (e) {
    console.error('Error checking PIN status:', e);
  }
}

// Setup event listeners
function setupEventListeners() {
  // Navigation
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const sectionId = item.dataset.section;
      switchSection(sectionId);
    });
  });

  // General settings
  timeoutSelect.addEventListener('change', saveSettings);
  lockOnRestart.addEventListener('change', saveSettings);
  lockNowBtn.addEventListener('click', lockBrowser);

  // Security - PIN buttons
  if (setPinBtn) setPinBtn.addEventListener('click', showPinForm);
  if (changePinBtn) changePinBtn.addEventListener('click', showPinForm);
  if (removePinBtn) removePinBtn.addEventListener('click', showRemoveModal);
  if (savePinBtn) savePinBtn.addEventListener('click', savePin);
  if (cancelPinBtn) cancelPinBtn.addEventListener('click', hidePinForm);

  // PIN strength meter
  if (newPinInput) {
    newPinInput.addEventListener('input', updateStrengthMeter);
  }

  // Toggle password visibility
  toggleVisibilityBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (input) {
        const type = input.type === 'password' ? 'text' : 'password';
        input.type = type;
        btn.classList.toggle('visible', type === 'text');
      }
    });
  });

  // Modal
  if (cancelRemoveBtn) cancelRemoveBtn.addEventListener('click', hideModal);
  if (confirmRemoveBtn) confirmRemoveBtn.addEventListener('click', removePin);
  if (confirmModal) {
    confirmModal.addEventListener('click', (e) => {
      if (e.target === confirmModal) hideModal();
    });
  }

  // Handle Enter key in PIN form
  if (confirmPinInput) {
    confirmPinInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') savePin();
    });
  }
}

// Switch section
function switchSection(sectionId) {
  navItems.forEach(item => {
    item.classList.toggle('active', item.dataset.section === sectionId);
  });

  sections.forEach(section => {
    section.classList.toggle('active', section.id === sectionId);
  });
}

// Lock browser
async function lockBrowser() {
  try {
    await chrome.runtime.sendMessage({ action: 'lock' });
    showToast('Browser locked', 'success');
  } catch (e) {
    console.error('Error locking browser:', e);
    showToast('Failed to lock browser', 'error');
  }
}

// Show PIN form
function showPinForm() {
  pinFormCard.style.display = 'flex';
  if (pinStatusCard) pinStatusCard.style.display = 'none';
  const changeCard = document.getElementById('change-pin-card');
  if (changeCard) changeCard.style.display = 'none';

  // Clear inputs
  newPinInput.value = '';
  confirmPinInput.value = '';
  updateStrengthMeter();

  // Focus input
  setTimeout(() => newPinInput.focus(), 100);
}

// Hide PIN form
function hidePinForm() {
  pinFormCard.style.display = 'none';
  updatePinStatus();
}

// Update strength meter
function updateStrengthMeter() {
  const value = newPinInput.value;
  const strength = calculateStrength(value);

  strengthFill.className = 'strength-fill';
  strengthText.textContent = 'Enter a PIN or password';

  if (value.length === 0) {
    strengthText.textContent = 'Enter a PIN or password';
  } else if (value.length < 4) {
    strengthFill.classList.add('weak');
    strengthText.textContent = 'Too short (min 4 characters)';
  } else if (strength < 2) {
    strengthFill.classList.add('weak');
    strengthText.textContent = 'Weak';
  } else if (strength < 4) {
    strengthFill.classList.add('medium');
    strengthText.textContent = 'Medium';
  } else {
    strengthFill.classList.add('strong');
    strengthText.textContent = 'Strong';
  }
}

// Calculate password strength (0-5)
function calculateStrength(password) {
  let strength = 0;

  if (!password) return 0;

  // Length
  if (password.length >= 6) strength += 1;
  if (password.length >= 10) strength += 1;

  // Character types
  if (/[0-9]/.test(password)) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 1;

  return Math.min(strength, 5);
}

// Save PIN
async function savePin() {
  const newPin = newPinInput.value.trim();
  const confirmPin = confirmPinInput.value.trim();

  // Validation
  if (!newPin) {
    showToast('Please enter a PIN or password', 'error');
    return;
  }

  if (newPin.length < 4) {
    showToast('PIN must be at least 4 characters', 'error');
    return;
  }

  if (newPin !== confirmPin) {
    showToast('PINs do not match', 'error');
    return;
  }

  // Save
  try {
    savePinBtn.disabled = true;
    savePinBtn.textContent = 'Saving...';

    await chrome.runtime.sendMessage({
      action: 'setPin',
      pin: newPin
    });

    showToast('PIN saved successfully', 'success');
    hidePinForm();
    updatePinStatus();
  } catch (e) {
    console.error('Error saving PIN:', e);
    showToast('Failed to save PIN', 'error');
  } finally {
    savePinBtn.disabled = false;
    savePinBtn.textContent = 'Save PIN';
  }
}

// Show remove confirmation modal
function showRemoveModal() {
  confirmModal.classList.add('show');
}

// Hide modal
function hideModal() {
  confirmModal.classList.remove('show');
}

// Remove PIN
async function removePin() {
  try {
    hideModal();

    await chrome.runtime.sendMessage({ action: 'removePin' });

    showToast('PIN removed successfully', 'success');
    updatePinStatus();
  } catch (e) {
    console.error('Error removing PIN:', e);
    showToast('Failed to remove PIN', 'error');
  }
}

// Show toast notification
function showToast(message, type = 'success') {
  toastMessage.textContent = message;
  toast.className = 'toast show ' + type;

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);