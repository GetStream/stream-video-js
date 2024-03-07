import { test as base } from '@playwright/test';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('1234567890abcdefghijklmnop', 10);

export const testWithCallId = base.extend<{ callId: string }>({
  callId: async ({ page }, use) => {
    const callId = nanoid();

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // run tests
    await use(callId);
  },
});
