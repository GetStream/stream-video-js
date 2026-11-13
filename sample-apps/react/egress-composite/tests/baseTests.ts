import { test as base } from '@playwright/test';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('1234567890abcdefghijklmnop', 10);

type Credentials = { api_key: string; token: string };

const fetchDemoCredentials = async (): Promise<Credentials> => {
  const url = new URL('https://pronto.getstream.io/api/auth/create-token');
  url.searchParams.set('environment', 'demo');
  url.searchParams.set('user_id', 'jane');
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Token request failed: ${response.status} ${await response.text()}`,
    );
  }
  const { apiKey, token } = await response.json();
  return { api_key: apiKey, token };
};

let credentials: Promise<Credentials> | undefined;

/**
 * Fetches the demo environment credentials once per worker and exposes them
 * to the page, where `generateScriptTagContent` passes them to `setupLayout`.
 */
export const testWithCallId = base.extend<{ callId: string }>({
  callId: async ({ page }, use) => {
    const callId = nanoid();

    credentials ??= fetchDemoCredentials();
    await page.addInitScript(
      (value) => Object.assign(window, { e2eCredentials: value }),
      await credentials,
    );
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // run tests
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(callId);
  },
});
