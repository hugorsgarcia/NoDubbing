/**
 * TrueAudio - Content Bridge Script (Isolated World)
 * 
 * This script runs in the isolated content script context and acts as a bridge between:
 * 1. Chrome Extension APIs (chrome.storage)
 * 2. The main world script (player_main.js) that accesses YouTube's internal API
 * 
 * Responsibilities:
 * - Load user preferences from chrome.storage.sync
 * - Inject player_main.js into the page's main world
 * - Pass configuration to the main world via CustomEvent
 * - Listen for configuration updates from the popup
 */

(function() {
  'use strict';

  const SCRIPT_ID = 'trueaudio-main-script';
  const CONFIG_EVENT = 'trueaudio-config';
  const INJECTED_NONCE = crypto.randomUUID();

  /**
   * Load configuration from chrome.storage.sync
   * @returns {Promise<Object>} User configuration
   */
  async function loadConfig() {
    const defaultConfig = {
      schemaVersion: 1,
      preferences: {
        language: { primary: 'original', fallback: ['en'] },
        ui: { showToast: true },
        core: { enabled: true, analyticsEnabled: false }
      }
    };

    try {
      let config = await chrome.storage.sync.get(null);
      
      if (!config.schemaVersion) {
         // Fallback legacy parse if the page loads before popup migration
         config = {
             schemaVersion: 1,
             preferences: {
                 language: { primary: config.preferredLanguage || 'original', fallback: ['en'] },
                 ui: { showToast: config.showToast ?? true },
                 core: { enabled: config.enabled ?? true, analyticsEnabled: false }
             }
         };
      }
      
      // Deep merge with defaults
      config = { ...defaultConfig, ...config };
      console.log('[TrueAudio Bridge] Configuration loaded:', config);
      return config;
    } catch (error) {
      console.error('[TrueAudio Bridge] Error loading config:', error);
      return defaultConfig;
    }
  }

  /**
   * Inject the main world script into the page
   * This script will have access to window.movie_player
   */
  function injectMainScript() {
    // Avoid duplicate injection
    if (document.getElementById(SCRIPT_ID)) {
      console.log('[TrueAudio Bridge] Main script already injected');
      return true;
    }

    try {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = chrome.runtime.getURL('scripts/player_main.js');
      script.type = 'text/javascript';
      script.dataset.nonce = INJECTED_NONCE; // Injeta Token de Validação para a Main API
      
      // Wait for script to load before continuing
      script.onload = () => {
        console.log('[TrueAudio Bridge] Main script loaded successfully');
      };
      
      script.onerror = (error) => {
        console.error('[TrueAudio Bridge] Failed to load main script:', error);
      };
      
      // Inject as early as possible
      const target = document.head || document.documentElement || document.body;
      if (target) {
        target.appendChild(script);
        console.log('[TrueAudio Bridge] Main script injected into', target.tagName);
        return true;
      } else {
        console.error('[TrueAudio Bridge] No valid target for script injection');
        return false;
      }
    } catch (error) {
      console.error('[TrueAudio Bridge] Error injecting script:', error);
      return false;
    }
  }

  /**
   * Send configuration to the main world script via CustomEvent
   * @param {Object} config - User configuration
   */
  function sendConfigToMainWorld(config) {
    // Dispatch with a small delay to ensure script is ready
    setTimeout(() => {
      // Send token embedded inside detail wrapper
      const event = new CustomEvent(CONFIG_EVENT, {
        detail: {
          config: config,
          token: INJECTED_NONCE
        }
      });
      document.dispatchEvent(event);
      console.log('[TrueAudio Bridge] Config sent to main world:', config);
    }, 100);
  }

  /**
   * Listen for configuration updates from the popup
   */
  function setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'CONFIG_UPDATED') {
        console.log('[TrueAudio Bridge] Config updated from popup:', message.config);
        sendConfigToMainWorld(message.config);
        sendResponse({ success: true });
      }
    });
  }

  /**
   * Listen for available tracks broadcasted from the Main World player
   * Saves it to local storage so the popup can rebuild its languages dynamically
   */
  function setupTracksListener() {
    document.addEventListener('trueaudio-tracks-update', (event) => {
      const tracks = event.detail.tracks;
      if (tracks && tracks.length > 0) {
        chrome.storage.local.set({ dynamicTracks: tracks }, () => {
          console.log('[TrueAudio Bridge] Saved ' + tracks.length + ' dynamic tracks to local storage');
        });
      }
    });
  }

  /**
   * Initialize the bridge
   */
  async function initialize() {
    console.log('[TrueAudio Bridge] Initializing...');

    // Step 1: Inject the main world script first
    injectMainScript();

    // Step 2: Load configuration and send it to main world
    const config = await loadConfig();
    sendConfigToMainWorld(config);

    // Step 3: Setup listener for popup updates
    setupMessageListener();
    
    // Step 3.5: Setup listener for track extraction (Bottom-up)
    setupTracksListener();

    // Step 4: Listen for storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync') {
        console.log('[TrueAudio Bridge] Storage changed:', changes);
        loadConfig().then(sendConfigToMainWorld);
      }
    });

    console.log('[TrueAudio Bridge] Initialization complete');
  }

  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

})();
