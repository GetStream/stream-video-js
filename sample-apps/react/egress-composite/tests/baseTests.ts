import { test as base } from '@playwright/test';
import { customAlphabet } from 'nanoid';
import axios from 'axios';

const nanoid = customAlphabet('1234567890abcdefghijklmnop', 10);

export const testWithCallId = base.extend<{ callId: string }>({
  callId: async ({ page }, use) => {
    const callId = nanoid();

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // run tests
    await use(callId);
  },
});

// TODO: find better name
export const testWithBuddy = base.extend<{ callId: string }>({
  callId: async ({ page }, use) => {
    const callId = nanoid();

    // TODO: have proper abstractions with typing like StreamVideoBuddy.join(...) -> id and StreamVideoBuddy.teardown(id)
    await axios.post('http://localhost:4567/stream-video-buddy?async=true', {
      duration: 60,
      'call-id': callId,
      'user-count': 4,
    });

    // TODO: have proper ?asyncJoin=true
    // which waits only for successfull call creation
    // but asyncs user joins
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // run tests
    await use(callId);

    // teardown
    // TODO: await StreamVideoBuddy.teardown()...
  },
});
