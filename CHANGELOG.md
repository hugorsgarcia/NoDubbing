# 📋 Changelog

All notable changes to the TrueAudio extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-18

### 🎉 Initial Release

#### Added
- **Automatic Audio Track Switching**: Instantly forces YouTube videos to play in preferred language
- **Manifest V3 Compliance**: Full compliance with Chrome's latest extension standards
- **Two-World Architecture**: Secure separation between content script and main world script
- **Smart Original Track Detection**: Intelligently identifies default/original audio using multiple heuristics
- **Event-Driven Design**: Uses `yt-navigate-finish` for SPA navigation detection (no polling)
- **Visual Feedback**: Non-intrusive toast notifications with smooth animations
- **Modern Popup UI**: Clean, dark-mode interface with 13 language options
- **Configuration Persistence**: Settings saved to `chrome.storage.sync`
- **Real-Time Config Updates**: Changes apply immediately across all tabs
- **Race Condition Handling**: Retry logic with exponential backoff
- **Comprehensive Error Handling**: Graceful fallbacks for all edge cases
- **JSDoc Documentation**: Detailed comments for maintainability
- **Security First**: No unsafe-eval, no external requests, minimal permissions

#### Supported Languages
- Original (Default Track)
- English
- Spanish (Español)
- French (Français)
- German (Deutsch)
- Italian (Italiano)
- Portuguese (Português)
- Japanese (日本語)
- Korean (한국어)
- Chinese (中文)
- Russian (Русский)
- Arabic (العربية)
- Hindi (हिन्दी)

#### Technical Features
- Content Bridge Script (`content_bridge.js`)
- Player Main Script (`player_main.js`)
- CustomEvent-based communication
- YouTube Player API integration
- SPA navigation handling
- Toast notification system
- Popup settings manager

#### Documentation
- Comprehensive README with architecture details
- Quick SETUP guide for first-time users
- Detailed TESTING checklist (100+ test cases)
- Inline code documentation
- PowerShell helper script for icon validation

---

## [Unreleased]

### Planned Features for Future Releases

#### v1.1.0 (Proposed)
- [ ] Keyboard shortcuts for quick language switching
- [ ] Per-channel audio preferences
- [ ] Import/export settings
- [ ] Statistics dashboard (videos switched, languages used)
- [ ] Custom toast position options

#### v1.2.0 (Proposed)
- [ ] Whitelist/blacklist channels
- [ ] Auto-detect browser language
- [ ] Multiple language fallback chain
- [ ] Compact/mini mode for popup
- [ ] Hotkey to toggle extension on/off

#### v2.0.0 (Future Major Release)
- [ ] Support for other video platforms (Vimeo, Dailymotion)
- [ ] Advanced audio track filtering
- [ ] Cloud sync for preferences
- [ ] Browser language detection and auto-configuration
- [ ] A/B testing for feature rollout

---

## Version History

| Version | Release Date | Status | Notes |
|---------|--------------|--------|-------|
| 1.0.0   | 2026-01-18   | ✅ Stable | Initial production release |

---

## Upgrade Guide

### From No Version to v1.0.0
This is the first release. No upgrade needed.

### Breaking Changes
None in v1.0.0 (initial release)

---

## Known Issues

### v1.0.0
- **YouTube Premium Members**: Some premium-only dubbed content may have different track structures
- **Live Streams**: Audio track switching may not work on live streams (YouTube limitation)
- **Age-Restricted Videos**: Extension loads after sign-in, may miss initial video load

### Workarounds
- **Live Streams**: Refresh page after extension loads
- **Age-Restricted**: Refresh page after authentication

---

## Release Notes Template

Use this template for future releases:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New feature description

### Changed
- Changed feature description

### Deprecated
- Deprecated feature description

### Removed
- Removed feature description

### Fixed
- Bug fix description

### Security
- Security fix description
```

---

## Semantic Versioning Guide

- **MAJOR** (X.0.0): Incompatible API changes or breaking changes
- **MINOR** (x.Y.0): New functionality in a backward-compatible manner
- **PATCH** (x.y.Z): Backward-compatible bug fixes

---

## Contributing to Changelog

When contributing, please:
1. Add your changes under `[Unreleased]`
2. Use clear, descriptive language
3. Link to issue/PR numbers if applicable
4. Follow the existing format

---

**Last Updated**: January 18, 2026
**Maintainer**: TrueAudio Development Team
