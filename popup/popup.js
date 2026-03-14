/**
 * TrueAudio - Popup Settings Manager
 * Handles user preferences and saves them to chrome.storage.sync
 */

// DOM Elements
const languageSelect = document.getElementById('language-select');
const showToastCheckbox = document.getElementById('show-toast');
const enableExtensionCheckbox = document.getElementById('enable-extension');
const enableAnalyticsCheckbox = document.getElementById('enable-analytics');
const saveButton = document.getElementById('save-btn');
const statusMessage = document.getElementById('status-message');

// Default configuration Schema
const DEFAULT_CONFIG = {
  schemaVersion: 1,
  preferences: {
    language: { primary: 'original', fallback: ['en'] },
    ui: { showToast: true },
    core: { enabled: true, analyticsEnabled: false }
  }
};

/**
 * Load saved settings from chrome.storage.sync
 * Transparently upgrades legacy schemas to ensure robust state management
 */
async function loadSettings() {
  try {
    const [rawSyncResult, rawLocalResult] = await Promise.all([
      chrome.storage.sync.get(null),
      chrome.storage.local.get('dynamicTracks')
    ]);

    let config = rawSyncResult;
    const dynamicTracks = rawLocalResult.dynamicTracks;

    // SCHEMA MIGRATION: Se não tem schemaVersion, é um formato legado (v0) solto na raiz
    if (!config.schemaVersion) {
        console.log('[TrueAudio] Legacy schema detected. Migrating to v1...');
        config = {
            schemaVersion: 1,
            preferences: {
                language: { primary: rawSyncResult.preferredLanguage || 'original', fallback: ['en'] },
                ui: { showToast: rawSyncResult.showToast ?? true },
                core: { enabled: rawSyncResult.enabled ?? true, analyticsEnabled: false }
            }
        };
        // Overwrite the storage with the newly structured v1 document
        await chrome.storage.sync.clear();
        await chrome.storage.sync.set(config);
    }
    
    // Deep Merge with defaults in case of missing keys
    config = { ...DEFAULT_CONFIG, ...config };

    // Dynamic UI Binding (Hydrate select from video tracks if available)
    if (dynamicTracks && dynamicTracks.length > 0) {
      console.log('[TrueAudio Popup] Rebuilding Select UI from active video tracks...', dynamicTracks);
      languageSelect.innerHTML = '<option value="original">Original (Default Track)</option>';
      
      dynamicTracks.forEach(track => {
        const option = document.createElement('option');
        option.value = track.code;
        option.textContent = track.name;
        languageSelect.appendChild(option);
      });
    }

    // Update UI binding from the strict schema paths
    // Even if the preference code (e.g. 'pl') wasn't in the static HTML, 
    // it will now match the dynamic option.
    languageSelect.value = config.preferences.language.primary;
    showToastCheckbox.checked = config.preferences.ui.showToast;
    enableExtensionCheckbox.checked = config.preferences.core.enabled;
    enableAnalyticsCheckbox.checked = config.preferences.core.analyticsEnabled;

    // Visual feedback
    if (!config.preferences.core.enabled) {
      document.body.classList.add('disabled-state');
    }
  } catch (error) {
    console.error('[TrueAudio] Error loading settings or migrating schema:', error);
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
      schemaVersion: 1,
      preferences: {
        language: { primary: languageSelect.value, fallback: ['en'] },
        ui: { showToast: showToastCheckbox.checked },
        core: { enabled: enableExtensionCheckbox.checked, analyticsEnabled: enableAnalyticsCheckbox.checked }
      }
    };

    await chrome.storage.sync.set(config);
    
    showStatus('✓ Settings saved successfully!', 'success');

    // Update UI state
    if (!config.preferences.core.enabled) {
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
