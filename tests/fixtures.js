import { test as base, chromium, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// URL for Chrome Extensions page
const EXTENSION_MANAGER_URL = 'chrome://extensions/';

// Define a custom test fixture that loads the extension
export const test = base.extend({
  context: async ({ }, use) => {
    // Determine the path to the extension directory (current working directory)
    const pathToExtension = path.join(process.cwd());

    // Launch Chrome with the extension loaded
    const context = await chromium.launchPersistentContext('', {
      headless: false, // UI Extensions usually require a non-headless context to test effectively
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });

    await use(context);
    await context.close();
  },
  
  // Custom fixture to extract the generated Extension ID
  extensionId: async ({ context }, use) => {
    // Navigate to a blank page to access the background workers
    let background = context.serviceWorkers()[0];
    if (!background) {
      background = await context.waitForEvent('serviceworker');
    }

    // Extract the extension ID from the Service Worker URL
    const extensionId = background.url().split('/')[2];
    await use(extensionId);
  },
});

export { expect };
