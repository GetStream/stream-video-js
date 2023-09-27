import { expect } from '@playwright/test';

import { testWithCallId as test } from './baseTests';
import { generateScriptTagContent, participants } from './mocks';

test.describe('Generic Layout Styles', () => {
  test('Should have proper background with applied styling', async ({
    page,
    callId,
  }) => {
    await page.addScriptTag({
      content: generateScriptTagContent({
        call_id: callId,
        test_environment: {
          participants,
        },
        options: {
          'layout.background_color': '#ffffff',
          'layout.background_image':
            'linear-gradient(135deg, #43434e 25%, transparent 25%), linear-gradient(225deg, #43434e 25%, transparent 25%), linear-gradient(45deg, #43434e 25%, transparent 25%), linear-gradient(315deg, #43434e 25%, #ffffff 25%)',
          'layout.background_position': '12px 0, 12px 0, 0 0, 0 0',
          'layout.background_size': '24px 24px',
          'layout.background_repeat': 'repeat',
        },
      }),
    });

    await expect(page.getByTestId('participant-view')).toHaveCount(5);

    await expect(page).toHaveScreenshot({ maxDiffPixels: 200 });
  });
});
