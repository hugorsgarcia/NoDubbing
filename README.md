<div align="center">
  <img src="icons/icon128.png" alt="TrueAudio Logo" width="128" />
  <h1>🎧 TrueAudio</h1>
  <p><strong>A Chrome Extension that forces YouTube videos to play in your preferred audio language.</strong></p>
</div>

---

## 🚀 What is TrueAudio?

YouTube's **AI Dubbing** feature automatically substitutes the original audio of foreign-language videos with a robotic dubbed track based on your browser's region — and makes it very difficult to turn off permanently.

**TrueAudio** fixes this. It hooks directly into YouTube's internal player API and instantly forces every video to play in the language you choose, whether that's the original content language, English, Spanish, or any of the supported languages below.

---

## ⚙️ Features

- **Automatic Audio Switching**: Forces YouTube to your preferred language on every video load.
- **Smart Original Track Detection**: Intelligently identifies the original (non-dubbed) audio track using multiple heuristics, regardless of your account's region settings.
- **Persistent Preferences**: Your language choice is saved and applied automatically — set it once and forget it.
- **Anti-Override Monitoring**: Detects and reverses YouTube's attempts to re-apply dubbing after the page loads.
- **Lightweight**: No network requests, no external scripts, no tracking. Runs entirely within YouTube's page.
- **Privacy First**: Only requires the `storage` permission. Zero data collection.

---

## 🌐 Supported Languages

| Language | Code |
|---|---|
| Original (Default Track) | — |
| English | `en` |
| Spanish | `es` |
| French | `fr` |
| German | `de` |
| Italian | `it` |
| Portuguese | `pt` |
| Japanese | `ja` |
| Korean | `ko` |
| Chinese | `zh` |
| Russian | `ru` |
| Arabic | `ar` |
| Hindi | `hi` |

---

## 🛠️ Installation

### From the Chrome Web Store *(recommended)*

1. Visit the [TrueAudio page on the Chrome Web Store](https://chrome.google.com/webstore/detail/trueaudio-youtube-audio-l/bcnghhkaekjmlpognnjphgchfjbmhnab).
2. Click **Add to Chrome**.
3. Go to YouTube, click the TrueAudio icon in your toolbar, choose your preferred language, and click **Save Settings**.

### Manual Installation (Developer Mode)

1. Download the latest release ZIP from the [Releases](https://github.com/hugorsgarcia/TrueAudio/releases) page and extract it.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** and select the extracted folder.
5. Go to YouTube, click the TrueAudio icon, and configure your language.

---

## 🔒 Privacy

TrueAudio does **not** collect, transmit, or store any personal data. It requires only the `storage` permission (to save your language preference) and access to `youtube.com` (to control the audio player). No analytics, no tracking, no external servers.

---

## 📄 License

[MIT License](LICENSE)
