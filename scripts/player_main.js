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
    preferredLanguage: 'original',
    showToast: true,
    enabled: true
  };

  const CONFIG_EVENT = 'trueaudio-config';
  const MAX_RETRY_ATTEMPTS = 20;
  const RETRY_DELAY = 500;
  const FORCE_CHECK_INTERVAL = 1500;
  const FORCE_CHECK_DURATION = 15000;
  
  let lastVideoId = null;
  let forceCheckTimer = null;

  console.log('[TrueAudio Main] Script starting...');

  /**
   * Listen for configuration from content_bridge.js
   */
  function listenForConfig() {
    document.addEventListener(CONFIG_EVENT, (event) => {
      userConfig = event.detail;
      console.log('[TrueAudio Main] Config received:', userConfig);
      
      if (isVideoPage() && userConfig.enabled) {
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
   * Get available audio tracks from the player
   */
  function getAvailableAudioTracks(player) {
    try {
      const tracks = player.getAvailableAudioTracks();
      
      if (tracks && tracks.length > 0) {
        console.log('[TrueAudio Debug] Found', tracks.length, 'audio tracks:');
        tracks.forEach((track, index) => {
          // YouTube stores audio info in track.xD object
          const xD = track.xD || {};
          console.log('  Track ' + index + ':', {
            trackId: track.id,
            langId: xD.id,
            langName: xD.name,
            isDefault: xD.isDefault,
            isAutoDubbed: xD.isAutoDubbed
          });
        });
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
      if (track && track.xD) {
        console.log('[TrueAudio Debug] Current track:', track.xD.name, '(' + track.xD.id + ')');
      }
      return track;
    } catch (error) {
      console.error('[TrueAudio Debug] Error getting current track:', error);
      return null;
    }
  }

  /**
   * Extract language code from xD.id (e.g., "en.1" -> "en", "pt-BR.2" -> "pt-BR")
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
    const originalNamedTrack = tracks.find(track => 
      track.xD && track.xD.name && track.xD.name.toLowerCase().includes('original')
    );
    if (originalNamedTrack) {
      console.log('[TrueAudio Debug] Found track with "original" in name:', originalNamedTrack.xD.name);
      return originalNamedTrack;
    }

    // Strategy 2: For tech content, English is usually the original
    // Look for English track (most YouTube tech content is in English)
    const englishTrack = tracks.find(track => {
      if (!track.xD) return false;
      const langCode = extractLangCode(track.xD.id);
      return langCode === 'en' || langCode === 'en-us' || langCode === 'en-gb';
    });
    if (englishTrack) {
      console.log('[TrueAudio Debug] Found English track as likely original:', englishTrack.xD.name);
      return englishTrack;
    }

    // Strategy 3: Return the first track in the list (often the original)
    console.log('[TrueAudio Debug] Using first track as fallback:', tracks[0]?.xD?.name);
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

    // Language code to expected xD.id prefix mapping (EXACT matches only)
    const languageCodeMap = {
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

    // Language display name patterns (for matching xD.name)
    const languageNameMap = {
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

    // Find which language group we're searching for
    let targetCodes = languageCodeMap[searchLower] || [searchLower];
    let targetNames = languageNameMap[searchLower] || [];

    console.log('[TrueAudio Debug] Looking for codes:', targetCodes, 'or names:', targetNames);

    // First: Try EXACT match on language code from xD.id
    for (const track of tracks) {
      if (!track.xD) continue;
      const langCode = extractLangCode(track.xD.id);
      
      if (targetCodes.includes(langCode)) {
        console.log('[TrueAudio Debug] Found EXACT code match:', track.xD.name, '(' + track.xD.id + ')');
        return track;
      }
    }

    // Second: Try matching xD.name against known language names
    for (const track of tracks) {
      if (!track.xD || !track.xD.name) continue;
      const trackNameLower = track.xD.name.toLowerCase();
      
      for (const targetName of targetNames) {
        // Use exact match or starts with, NOT includes
        if (trackNameLower === targetName || trackNameLower.startsWith(targetName)) {
          console.log('[TrueAudio Debug] Found name match:', track.xD.name, '(' + track.xD.id + ')');
          return track;
        }
      }
    }

    console.log('[TrueAudio Debug] No match found for:', languageCode);
    console.log('[TrueAudio Debug] Available tracks:', tracks.map(t => t.xD?.name + ' (' + extractLangCode(t.xD?.id) + ')').join(', '));
    return null;
  }

  /**
   * Switch audio track on the player
   */
  function switchAudioTrack(player, track, silent = false) {
    try {
      if (!silent) {
        console.log('[TrueAudio Debug] Attempting to switch to:', track.xD?.name || 'unknown');
      }

      // YouTube expects the track object itself to be passed to setAudioTrack
      const possibleValues = [
        track,
        track.id,
        track.xD?.id
      ].filter(v => v !== undefined && v !== null);

      for (const value of possibleValues) {
        try {
          if (!silent) {
            console.log('[TrueAudio Debug] Trying setAudioTrack with:', typeof value === 'object' ? 'track object' : value);
          }
          player.setAudioTrack(value);
          
          if (!silent) {
            console.log('[TrueAudio Main] Audio track switched to:', track.xD?.name || 'unknown');
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
    let checkCount = 0;
    const maxChecks = FORCE_CHECK_DURATION / FORCE_CHECK_INTERVAL;

    if (forceCheckTimer) {
      clearInterval(forceCheckTimer);
    }

    console.log('[TrueAudio Main] Starting aggressive monitoring for', FORCE_CHECK_DURATION / 1000, 'seconds');

    forceCheckTimer = setInterval(function() {
      checkCount++;

      if (checkCount >= maxChecks || getCurrentVideoId() !== videoId) {
        clearInterval(forceCheckTimer);
        forceCheckTimer = null;
        console.log('[TrueAudio Main] Monitoring stopped');
        return;
      }

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
    }, FORCE_CHECK_INTERVAL);
  }

  /**
   * Main function to attempt audio track switching
   */
  function attemptAudioSwitch(showNotification) {
    if (showNotification === undefined) showNotification = true;
    
    if (!userConfig.enabled) {
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

      const preferredTrack = findTrackByLanguage(availableTracks, userConfig.preferredLanguage);
      
      if (!preferredTrack) {
        console.warn('[TrueAudio Main] Preferred track not found:', userConfig.preferredLanguage);
        console.log('[TrueAudio Debug] Available languages:', availableTracks.map(t => t.xD?.name + ' (' + t.xD?.id + ')').join(', '));
        if (userConfig.showToast && showNotification) {
          showToast('⚠️ ' + userConfig.preferredLanguage + ' track not available', 'error');
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
        const trackName = preferredTrack.xD?.name || userConfig.preferredLanguage;
        
        if (userConfig.showToast && showNotification) {
          showToast('🎧 Audio switched to ' + trackName);
        }

        monitorAndForceAudioTrack(player, preferredTrack);
      }

    }).catch(function(error) {
      console.error('[TrueAudio Main] Error during audio switch:', error);
      if (userConfig.showToast && showNotification) {
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
        clearInterval(forceCheckTimer);
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
