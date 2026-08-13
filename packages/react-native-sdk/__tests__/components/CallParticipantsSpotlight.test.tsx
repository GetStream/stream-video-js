import React from 'react';
import { mockClientWithUser } from '../mocks/client';
import { CallingState, SfuModels } from '@stream-io/video-client';
import mockParticipant from '../mocks/participant';
import { ComponentTestIds } from '../../src/constants/TestIds';
import { mockCall } from '../mocks/call';
import { act, fireEvent, render, screen } from '../utils/RNTLTools';
import { CallParticipantsSpotlight } from '../../src/components/Call/CallLayout/CallParticipantsSpotlight';
import { CallParticipantsList } from '../../src/components/Call/CallParticipantsList/CallParticipantsList';
import { ParticipantView } from '../../src/components/Participant/ParticipantView/ParticipantView';
import { VideoRenderer } from '../../src/components/Participant/ParticipantView/VideoRenderer';
import { ParticipantLabel } from '../../src/components/Participant/ParticipantView';

console.warn = jest.fn();
jest.useFakeTimers();

enum P_IDS {
  LOCAL_1 = 'local-1',
  REMOTE_1 = 'remote-1',
  REMOTE_2 = 'remote-2',
}

describe('CallParticipantsSpotlight', () => {
  it('should render an local video when only 1 participant present in the call', async () => {
    const call = mockCall(mockClientWithUser(), [
      mockParticipant({
        isLocalParticipant: true,
        sessionId: P_IDS.LOCAL_1,
        userId: P_IDS.LOCAL_1,
      }),
      mockParticipant({
        publishedTracks: [
          SfuModels.TrackType.AUDIO,
          SfuModels.TrackType.VIDEO,
          SfuModels.TrackType.SCREEN_SHARE,
        ],
        sessionId: P_IDS.REMOTE_1,
        userId: P_IDS.REMOTE_1,
        screenShareStream: {
          toURL: () => 'screen-share-url',
          // @ts-expect-error due to dom event type not being compatible with RN
          getVideoTracks: jest.fn(() => [
            {
              id: '123',
              getSettings: () => ({
                width: 100,
                height: 100,
              }),
            },
          ]),
        },
      }),
    ]);

    render(
      <CallParticipantsSpotlight
        CallParticipantsList={CallParticipantsList}
        ParticipantView={ParticipantView}
        VideoRenderer={VideoRenderer}
        ParticipantLabel={ParticipantLabel}
      />,
      {
        call,
      },
    );

    expect(
      await screen.findByTestId(ComponentTestIds.PARTICIPANT_SCREEN_SHARING),
    ).toBeVisible();
  });

  it('should render call participants component with spotlight mode with 2 participants', async () => {
    const call = mockCall(mockClientWithUser(), [
      mockParticipant({
        isLocalParticipant: true,
        sessionId: P_IDS.LOCAL_1,
        userId: P_IDS.LOCAL_1,
      }),
      mockParticipant({
        publishedTracks: [
          SfuModels.TrackType.AUDIO,
          SfuModels.TrackType.VIDEO,
          SfuModels.TrackType.SCREEN_SHARE,
        ],
        sessionId: P_IDS.REMOTE_1,
        userId: P_IDS.REMOTE_1,
        screenShareStream: {
          toURL: () => 'screen-share-url',
          // @ts-expect-error due to dom event type not being compatible with RN
          getVideoTracks: jest.fn(() => [
            {
              id: '123',
              getSettings: () => ({
                width: 100,
                height: 100,
              }),
            },
          ]),
        },
      }),
    ]);

    render(
      <CallParticipantsSpotlight
        CallParticipantsList={CallParticipantsList}
        ParticipantView={ParticipantView}
      />,
      {
        call,
      },
    );

    expect(
      await screen.findByTestId(ComponentTestIds.CALL_PARTICIPANTS_SPOTLIGHT),
    ).toBeVisible();

    // Since it has a screen share and thereby spotlight, we should render the flatlist even with 2 participants
    expect(
      await screen.findByTestId(ComponentTestIds.CALL_PARTICIPANTS_LIST),
    ).toBeVisible();
  });

  it('keeps the spotlight video subscription when a remote participant moves there from the list', async () => {
    const call = mockCall(mockClientWithUser(), [
      mockParticipant({ isLocalParticipant: true, sessionId: P_IDS.LOCAL_1 }),
      mockParticipant({ sessionId: P_IDS.REMOTE_1 }),
      mockParticipant({ sessionId: P_IDS.REMOTE_2 }),
    ]);
    call.state.setCallingState(CallingState.JOINED);

    render(
      <CallParticipantsSpotlight
        CallParticipantsList={CallParticipantsList}
        ParticipantView={ParticipantView}
        VideoRenderer={VideoRenderer}
      />,
      { call },
    );

    // `dominantSpeaker` sorts first under the spotlight's preset, so this moves
    // `sessionId` into the spotlight and the other remote into the list. The
    // advance covers the layout's 300ms participant debounce, the list's 500ms
    // viewability re-render and the 600ms subscription debounce, so any delayed
    // write from the old list cell has landed.
    const spotlight = (sessionId: P_IDS) =>
      act(async () => {
        call.state.updateParticipants({
          [P_IDS.REMOTE_1]: { isDominantSpeaker: sessionId === P_IDS.REMOTE_1 },
          [P_IDS.REMOTE_2]: { isDominantSpeaker: sessionId === P_IDS.REMOTE_2 },
        });
        jest.advanceTimersByTime(2000);
      });

    await spotlight(P_IDS.REMOTE_1);
    // only the spotlight tile renders an RTCView: the list cells are never
    // reported viewable in this environment, so they render their fallback
    fireEvent(
      screen.getByTestId(ComponentTestIds.PARTICIPANT_MEDIA_STREAM),
      'layout',
      { nativeEvent: { layout: { width: 800, height: 600, x: 0, y: 0 } } },
    );

    // REMOTE_2 takes the spotlight and REMOTE_1 drops into the list, with no new
    // layout event: the tile's geometry is unchanged, so RN would not fire one.
    // The 800x600 dimension can only come from the layout reported above.
    await spotlight(P_IDS.REMOTE_2);

    expect(call.trackSubscriptionManager.subscriptions).toContainEqual(
      expect.objectContaining({
        sessionId: P_IDS.REMOTE_2,
        trackType: SfuModels.TrackType.VIDEO,
        dimension: { width: 800, height: 600 },
      }),
    );
  });
});
