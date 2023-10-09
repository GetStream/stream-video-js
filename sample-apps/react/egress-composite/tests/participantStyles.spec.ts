import { expect } from '@playwright/test';

import { testWithCallId as test } from './baseTests';
import {
  generateScriptTagContent,
  participantsWithSpeakingFlag,
} from './mocks';

test.describe('Participant Styles', () => {
  test('Should render participant labels with custom options', async ({
    page,
    callId,
  }) => {
    await page.addScriptTag({
      content: generateScriptTagContent({
        call_id: callId,
        test_environment: {
          participants: participantsWithSpeakingFlag,
        },
        options: {
          'participant.outline_color': 'red',
          'participant.outline_width': '3px',
          'participant.border_radius': '35px',
          'participant.placeholder_background_color': 'pink',
        },
      }),
    });

    await expect(page.getByTestId('participant-view')).toHaveCount(5);

    await expect(page).toHaveScreenshot();
  });
});
