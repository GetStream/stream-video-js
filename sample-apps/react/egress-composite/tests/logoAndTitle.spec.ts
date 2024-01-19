import { expect } from '@playwright/test';

import { testWithCallId as test } from './baseTests';
import { generateScriptTagContent, participants } from './mocks';

const LOGO_URL = 'https://pronto.getstream.io/home.png';

test.describe('Logo and Title', () => {
  test('Should render logo and title with defaults', async ({
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
          'logo.image_url': LOGO_URL,
          'title.text': 'Test text',
        },
      }),
    });

    await expect(page.getByTestId('participant-view')).toHaveCount(5);
    await expect(page.getByTestId('logo')).toBeVisible();
    await expect(page.getByTestId('title')).toBeVisible();

    await expect(page).toHaveScreenshot();
  });

  test('Should render logo and title with custom options', async ({
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
          'logo.image_url': LOGO_URL,
          'logo.height': '80px',
          'logo.width': '120px',
          'logo.horizontal_position': 'left',
          'logo.vertical_position': 'top',
          'logo.margin_block': '30px',
          'logo.margin_inline': '30px',

          'title.text': 'Test text',
          'title.color': 'red',
          'title.margin_block': '20px',
          'title.margin_inline': '20px',
          'title.font_size': '80px',
          'title.horizontal_position': 'right',
          'title.vertical_position': 'bottom',
        },
      }),
    });

    await expect(page.getByTestId('participant-view')).toHaveCount(5);
    await expect(page.getByTestId('logo')).toBeVisible();
    await expect(page.getByTestId('title')).toBeVisible();

    await expect(page).toHaveScreenshot();
  });
});
