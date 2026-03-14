# TrueAudio - Icon Generator Helper Script
# This script helps you create placeholder icons for testing

Write-Host "TrueAudio Icon Generator" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host ""

$iconsPath = Join-Path $PSScriptRoot "icons"

# Check if icons directory exists
if (-not (Test-Path $iconsPath)) {
    Write-Host "Creating icons directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $iconsPath | Out-Null
}

Write-Host "Icon files needed in the 'icons' folder:" -ForegroundColor Cyan
Write-Host "  - icon16.png (16x16 pixels)" -ForegroundColor White
Write-Host "  - icon48.png (48x48 pixels)" -ForegroundColor White
Write-Host "  - icon128.png (128x128 pixels)" -ForegroundColor White
Write-Host ""

# Check for existing icons
$icon16 = Test-Path (Join-Path $iconsPath "icon16.png")
$icon48 = Test-Path (Join-Path $iconsPath "icon48.png")
$icon128 = Test-Path (Join-Path $iconsPath "icon128.png")

if ($icon16 -and $icon48 -and $icon128) {
    Write-Host "✓ All icon files found!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You're ready to load the extension in Chrome!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Open Chrome and go to chrome://extensions/" -ForegroundColor White
    Write-Host "2. Enable 'Developer mode' (top-right toggle)" -ForegroundColor White
    Write-Host "3. Click 'Load unpacked' and select this folder" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "⚠ Missing icon files:" -ForegroundColor Yellow
    if (-not $icon16) { Write-Host "  ✗ icon16.png" -ForegroundColor Red }
    if (-not $icon48) { Write-Host "  ✗ icon48.png" -ForegroundColor Red }
    if (-not $icon128) { Write-Host "  ✗ icon128.png" -ForegroundColor Red }
    Write-Host ""
    
    Write-Host "How to create icons:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Option 1: Online Generator (Easiest)" -ForegroundColor Yellow
    Write-Host "  1. Visit: https://favicon.io/favicon-generator/" -ForegroundColor White
    Write-Host "  2. Enter text: 'TA' or use emoji: 🎧" -ForegroundColor White
    Write-Host "  3. Background: Rounded, Color: #00c853 (green)" -ForegroundColor White
    Write-Host "  4. Download and rename files" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Option 2: Use Existing Image" -ForegroundColor Yellow
    Write-Host "  1. Find any PNG image" -ForegroundColor White
    Write-Host "  2. Resize to 16x16, 48x48, 128x128 using:" -ForegroundColor White
    Write-Host "     - Paint.NET (Windows)" -ForegroundColor White
    Write-Host "     - GIMP (Free, cross-platform)" -ForegroundColor White
    Write-Host "     - Online tools like iloveimg.com/resize-image" -ForegroundColor White
    Write-Host "  3. Save as icon16.png, icon48.png, icon128.png" -ForegroundColor White
    Write-Host "  4. Place in the 'icons' folder" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Option 3: Simple Solid Color Icons" -ForegroundColor Yellow
    Write-Host "  Create simple colored squares using any image editor" -ForegroundColor White
    Write-Host "  Recommended color: #00c853 (green)" -ForegroundColor White
    Write-Host ""
    
    # Offer to open the icons folder
    Write-Host "Press 'O' to open the icons folder, or any other key to exit..." -ForegroundColor Cyan
    $key = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    if ($key.Character -eq 'o' -or $key.Character -eq 'O') {
        Start-Process explorer.exe -ArgumentList $iconsPath
    }
}

Write-Host ""
Write-Host "For more help, see SETUP.md" -ForegroundColor Gray
Write-Host ""
