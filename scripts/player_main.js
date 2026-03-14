/**
 * TrueAudio - Player Main Script (Main World)
 * 
 * This script runs in the page's main world context and has direct access to:
 * - window.movie_player (YouTube's internal video player API)
 * - YouTube's SPA navigation events
 * 
 * Core Responsibilities:
 * - Listen for YouTube SPA navigation (yt-navigate-finish)
 * - Access movie_player.getAvailableAudioTracks() and setAudioTrack()
 * - Match user's preferred language with available tracks
 * - Handle race conditions and edge cases
 * - Display visual feedback (toast notification)
 * 
 * Security: No chrome.* APIs available here. Communication via CustomEvent only.
 */

(function() {
  'use strict';

  // Configuration
  let userConfig = {
    schemaVersion: 1,
    preferences: {
      language: { primary: 'original', fallback: ['en'] },
      ui: { showToast: true },
      core: { enabled: true, analyticsEnabled: false }
    }
  };

  const CONFIG_EVENT = 'trueaudio-config';
  const MAX_RETRY_ATTEMPTS = 20;
  const RETRY_DELAY = 500;
  const FORCE_CHECK_INTERVAL = 1500;
  const FORCE_CHECK_DURATION = 15000;
  
  // Dicionários Globais de Idioma Extraídos
  // Maps language codes to display names in the format: "English (NativeName)"
  // Used to normalize track names regardless of user's YouTube UI language
  const LANGUAGE_DISPLAY_NAMES = {
    'af':  'Afrikaans',
    'am':  'Amharic (አማርኛ)',
    'ar':  'Arabic (العربية)',
    'az':  'Azerbaijani (Azərbaycanca)',
    'be':  'Belarusian (Беларуская)',
    'bg':  'Bulgarian (Български)',
    'bn':  'Bengali (বাংলা)',
    'bs':  'Bosnian (Bosanski)',
    'ca':  'Catalan (Català)',
    'cs':  'Czech (Čeština)',
    'cy':  'Welsh (Cymraeg)',
    'da':  'Danish (Dansk)',
    'de':  'German (Deutsch)',
    'el':  'Greek (Ελληνικά)',
    'en':  'English',
    'es':  'Spanish (Español)',
    'et':  'Estonian (Eesti)',
    'eu':  'Basque (Euskara)',
    'fa':  'Persian (فارسی)',
    'fi':  'Finnish (Suomi)',
    'fil': 'Filipino',
    'fr':  'French (Français)',
    'ga':  'Irish (Gaeilge)',
    'gl':  'Galician (Galego)',
    'gu':  'Gujarati (ગુજરાતી)',
    'he':  'Hebrew (עברית)',
    'hi':  'Hindi (हिन्दी)',
    'hr':  'Croatian (Hrvatski)',
    'hu':  'Hungarian (Magyar)',
    'hy':  'Armenian (Հայերեն)',
    'id':  'Indonesian (Bahasa Indonesia)',
    'is':  'Icelandic (Íslenska)',
    'it':  'Italian (Italiano)',
    'ja':  'Japanese (日本語)',
    'ka':  'Georgian (ქართული)',
    'kk':  'Kazakh (Қазақша)',
    'km':  'Khmer (ខ្មែរ)',
    'kn':  'Kannada (ಕನ್ನಡ)',
    'ko':  'Korean (한국어)',
    'lt':  'Lithuanian (Lietuvių)',
    'lv':  'Latvian (Latviešu)',
    'mk':  'Macedonian (Македонски)',
    'ml':  'Malayalam (മലയാളം)',
    'mn':  'Mongolian (Монгол)',
    'mr':  'Marathi (मराठी)',
    'ms':  'Malay (Bahasa Melayu)',
    'my':  'Burmese (မြန်မာဘာသာ)',
    'ne':  'Nepali (नेपाली)',
    'nl':  'Dutch (Nederlands)',
    'no':  'Norwegian (Norsk)',
    'pa':  'Punjabi (ਪੰਜਾਬੀ)',
    'pl':  'Polish (Polski)',
    'pt':  'Portuguese (Português)',
    'ro':  'Romanian (Română)',
    'ru':  'Russian (Русский)',
    'si':  'Sinhala (සිංහල)',
    'sk':  'Slovak (Slovenčina)',
    'sl':  'Slovenian (Slovenščina)',
    'sq':  'Albanian (Shqip)',
    'sr':  'Serbian (Српски)',
    'sv':  'Swedish (Svenska)',
    'sw':  'Swahili (Kiswahili)',
    'ta':  'Tamil (தமிழ்)',
    'te':  'Telugu (తెలుగు)',
    'th':  'Thai (ภาษาไทย)',
    'tr':  'Turkish (Türkçe)',
    'uk':  'Ukrainian (Українська)',
    'ur':  'Urdu (اردو)',
    'uz':  'Uzbek (O\'zbek)',
    'vi':  'Vietnamese (Tiếng Việt)',
    'zh':  'Chinese (中文)',
    'zu':  'Zulu (isiZulu)',
  };

  const LANGUAGE_CODE_MAP = {
    'en': ['en', 'en-us', 'en-gb', 'en-au'],
    'pt': ['pt', 'pt-br', 'pt-pt'],
    'es': ['es', 'es-es', 'es-mx', 'es-419'],
    'de': ['de', 'de-de'],
    'fr': ['fr', 'fr-fr', 'fr-ca'],
    'it': ['it', 'it-it'],
    'ja': ['ja', 'ja-jp'],
    'ko': ['ko', 'ko-kr'],
    'zh': ['zh', 'zh-cn', 'zh-hans', 'zh-tw', 'zh-hant'],
    'ru': ['ru', 'ru-ru'],
    'hi': ['hi', 'hi-in'],
    'ar': ['ar', 'ar-sa'],
    'tr': ['tr', 'tr-tr'],
    'bn': ['bn', 'bn-bd', 'bn-in']
  };

  const LANGUAGE_NAME_MAP = {
    'en': ['english', 'inglês', 'ingles', 'англи́йский'],
    'pt': ['português', 'portugues', 'portuguese'],
    'es': ['español', 'espanhol', 'spanish'],
    'de': ['deutsch', 'alemão', 'alemao', 'german'],
    'fr': ['français', 'frances', 'francês', 'french'],
    'it': ['italiano', 'italian'],
    'ja': ['日本語', 'japonês', 'japones', 'japanese'],
    'ko': ['한국어', 'coreano', 'korean'],
    'zh': ['中文', '简体中文', '繁體中文', 'chinês', 'chines', 'chinese'],
    'ru': ['русский', 'russo', 'russian'],
    'hi': ['हिन्दी', 'hindi'],
    'ar': ['العربية', 'árabe', 'arabe', 'arabic'],
    'tr': ['türkçe', 'turco', 'turkish'],
    'bn': ['বাংলা', 'bengali']
  };

  let lastVideoId = null;
  let forceCheckTimer = null;

  console.log('[TrueAudio Main] Script starting...');

  /**
   * Listen for configuration from content_bridge.js
   * Authenticates event payload against injected nonce
   */
  function listenForConfig() {
    const scriptTag = document.getElementById('trueaudio-main-script');
    const EXPECTED_NONCE = scriptTag ? scriptTag.dataset.nonce : null;

    document.addEventListener(CONFIG_EVENT, (event) => {
      const payload = event.detail;
      
      if (!EXPECTED_NONCE || !payload || payload.token !== EXPECTED_NONCE) {
        console.warn('[TrueAudio Main] Unauthorized config event intercepted. Ignored.');
        return;
      }

      userConfig = payload.config;
      console.log('[TrueAudio Main] Config received:', userConfig);
      
      if (isVideoPage() && userConfig.preferences.core.enabled) {
        attemptAudioSwitch();
      }
    });
  }

  /**
   * Check if current page is a YouTube video page
   */
  function isVideoPage() {
    return window.location.pathname === '/watch' && window.location.search.includes('v=');
  }

  /**
   * Get current video ID from URL
   */
  function getCurrentVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
  }

  /**
   * Get the YouTube movie_player object
   */
  function getPlayer() {
    const player = window.movie_player || document.getElementById('movie_player');
    
    if (player) {
      console.log('[TrueAudio Debug] Player found:', {
        hasGetAudioTrack: typeof player.getAudioTrack === 'function',
        hasSetAudioTrack: typeof player.setAudioTrack === 'function',
        hasGetAvailableAudioTracks: typeof player.getAvailableAudioTracks === 'function'
      });
    }
    
    return player;
  }

  /**
   * Wait for the player to be ready with retry logic
   */
  function waitForPlayer(attempt = 1) {
    return new Promise((resolve, reject) => {
      const player = getPlayer();
      
      const hasAudioMethods = player && (
        typeof player.getAvailableAudioTracks === 'function' ||
        typeof player.getAudioTrack === 'function'
      );
      
      if (hasAudioMethods) {
        console.log('[TrueAudio Debug] Player ready on attempt', attempt);
        resolve(player);
        return;
      }

      if (attempt >= MAX_RETRY_ATTEMPTS) {
        console.error('[TrueAudio Debug] Player NOT ready after', attempt, 'attempts');
        reject(new Error('Player not ready after maximum attempts'));
        return;
      }

      console.log('[TrueAudio Debug] Waiting for player... attempt', attempt);
      setTimeout(() => {
        waitForPlayer(attempt + 1).then(resolve).catch(reject);
      }, RETRY_DELAY);
    });
  }

  /**
   * Analytics Service Stub 
   */
  function logAnalytics(eventName, payload) {
    if (!userConfig.preferences.core.analyticsEnabled) return;

    const data = {
      event: eventName,
      timestamp: new Date().toISOString(),
      payload: payload
    };

    console.log('[TrueAudio Analytics] 📊 Event Registered:', data);
    // Future Note: Add fetch() call here to your backend service endpoint
  }

  /**
   * Extracts track metadata regardless of minification property names
   * Safely scans object properties identifying Google's track schema.
   */
  function extractTrackMetadata(track) {
    if (!track) return null;
    
    // Some structures keep it directly
    if (track.id && track.name) {
       return track;
    }

    // Iterate properties looking for the deep object
    for (const key of Object.keys(track)) {
      const val = track[key];
      // Google puts audio track id as strings matching format: "hash.langCode.priority" or just lang code
      if (val && typeof val === 'object' && val.name && val.id !== undefined) {
         return val; // Returns the full object equivalent to the old track.xD
      }
    }
    
    return null; // Metadata not found
  }

  /**
   * Get available audio tracks from the player
   */
  function getAvailableAudioTracks(player) {
    try {
      const tracks = player.getAvailableAudioTracks();
      const cleanTracks = [];
      
      if (tracks && tracks.length > 0) {
        console.log('[TrueAudio Debug] Found', tracks.length, 'audio tracks:');
        tracks.forEach((track, index) => {
          const meta = extractTrackMetadata(track) || {};
          console.log('  Track ' + index + ':', {
            trackId: track.id,
            langId: meta.id,
            langName: meta.name,
            isDefault: meta.isDefault,
            isAutoDubbed: meta.isAutoDubbed
          });

          // Pushing valid tracks to broadcast later
          // NOTE: Do NOT skip tracks whose name contains "original" — YouTube labels the
          // source language (e.g. English) as "English (original)" and we must include it.
          // Only skip tracks that have no parseable language code (pure no-language markers).
          if (meta && meta.id) {
            const code = extractLangCode(meta.id);
            if (code) {
              const displayName = LANGUAGE_DISPLAY_NAMES[code] || meta.name;
              // Avoid duplicates (same language code appearing twice)
              if (!cleanTracks.some(t => t.code === code)) {
                cleanTracks.push({ code, name: displayName });
              }
            }
          }
        });

        // Broadcast alive tracks back to Bridge/Extension
        if (cleanTracks.length > 0) {
           const event = new CustomEvent('trueaudio-tracks-update', {
             detail: { tracks: cleanTracks }
           });
           document.dispatchEvent(event);
        }
      }
      
      return tracks || [];
    } catch (error) {
      console.error('[TrueAudio Debug] Error getting audio tracks:', error);
      return [];
    }
  }

  /**
   * Get the current audio track
   */
  function getCurrentAudioTrack(player) {
    try {
      const track = player.getAudioTrack();
      const meta = extractTrackMetadata(track);
      if (meta) {
        console.log('[TrueAudio Debug] Current track:', meta.name, '(' + meta.id + ')');
      }
      return track;
    } catch (error) {
      console.error('[TrueAudio Debug] Error getting current track:', error);
      return null;
    }
  }

  /**
   * Extract language code from track.id (e.g., "en.1" -> "en", "pt-BR.2" -> "pt-BR")
   */
  function extractLangCode(xdId) {
    if (!xdId) return null;
    const parts = xdId.split('.');
    return parts.length > 0 ? parts[0].toLowerCase() : null;
  }

  /**
   * Find the original/default audio track
   * Note: YouTube's isDefault is based on user's region, NOT the video's original language
   * So we need smarter heuristics
   */
  function findOriginalTrack(tracks) {
    if (!tracks || tracks.length === 0) return null;

    console.log('[TrueAudio Debug] Searching for original track...');

    // Strategy 1: Look for track with "original" in the name (any language)
    const originalNamedTrack = tracks.find(track => {
      const meta = extractTrackMetadata(track);
      return meta && meta.name && meta.name.toLowerCase().includes('original');
    });
    if (originalNamedTrack) {
      console.log('[TrueAudio Debug] Found track with "original" in name:', extractTrackMetadata(originalNamedTrack).name);
      return originalNamedTrack;
    }

    // Strategy 2: For tech content, English is usually the original
    // Look for English track (most YouTube tech content is in English)
    const englishTrack = tracks.find(track => {
      const meta = extractTrackMetadata(track);
      if (!meta) return false;
      const langCode = extractLangCode(meta.id);
      return langCode === 'en' || langCode === 'en-us' || langCode === 'en-gb';
    });
    if (englishTrack) {
      console.log('[TrueAudio Debug] Found English track as likely original:', extractTrackMetadata(englishTrack).name);
      return englishTrack;
    }

    // Strategy 3: Return the first track in the list (often the original)
    console.log('[TrueAudio Debug] Using first track as fallback:', extractTrackMetadata(tracks[0])?.name);
    return tracks[0];
  }

  /**
   * Find track matching the user's preferred language
   * Uses EXACT matching for language codes to avoid "en" matching "Bengali"
   */
  function findTrackByLanguage(tracks, languageCode) {
    if (!tracks || tracks.length === 0) return null;

    console.log('[TrueAudio Debug] Searching for language:', languageCode);

    if (languageCode === 'original') {
      return findOriginalTrack(tracks);
    }

    // Normalize the search term
    const searchLower = languageCode.toLowerCase();

    // Find which language group we're searching for
    let targetCodes = LANGUAGE_CODE_MAP[searchLower] || [searchLower];
    let targetNames = LANGUAGE_NAME_MAP[searchLower] || [];

    console.log('[TrueAudio Debug] Looking for codes:', targetCodes, 'or names:', targetNames);

    // First: Try EXACT match on language code from metadata property
    for (const track of tracks) {
      const meta = extractTrackMetadata(track);
      if (!meta) continue;
      const langCode = extractLangCode(meta.id);
      
      if (targetCodes.includes(langCode)) {
        console.log('[TrueAudio Debug] Found EXACT code match:', meta.name, '(' + meta.id + ')');
        return track;
      }
    }

    // Second: Try matching string against known language names
    for (const track of tracks) {
      const meta = extractTrackMetadata(track);
      if (!meta || !meta.name) continue;
      const trackNameLower = meta.name.toLowerCase();
      
      for (const targetName of targetNames) {
        // Use exact match or starts with, NOT includes
        if (trackNameLower === targetName || trackNameLower.startsWith(targetName)) {
          console.log('[TrueAudio Debug] Found name match:', meta.name, '(' + meta.id + ')');
          return track;
        }
      }
    }

    console.log('[TrueAudio Debug] No match found for:', languageCode);
    console.log('[TrueAudio Debug] Available tracks:', tracks.map(t => extractTrackMetadata(t)?.name + ' (' + extractLangCode(extractTrackMetadata(t)?.id) + ')').join(', '));
    return null;
  }

  /**
   * Switch audio track on the player
   */
  function switchAudioTrack(player, track, silent = false) {
    try {
      const meta = extractTrackMetadata(track);
      
      if (!silent) {
        console.log('[TrueAudio Debug] Attempting to switch to:', meta?.name || 'unknown');
      }

      // YouTube expects the track object itself to be passed to setAudioTrack
      const possibleValues = [
        track,
        track.id,
        meta?.id
      ].filter(v => v !== undefined && v !== null);

      for (const value of possibleValues) {
        try {
          if (!silent) {
            console.log('[TrueAudio Debug] Trying setAudioTrack with:', typeof value === 'object' ? 'track object' : value);
          }
          player.setAudioTrack(value);
          
          if (!silent) {
            console.log('[TrueAudio Main] Audio track switched to:', meta?.name || 'unknown');
            logAnalytics('AudioSwitched', {
              fromLanguage: extractTrackMetadata(getCurrentAudioTrack(player))?.id,
              toLanguage: meta?.id,
              videoId: getCurrentVideoId()
            });
          }
          return true;
        } catch (e) {
          if (!silent) {
            console.log('[TrueAudio Debug] setAudioTrack failed:', e.message);
          }
        }
      }

      return false;
    } catch (error) {
      if (!silent) {
        console.error('[TrueAudio Debug] Error switching audio track:', error);
      }
      return false;
    }
  }

  /**
   * Display a toast notification to the user
   */
  function showToast(message, type) {
    type = type || 'success';
    
    const existingToast = document.getElementById('trueaudio-toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.id = 'trueaudio-toast';
    toast.textContent = message;

    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: type === 'success' ? 'rgba(0, 200, 83, 0.95)' : 'rgba(220, 53, 69, 0.95)',
      color: '#ffffff',
      padding: '12px 24px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      fontFamily: 'Roboto, Arial, sans-serif',
      zIndex: '10000',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      pointerEvents: 'none',
      maxWidth: '400px',
      textAlign: 'center'
    });
    
    // Acessibilidade A11y
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');

    document.body.appendChild(toast);

    setTimeout(function() {
      if (toast && toast.parentNode) {
        toast.remove();
      }
    }, 3000);
  }

  /**
   * Monitor audio track and force it to stay on preferred language
   */
  function monitorAndForceAudioTrack(player, preferredTrack) {
    const preferredTrackId = preferredTrack.id;
    const videoId = getCurrentVideoId();
    const startTime = performance.now();
    let lastCheckTime = startTime;

    if (forceCheckTimer) {
      cancelAnimationFrame(forceCheckTimer);
    }

    console.log('[TrueAudio Main] Starting aggressive monitoring for', FORCE_CHECK_DURATION / 1000, 'seconds');

    function checkLoop(currentTime) {
      if (getCurrentVideoId() !== videoId || (currentTime - startTime) >= FORCE_CHECK_DURATION) {
        forceCheckTimer = null;
        console.log('[TrueAudio Main] Monitoring stopped');
        return;
      }

      if (currentTime - lastCheckTime >= FORCE_CHECK_INTERVAL) {
        lastCheckTime = currentTime;
        try {
          const currentTrack = getCurrentAudioTrack(player);
          const currentTrackId = currentTrack ? currentTrack.id : null;

          if (currentTrackId !== preferredTrackId) {
            console.log('[TrueAudio Main] YouTube changed audio! Forcing back to preferred track...');
            switchAudioTrack(player, preferredTrack, true);
          }
        } catch (error) {
          // Silent fail during monitoring
        }
      }

      forceCheckTimer = requestAnimationFrame(checkLoop);
    }

    forceCheckTimer = requestAnimationFrame(checkLoop);
  }

  /**
   * Main function to attempt audio track switching
   */
  function attemptAudioSwitch(showNotification) {
    if (showNotification === undefined) showNotification = true;
    
    if (!userConfig.preferences.core.enabled) {
      console.log('[TrueAudio Main] Extension is disabled');
      return;
    }

    if (!isVideoPage()) {
      console.log('[TrueAudio Main] Not on a video page');
      return;
    }

    const currentVideoId = getCurrentVideoId();
    const isNewVideo = lastVideoId !== currentVideoId;
    lastVideoId = currentVideoId;

    console.log('[TrueAudio Main] Attempting to switch audio track...', isNewVideo ? '(NEW VIDEO)' : '(RETRY)');

    waitForPlayer().then(function(player) {
      console.log('[TrueAudio Main] Player is ready');

      const availableTracks = getAvailableAudioTracks(player);
      
      if (availableTracks.length === 0) {
        console.log('[TrueAudio Main] No audio tracks available (single track video)');
        return;
      }

      if (availableTracks.length === 1) {
        console.log('[TrueAudio Main] Only one audio track available, no switching needed');
        return;
      }

      const currentTrack = getCurrentAudioTrack(player);

      const preferredTrack = findTrackByLanguage(availableTracks, userConfig.preferences.language.primary);
      
      if (!preferredTrack) {
        console.warn('[TrueAudio Main] Preferred track not found:', userConfig.preferences.language.primary);
        console.log('[TrueAudio Debug] Available languages:', availableTracks.map(t => extractTrackMetadata(t)?.name + ' (' + extractTrackMetadata(t)?.id + ')').join(', '));
        if (userConfig.preferences.ui.showToast && showNotification) {
          showToast('⚠️ ' + userConfig.preferences.language.primary + ' track not available', 'error');
        }
        return;
      }

      const currentTrackId = currentTrack ? currentTrack.id : null;
      const preferredTrackId = preferredTrack.id;

      if (currentTrackId === preferredTrackId) {
        console.log('[TrueAudio Main] Already on preferred track');
        
        if (isNewVideo) {
          monitorAndForceAudioTrack(player, preferredTrack);
        }
        return;
      }

      const success = switchAudioTrack(player, preferredTrack);

      if (success) {
        const trackName = extractTrackMetadata(preferredTrack)?.name || userConfig.preferences.language.primary;
        
        if (userConfig.preferences.ui.showToast && showNotification) {
          showToast('🎧 Audio switched to ' + trackName);
        }

        monitorAndForceAudioTrack(player, preferredTrack);
      }

    }).catch(function(error) {
      console.error('[TrueAudio Main] Error during audio switch:', error);
      if (userConfig.preferences.ui.showToast && showNotification) {
        showToast('❌ Failed to switch audio track', 'error');
      }
    });
  }

  /**
   * Setup navigation listener for YouTube SPA
   */
  function setupNavigationListener() {
    document.addEventListener('yt-navigate-finish', function() {
      console.log('[TrueAudio Main] YouTube navigation detected');
      
      if (forceCheckTimer) {
        cancelAnimationFrame(forceCheckTimer);
        forceCheckTimer = null;
      }

      var delays = [100, 500, 1000, 2000, 3000, 5000];
      
      for (var i = 0; i < delays.length; i++) {
        (function(index, delay) {
          setTimeout(function() {
            attemptAudioSwitch(index === 0);
          }, delay);
        })(i, delays[i]);
      }
    });

    console.log('[TrueAudio Main] Navigation listener setup complete');
  }

  /**
   * Initialize the main script
   */
  function initialize() {
    console.log('[TrueAudio Main] Main script loaded and initializing...');

    listenForConfig();
    setupNavigationListener();

    if (isVideoPage()) {
      console.log('[TrueAudio Main] Already on video page, attempting aggressive switch');
      
      var delays = [500, 1000, 1500, 2500, 4000, 6000];
      
      for (var i = 0; i < delays.length; i++) {
        (function(index, delay) {
          setTimeout(function() {
            attemptAudioSwitch(index === 0);
          }, delay);
        })(i, delays[i]);
      }
    }
  }

  // Start initialization
  initialize();

})();
