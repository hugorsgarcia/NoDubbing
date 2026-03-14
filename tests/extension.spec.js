import { test, expect } from './fixtures.js';

test.describe('TrueAudio Extension E2E', () => {
    
  test('Popup Default UI State and Persistence', async ({ context, extensionId, page }) => {
    // Navigating directly to the extension popup HTML
    await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);

    // Injetar Mock Dinâmico para renderizar 'pt' e 'hi' 
    await page.evaluate(() => {
        chrome.storage.local.set({ dynamicTracks: [
            { code: 'pt', name: 'Português' },
            { code: 'hi', name: 'Hindi' }
        ]});
    });
    
    // Forçar recarregamento do popup para absorver o Fake Local Storage
    await page.reload();

    // Verify UI Elements
    await expect(page.locator('h1')).toHaveText('🎧 TrueAudio');
    
    const langSelect = page.locator('#language-select');
    await expect(langSelect).toBeVisible();
    await expect(langSelect).toHaveValue('original');

    const toggleToast = page.locator('#show-toast');
    await expect(toggleToast).toBeChecked();

    const toggleExt = page.locator('#enable-extension');
    await expect(toggleExt).toBeChecked();

    const toggleAnalytics = page.locator('#enable-analytics');
    await expect(toggleAnalytics).not.toBeChecked(); // MUST be false by default (LGPD)

    // Interact and Save
    await langSelect.selectOption('pt');
    await toggleToast.uncheck();
    await toggleAnalytics.check();
    
    // Check if the visual toast confirmation appears
    await page.locator('#save-btn').click();
    
    const statusBox = page.locator('#status-message');
    await expect(statusBox).toBeVisible();
    await expect(statusBox).toContainText('Settings saved');

    // Reload the page to confirm chrome.storage persistence worked
    await page.reload();
    await expect(langSelect).toHaveValue('pt');
    await expect(toggleToast).not.toBeChecked();
    await expect(toggleAnalytics).toBeChecked();
  });

  test('YouTube Injection Mechanism', async ({ context, page }) => {
    // Load YouTube Video (Mock Example)
    // Note: Due to captchas we only assert if the Content Script bridge injected our global listener
    await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

    // Wait for the script tag to be injected into the document by the content_bridge.js
    const injectedScript = page.locator('#trueaudio-main-script');
    
    // We expect the script to eventually appear in the DOM (Isolated World bridge)
    await expect(injectedScript).toBeAttached({ timeout: 10000 });
    
    // Check if the UUID Nonce for security validation exists
    const nonce = await injectedScript.getAttribute('data-nonce');
    expect(nonce).not.toBeNull();
  });
  
});
