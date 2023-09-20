import { expect } from '@playwright/test';

import { testWithCallId as test } from './baseTests';
import {
  generateScriptTagContent,
  participants,
  participantsWithScreenShare,
} from './mocks';

const DEFAULT_LAYOUT = 'spotlight';

test.describe('Layouts', () => {
  (
    [
      { name: undefined, participantCountPerWindow: 5 }, // default
      { name: 'grid', participantCountPerWindow: 5 },
      { name: 'single_participant', participantCountPerWindow: 1 },
      { name: 'spotlight', participantCountPerWindow: 5 },
    ] as const
  ).forEach((layout) => {
    test(`Should render layout - ${layout.name ?? 'default'}`, async ({
      page,
      callId,
    }) => {
      await page.addScriptTag({
        content: generateScriptTagContent({
          call_id: callId,
          layout: layout.name,
          test_environment: {
            participants,
          },
        }),
      });

      await expect(page.getByTestId('participant-view')).toHaveCount(
        layout.participantCountPerWindow,
      );

      await expect(
        page.getByTestId(layout.name ?? DEFAULT_LAYOUT),
      ).toBeVisible();

      await expect(page).toHaveScreenshot({
        mask: [page.getByTestId('participant-view')],
        maskColor: 'lime',
      });
    });
  });

  test('Should render default screenshare layout', async ({ page, callId }) => {
    await page.addScriptTag({
      content: generateScriptTagContent({
        call_id: callId,
        test_environment: {
          participants: participantsWithScreenShare,
        },
      }),
    });

    await expect(page.getByTestId('participant-view')).toHaveCount(6);

    await expect(page.getByTestId(DEFAULT_LAYOUT)).toBeVisible();

    await expect(page).toHaveScreenshot();
  });
});
