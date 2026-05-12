import { expect } from '@playwright/test';

import { testWithCallId as test } from './baseTests';
import { generateScriptTagContent, participants } from './mocks';
import { type Layout } from '../src/components/layouts';

const LAYOUTS_UNDER_TEST: Layout[] = [
  'spotlight',
  'grid',
  'dominant-speaker',
  'single-participant',
  'mobile',
];

const READINESS_ASSERT_TIMEOUT_MS = 2000;

test.describe('Egress readiness', () => {
  for (const layout of LAYOUTS_UNDER_TEST) {
    test(`"${layout}" layout signals readiness before the fallback timeout`, async ({
      page,
      callId,
    }) => {
      const logs: string[] = [];
      page.on('console', (msg) => logs.push(msg.text()));

      await page.addScriptTag({
        content: generateScriptTagContent({
          call_id: callId,
          layout,
          test_environment: { participants },
        }),
      });

      await expect(page.locator('#egress-ready-for-capture')).toBeAttached({
        timeout: READINESS_ASSERT_TIMEOUT_MS,
      });

      expect(logs.some((line) => line.startsWith('Egress is ready'))).toBe(
        true,
      );
      expect(
        logs.some((line) => line.startsWith('Timeout: Egress is ready')),
      ).toBe(false);
    });
  }
});
