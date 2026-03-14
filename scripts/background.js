// Dummy background service worker to allow Playwright testing to hook an Extension ID
chrome.runtime.onInstalled.addListener(() => {
    console.log('[TrueAudio] Extension Installed/Updated');
});
