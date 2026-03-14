# 🎧 TrueAudio - YouTube Audio Language Controller

A production-ready Chrome Extension that automatically forces YouTube videos to play in your preferred audio language. Say goodbye to forced AI dubbing on technical tutorials!

## 🎯 Problem Statement

YouTube recently enabled "AI Dubbing" by default, which ruins the experience for developers watching technical tutorials in English. The player forces a translated audio track, making it difficult to follow along. **TrueAudio** solves this by automatically switching to your preferred audio language.

## ✨ Features

- **Automatic Audio Switching**: Instantly switches to your preferred language when a video loads
- **Smart Original Track Detection**: Intelligently identifies the original/default audio track
- **SPA-Aware**: Handles YouTube's Single Page Application navigation seamlessly
- **Visual Feedback**: Non-intrusive toast notifications confirm audio switches
- **Modern UI**: Clean, dark-mode popup interface for easy configuration
- **Performance Optimized**: Event-driven architecture, no polling or intervals
- **Secure**: Fully compliant with Manifest V3 security standards

## 🏗️ Architecture

### Two-World Design (Security First)

**Isolated World (Content Script)**
- `scripts/content_bridge.js`
- Has access to `chrome.storage` API
- Reads user preferences
- Injects main script into page
- Passes configuration via CustomEvent

**Main World (Injected Script)**
- `scripts/player_main.js`
- Direct access to `window.movie_player` (YouTube's internal API)
- Controls audio track switching
- Listens for YouTube SPA navigation events

### Event-Driven Architecture

No `setInterval` loops or polling. Uses:
- `yt-navigate-finish` event for YouTube navigation detection
- `CustomEvent` for secure cross-world communication
- Retry logic with exponential backoff for player readiness

## 📁 Project Structure

```
NoDubbing/
├── manifest.json                 # Extension configuration (MV3)
├── popup/
│   ├── popup.html               # Settings UI
│   └── popup.js                 # Settings logic & chrome.storage
├── scripts/
│   ├── content_bridge.js        # Bridge between worlds
│   └── player_main.js           # Main player control logic
├── styles/
│   └── global.css               # Dark-mode UI styles
├── icons/                       # Extension icons (16x16, 48x48, 128x128)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## 🚀 Installation

### For Development

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the `NoDubbing` folder
6. The extension is now installed!

### Creating Icons (Required)

The extension requires icon files. Create a simple icon or use these dimensions:
- 16x16 pixels for toolbar
- 48x48 pixels for extension management
- 128x128 pixels for Chrome Web Store

Save them in an `icons/` folder as `icon16.png`, `icon48.png`, and `icon128.png`.

## 🎮 Usage

1. **Click the extension icon** in your Chrome toolbar
2. **Select your preferred language** from the dropdown
   - Choose "Original" to always use the default track
   - Or select a specific language (English, Spanish, etc.)
3. **Enable/disable notifications** (toggle "Show notification")
4. **Click "Save Settings"**
5. **Navigate to YouTube** and play any video with multiple audio tracks

The extension will automatically switch the audio track based on your preference!

## 🛠️ Technical Details

### YouTube Player API Access

```javascript
const player = window.movie_player;
const tracks = player.getAvailableAudioTracks();
const currentTrack = player.getAudioTrack();
player.setAudioTrack(trackId);
```

### Language Matching Logic

1. **Exact Match**: Matches `audioTrackId` or `id` directly
2. **Original Track**: Uses heuristics (isDefault flag, "original" in name, first track)
3. **Partial Match**: Searches displayName for language code
4. **Fallback**: Shows error toast if preferred track unavailable

### Race Condition Handling

- Waits for `window.movie_player` to be defined
- Retries up to 10 times with 300ms delay
- Handles videos that load before the extension

### YouTube SPA Navigation

- Listens for `yt-navigate-finish` DOM event
- Detects video changes without page reload
- Applies audio preference on every video

## 🔒 Security & Privacy

- **No external requests**: All processing happens locally
- **No data collection**: Zero telemetry or analytics
- **Minimal permissions**: Only requires `storage` and YouTube host access
- **No unsafe-eval**: Complies with CSP (Content Security Policy)
- **Open source**: Fully transparent code

## 🐛 Troubleshooting

### Audio doesn't switch

1. Ensure the extension is **enabled** in the popup
2. Check if the video has multiple audio tracks (single-track videos can't switch)
3. Open browser console (F12) and look for `[TrueAudio]` logs
4. Try refreshing the YouTube page

### Popup doesn't open

1. Check if the extension is loaded in `chrome://extensions/`
2. Ensure all required files are present
3. Check for errors in the extension details page

### Toast notifications don't appear

1. Make sure "Show notification" is enabled in settings
2. Check if YouTube Theater/Fullscreen mode might be hiding it
3. Verify in console that the script is executing

## 🔧 Development

### Adding New Languages

Edit `popup/popup.html` and add a new option:

```html
<option value="languageCode">Language Name</option>
```

### Debugging

1. **Content Script**: Right-click page → Inspect → Console (filter: `[TrueAudio Bridge]`)
2. **Main Script**: Check page console for `[TrueAudio Main]` logs
3. **Popup**: Right-click extension icon → Inspect popup

### Building for Production

1. Remove all `console.log` statements (or use a build tool)
2. Minify JavaScript files
3. Optimize icon images
4. Update version in `manifest.json`
5. Zip the folder for Chrome Web Store submission

## 📝 License

MIT License - Feel free to use, modify, and distribute.

## 🙏 Credits

Built with attention to:
- Clean architecture
- Security best practices
- Performance optimization
- User experience

---

**Made by developers, for developers.** No more AI-dubbed tutorials! 🎉
