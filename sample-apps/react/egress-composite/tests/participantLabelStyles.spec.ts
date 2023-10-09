import { expect } from '@playwright/test';

import { testWithCallId as test } from './baseTests';
import { generateScriptTagContent, participants } from './mocks';

test.describe('Participant Label Styles', () => {
  test('Should not render participant labels when disabled', async ({
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
          'participant_label.display': false,
        },
      }),
    });

    await expect(page.getByTestId('participant-view')).toHaveCount(5);

    await expect(page).toHaveScreenshot();
  });

  test('Should render participant labels with custom options', async ({
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
          'participant_label.text_color': 'green',
          'participant_label.background_color': 'red',
          'participant_label.border_width': '3px',
          'participant_label.border_radius': '5px',
          'participant_label.border_color': 'purple',
          'participant_label.horizontal_position': 'right',
          'participant_label.vertical_position': 'top',
          'participant_label.margin_inline': '10px',
          'participant_label.margin_block': '10px',
        },
      }),
    });

    await expect(page.getByTestId('participant-view')).toHaveCount(5);

    await expect(page).toHaveScreenshot();
  });
});
