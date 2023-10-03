import { expect } from '@playwright/test';
import concatStrings from 'clsx';

import { testWithCallId as test } from './baseTests';
import {
  generateScriptTagContent,
  participants,
  participantsWithScreenShare,
} from './mocks';
import { type Layout, type ScreenshareLayout } from '../src/components/layouts';

// TODO: find out why importing these from "../src/components/layouts" causes test to not run
const DEFAULT_LAYOUT: Layout = 'spotlight';
const DEFAULT_SCREENSHARE_LAYOUT: Layout = 'spotlight';

type TestCase<T extends Layout | ScreenshareLayout> = {
  name?: T | 'unknown';
  participantCountPerWindow: number;
  extraMessage?: string;
};

test.describe('Layouts', () => {
  (
    [
      {
        name: undefined,
        participantCountPerWindow: 5,
        extraMessage: `(undefined - fall back to "${DEFAULT_LAYOUT}")`,
      }, // default
      {
        name: 'unknown', // random string
        participantCountPerWindow: 5,
        extraMessage: `(fall back to "${DEFAULT_LAYOUT}")`,
      },
      { name: 'spotlight', participantCountPerWindow: 5 },
      { name: 'single-participant', participantCountPerWindow: 1 },
      { name: 'grid', participantCountPerWindow: 5 },
    ] satisfies TestCase<Layout>[]
  ).forEach((tc) => {
    test(
      concatStrings(
        `Should render layout - ${tc.name ?? 'default'}`,
        tc.extraMessage,
      ),
      async ({ page, callId }) => {
        await page.addScriptTag({
          content: generateScriptTagContent({
            call_id: callId,
            // @ts-expect-error - tests all possible scenarios undefined & unknown are possible but not expected type-wise
            layout: tc.name,
            test_environment: {
              participants,
            },
          }),
        });

        await expect(page.getByTestId('participant-view')).toHaveCount(
          tc.participantCountPerWindow,
        );

        await expect(
          page.getByTestId(
            tc.name === 'unknown' ? DEFAULT_LAYOUT : tc.name ?? DEFAULT_LAYOUT,
          ),
        ).toBeVisible();

        await expect(page).toHaveScreenshot({
          mask: [page.getByTestId('participant-view')],
          maskColor: 'lime',
        });
      },
    );
  });

  (
    [
      {
        name: undefined,
        participantCountPerWindow: 6,
        extraMessage: `(undefined - fall back to "${DEFAULT_SCREENSHARE_LAYOUT}")`,
      }, // default
      {
        name: 'unknown',
        participantCountPerWindow: 6,
        extraMessage: `(fall back to "${DEFAULT_SCREENSHARE_LAYOUT}")`,
      },
      { name: 'spotlight', participantCountPerWindow: 6 },
      { name: 'single-participant', participantCountPerWindow: 2 },
    ] satisfies TestCase<ScreenshareLayout>[]
  ).forEach((tc) => {
    test(
      concatStrings(
        `Should render screenshare layout - ${tc.name ?? 'default'}`,
        tc.extraMessage,
      ),
      async ({ page, callId }) => {
        await page.addScriptTag({
          content: generateScriptTagContent({
            call_id: callId,
            // @ts-expect-error
            screenshare_layout: tc.name,
            test_environment: {
              participants: participantsWithScreenShare,
            },
          }),
        });

        await expect(page.getByTestId('participant-view')).toHaveCount(
          tc.participantCountPerWindow,
        );

        await expect(
          page.getByTestId(
            tc.name === 'unknown'
              ? DEFAULT_SCREENSHARE_LAYOUT
              : tc.name ?? DEFAULT_SCREENSHARE_LAYOUT,
          ),
        ).toBeVisible();

        await expect(page).toHaveScreenshot();
      },
    );
  });
});
