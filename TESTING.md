# 🧪 TrueAudio Testing Checklist

Use this checklist to verify all functionality works correctly.

## Pre-Installation Tests

- [ ] All required files exist:
  - [ ] `manifest.json`
  - [ ] `popup/popup.html`
  - [ ] `popup/popup.js`
  - [ ] `scripts/content_bridge.js`
  - [ ] `scripts/player_main.js`
  - [ ] `styles/global.css`
  - [ ] `icons/icon16.png`
  - [ ] `icons/icon48.png`
  - [ ] `icons/icon128.png`

- [ ] No syntax errors in any JavaScript files
- [ ] JSON files are valid (manifest.json)

## Installation Tests

- [ ] Extension loads without errors in `chrome://extensions/`
- [ ] No permission warnings
- [ ] Extension icon appears in toolbar (may need to pin it)
- [ ] Popup opens when clicking icon

## Popup UI Tests

- [ ] Popup displays correctly (dark mode, 380px width)
- [ ] Header shows "🎧 TrueAudio" title
- [ ] Language dropdown contains all options
- [ ] Language dropdown defaults to "Original"
- [ ] "Show notification" checkbox is checked by default
- [ ] "Enable TrueAudio" checkbox is checked by default
- [ ] "Save Settings" button is visible and styled

### Popup Interactions

- [ ] Can select different languages from dropdown
- [ ] Checkboxes toggle on/off correctly
- [ ] When extension is disabled, UI dims (opacity 0.6)
- [ ] Clicking "Save Settings" shows success message
- [ ] Success message disappears after 3 seconds
- [ ] Settings persist after closing and reopening popup
- [ ] Pressing Enter key saves settings

## YouTube Integration Tests

### Initial Load

- [ ] Navigate to YouTube.com
- [ ] Open browser console (F12)
- [ ] Look for `[TrueAudio Bridge] Initializing...` log
- [ ] Look for `[TrueAudio Main] Main script loaded` log
- [ ] No JavaScript errors in console

### Single Video Page

- [ ] Open a video with multiple audio tracks (test with a dubbed video)
- [ ] Check console for `[TrueAudio Main] Attempting to switch audio track...`
- [ ] Toast notification appears (if enabled)
- [ ] Toast says "🎧 Audio switched to [Language]"
- [ ] Audio actually plays in selected language
- [ ] Toast disappears after 3 seconds with fade animation

### SPA Navigation Tests

- [ ] Play a video
- [ ] Click another video in recommendations
- [ ] Audio switches without page reload
- [ ] Console shows `[TrueAudio Main] YouTube navigation detected`
- [ ] Toast appears on each video change

### Edge Cases

- [ ] **Single audio track video**: No toast, no errors
- [ ] **No audio tracks available**: Graceful handling, no errors
- [ ] **Preferred language unavailable**: Warning toast appears
- [ ] **Already on preferred track**: No switch, no toast
- [ ] **Player not ready**: Retries with delays (check console)

## Language Preference Tests

Test with different language settings:

- [ ] **Original**: Switches to default/first audio track
- [ ] **English**: Switches to English track (if available)
- [ ] **Spanish**: Switches to Spanish track (if available)
- [ ] **Non-existent language**: Shows error toast

## Configuration Update Tests

- [ ] Change language preference in popup while on YouTube
- [ ] Save settings
- [ ] Navigate to new video
- [ ] New preference is applied

### Live Update Test

- [ ] Open YouTube video
- [ ] Open popup and change language
- [ ] Save settings
- [ ] Refresh page or navigate to new video
- [ ] New language is used

## Toast Notification Tests

- [ ] Toast appears at bottom-center of screen
- [ ] Toast has green background (`rgba(0, 200, 83, 0.95)`)
- [ ] Toast has white text
- [ ] Toast has rounded corners (8px)
- [ ] Toast slides up smoothly (animation)
- [ ] Toast auto-removes after 3 seconds
- [ ] Multiple toasts don't overlap (old one removed first)

### Toast States

- [ ] Success toast (green): Audio switched successfully
- [ ] Error toast (red): Preferred track not available

## Extension State Tests

### When Enabled

- [ ] All functionality works
- [ ] Toast notifications appear (if enabled in settings)
- [ ] Audio switches automatically

### When Disabled

- [ ] No audio switching occurs
- [ ] No toast notifications
- [ ] Console logs still appear (for debugging)
- [ ] Popup UI shows disabled state (dimmed)

### With Notifications Disabled

- [ ] Audio still switches
- [ ] No toast appears
- [ ] Console logs still work

## Performance Tests

- [ ] Extension doesn't slow down YouTube loading
- [ ] No visible lag when navigating between videos
- [ ] Memory usage is reasonable (check Task Manager)
- [ ] CPU usage is minimal (check Task Manager)

### Console Log Verification

Expected logs in order:
1. `[TrueAudio Bridge] Initializing...`
2. `[TrueAudio Bridge] Main script injected`
3. `[TrueAudio Bridge] Config sent to main world`
4. `[TrueAudio Main] Main script loaded`
5. `[TrueAudio Main] Config received`
6. `[TrueAudio Main] Navigation listener setup complete`
7. `[TrueAudio Main] Attempting to switch audio track...`
8. `[TrueAudio Main] Player is ready`
9. `[TrueAudio Main] Available audio tracks: [...]`
10. `[TrueAudio Main] Audio track switched to: [...]`

## Security Tests

- [ ] No `unsafe-eval` errors in console
- [ ] No CSP violations
- [ ] No external network requests (check Network tab)
- [ ] Extension only activates on YouTube.com
- [ ] No access to other websites

## Browser Compatibility Tests

Test in different Chrome versions (if possible):
- [ ] Chrome 120+ (latest)
- [ ] Chrome 110-119
- [ ] Chromium-based browsers (Edge, Brave) - optional

## Error Handling Tests

### Simulated Errors

- [ ] Disconnect internet while on video → Graceful handling
- [ ] Block chrome.storage → Default config used
- [ ] Navigate away before player loads → No errors
- [ ] Rapidly switch videos → No race conditions

### Console Error Check

- [ ] No `Uncaught` errors
- [ ] No `TypeError` exceptions
- [ ] No `ReferenceError` exceptions
- [ ] All errors are caught and logged properly

## Storage Tests

- [ ] Settings saved to `chrome.storage.sync`
- [ ] Settings sync across Chrome instances (if signed in)
- [ ] Settings persist after browser restart
- [ ] Invalid data doesn't crash extension

### Storage Verification

Open DevTools → Application → Storage → Extension Storage:
- [ ] `preferredLanguage` key exists
- [ ] `showToast` key exists
- [ ] `enabled` key exists
- [ ] Values match popup selections

## Documentation Tests

- [ ] README.md is clear and complete
- [ ] SETUP.md has accurate instructions
- [ ] Code comments are helpful (JSDoc)
- [ ] No broken links in documentation

## Final Verification

- [ ] Extension works on fresh Chrome profile
- [ ] Extension works after Chrome restart
- [ ] Extension works with other extensions installed
- [ ] Extension doesn't conflict with YouTube features
- [ ] Uninstalling extension removes all traces

---

## Bug Report Template

If you find a bug, document it like this:

```
**Bug Description**: [What went wrong]
**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior**: [What should happen]
**Actual Behavior**: [What actually happened]
**Console Logs**: [Copy relevant logs]
**Browser Version**: Chrome [version]
**Extension Version**: 1.0.0
```

---

## Test Results Summary

Date: _______________
Tester: _______________

- Total Tests: ____
- Passed: ____
- Failed: ____
- Blocked: ____

Critical Issues Found:
- [ ] None
- [ ] [List issues]

Ready for Production: ☐ Yes  ☐ No

Notes:
_______________________________________
_______________________________________
_______________________________________
