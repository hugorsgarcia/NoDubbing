/**
 * TrueAudio - Popup Settings Manager
 * Handles user preferences and saves them to chrome.storage.sync
 */

// DOM Elements
const languageSelect = document.getElementById('language-select');
const showToastCheckbox = document.getElementById('show-toast');
const enableExtensionCheckbox = document.getElementById('enable-extension');
const saveButton = document.getElementById('save-btn');
const statusMessage = document.getElementById('status-message');

// Default configuration
const DEFAULT_CONFIG = {
  preferredLanguage: 'original',
  showToast: true,
  enabled: true
};

/**
 * Load saved settings from chrome.storage.sync
 * Populates the UI with existing preferences
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(DEFAULT_CONFIG);
    
    languageSelect.value = result.preferredLanguage;
    showToastCheckbox.checked = result.showToast;
    enableExtensionCheckbox.checked = result.enabled;

    // Visual feedback
    if (!result.enabled) {
      document.body.classList.add('disabled-state');
    }
  } catch (error) {
    console.error('[TrueAudio] Error loading settings:', error);
    showStatus('Error loading settings', 'error');
  }
}

/**
 * Save settings to chrome.storage.sync
 * Validates input and provides user feedback
 */
async function saveSettings() {
  try {
    const config = {
      preferredLanguage: languageSelect.value,
      showToast: showToastCheckbox.checked,
      enabled: enableExtensionCheckbox.checked
    };

    await chrome.storage.sync.set(config);
    
    showStatus('✓ Settings saved successfully!', 'success');

    // Update UI state
    if (!config.enabled) {
      document.body.classList.add('disabled-state');
    } else {
      document.body.classList.remove('disabled-state');
    }

    // Notify all YouTube tabs to reload configuration
    notifyContentScripts(config);
    
  } catch (error) {
    console.error('[TrueAudio] Error saving settings:', error);
    showStatus('✗ Failed to save settings', 'error');
  }
}

/**
 * Notify all active YouTube tabs about configuration changes
 * @param {Object} config - The new configuration object
 */
async function notifyContentScripts(config) {
  try {
    const tabs = await chrome.tabs.query({ url: 'https://www.youtube.com/*' });
    
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'CONFIG_UPDATED',
        config: config
      }).catch(() => {
        // Tab might not have content script loaded yet, ignore error
      });
    }
  } catch (error) {
    console.error('[TrueAudio] Error notifying tabs:', error);
  }
}

/**
 * Display status message to user
 * @param {string} message - Message to display
 * @param {string} type - Message type ('success' | 'error')
 */
function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    statusMessage.classList.add('hidden');
  }, 3000);
}

/**
 * Get language name from language code
 * @param {string} code - Language code (e.g., 'en', 'es')
 * @returns {string} Display name
 */
function getLanguageName(code) {
  const option = languageSelect.querySelector(`option[value="${code}"]`);
  return option ? option.textContent : code;
}

// Event Listeners
saveButton.addEventListener('click', saveSettings);

// Enable/disable visual state
enableExtensionCheckbox.addEventListener('change', (e) => {
  if (e.target.checked) {
    document.body.classList.remove('disabled-state');
  } else {
    document.body.classList.add('disabled-state');
  }
});

// Save on Enter key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    saveSettings();
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', loadSettings);
