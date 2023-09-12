import { test as base, expect } from '@playwright/test';
import { customAlphabet } from 'nanoid';
import axios from 'axios';
import { StreamVideoParticipant } from '@stream-io/video-react-sdk';
import { ConfigurationValue } from '../src/ConfigurationContext';

const nanoid = customAlphabet('1234567890abcdefghijklmnop', 10);

// TODO: move to some shared folder
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const buddyTest = base.extend<{ callId: string }>({
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

const test = base.extend<{ callId: string }>({
  callId: async ({ page }, use) => {
    const callId = nanoid();

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // run tests
    await use(callId);
  },
});

const participants: Partial<StreamVideoParticipant>[] = [
  {
    userId: 'john',
    sessionId: '1',
    publishedTracks: [],
    isSpeaking: false,
  },
  {
    userId: 'jane',
    name: 'Jane Strong',
    sessionId: '2',
    publishedTracks: [],
    isSpeaking: false,
  },
  {
    userId: 'mark',
    sessionId: '3',
    publishedTracks: [],
    isSpeaking: false,
  },
  {
    userId: 'martin',
    sessionId: '4',
    publishedTracks: [],
    isSpeaking: false,
  },
  {
    userId: 'anne',
    sessionId: '5',
    publishedTracks: [],
    isSpeaking: false,
  },
];

test.describe('Layouts', () => {
  [
    { name: 'grid', participantCountPerWindow: 5 },
    { name: 'single_participant', participantCountPerWindow: 1 },
    { name: 'spotlight', participantCountPerWindow: 5 },
  ].forEach((layout) => {
    test(`${layout.name}`, async ({ page, callId }) => {
      await page.addScriptTag({
        content: `
        window.setupLayout({
          call_id: "${callId}",
          layout: "${layout.name}",
          test_environment: ${JSON.stringify({
            participants,
          } satisfies ConfigurationValue['test_environment'])}
        });
      `,
      });

      await expect(page.getByTestId('participant-view')).toHaveCount(
        layout.participantCountPerWindow,
      );
      await expect(page.getByTestId(layout.name)).toBeVisible();
      await expect(page).toHaveScreenshot({
        mask: [page.getByTestId('participant-view')],
        maskColor: 'lime',
      });
    });
  });
});
