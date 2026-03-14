# 🚀 Quick Setup Guide for TrueAudio

Follow these steps to get your extension running in under 5 minutes.

## Step 1: Create Icon Files (Required)

The extension needs three icon files. Choose one method:

### Option A: Use an Online Tool (Easiest)
1. Visit https://favicon.io/favicon-generator/
2. Text: "TA" or "🎧"
3. Background: Rounded, Color: #00c853
4. Download and extract
5. Rename and resize to:
   - `icon16.png` (16x16)
   - `icon48.png` (48x48)
   - `icon128.png` (128x128)
6. Place all three in the `icons/` folder

### Option B: Create Simple Placeholders with PowerShell
Run this in PowerShell from the project root:

```powershell
# Create simple colored placeholder icons (requires ImageMagick or skip this step)
# For now, we'll create a text file as a reminder
echo "Create icon16.png (16x16), icon48.png (48x48), icon128.png (128x128)" > icons/ICONS_NEEDED.txt
```

### Option C: Use Existing Images
If you have any PNG images:
1. Resize them to 16x16, 48x48, and 128x128 pixels
2. Name them `icon16.png`, `icon48.png`, `icon128.png`
3. Place in `icons/` folder

## Step 2: Load Extension in Chrome

1. Open Chrome
2. Navigate to: `chrome://extensions/`
3. **Enable "Developer mode"** (toggle in top-right)
4. Click **"Load unpacked"**
5. Select the `NoDubbing` folder
6. ✅ Extension installed!

## Step 3: Configure Your Preferences

1. Click the **TrueAudio icon** in your Chrome toolbar (puzzle piece icon if not pinned)
2. Select your preferred language:
   - **"Original"** - Always use the default audio track (recommended for English tutorials)
   - **"English"** - Force English audio
   - Or choose any other language
3. Toggle notifications if desired
4. Click **"Save Settings"**

## Step 4: Test It Out

1. Go to **YouTube.com**
2. Find a video with multiple audio tracks (look for videos with dubbing)
3. Play the video
4. You should see a green toast notification: **"🎧 Audio switched to [Language]"**

## Troubleshooting

### "Extension failed to load"
- **Cause**: Missing icon files
- **Solution**: Make sure `icon16.png`, `icon48.png`, and `icon128.png` exist in the `icons/` folder

### No toast notification appears
- Check the extension is **enabled** in settings
- Open DevTools (F12) → Console
- Look for logs starting with `[TrueAudio Main]`
- If you see "No audio tracks available", the video only has one audio track

### Audio doesn't switch
1. Verify the video has multiple audio tracks
2. Check browser console for errors
3. Try refreshing the YouTube page
4. Ensure extension is enabled in popup

## Development Tips

### View Logs
- **Content Script**: Right-click page → Inspect → Console (filter: `[TrueAudio Bridge]`)
- **Main Script**: Page console shows `[TrueAudio Main]` logs
- **Popup**: Right-click extension icon → Inspect popup

### Make Changes
1. Edit any file
2. Go to `chrome://extensions/`
3. Click the **refresh icon** on the TrueAudio extension
4. Reload YouTube page to test

## Next Steps

- Customize the popup UI colors in `styles/global.css`
- Add more languages in `popup/popup.html`
- Package for Chrome Web Store (zip the folder)

---

**Need help?** Check the full [README.md](README.md) for detailed documentation.
