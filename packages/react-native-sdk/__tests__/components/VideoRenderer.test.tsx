import React from 'react';
import { CallingState, SfuModels } from '@stream-io/video-client';
import { act, fireEvent, render, screen } from '../utils/RNTLTools';
import { VideoRenderer } from '../../src/components/Participant/ParticipantView/VideoRenderer';
import { ComponentTestIds } from '../../src/constants/TestIds';
import mockParticipant from '../mocks/participant';
import { mockCall } from '../mocks/call';
import { mockClientWithUser } from '../mocks/client';

jest.useFakeTimers();

describe('VideoRenderer', () => {
  it('requests the video track of every remote participant occupying a tile whose layout event was dropped', async () => {
    const local = mockParticipant({
      sessionId: 'local',
      isLocalParticipant: true,
    });
    const remotes = [
      mockParticipant({ sessionId: 'remote-1' }),
      mockParticipant({ sessionId: 'remote-2' }),
    ];
    const call = mockCall(mockClientWithUser(), [local, ...remotes]);
    call.state.setCallingState(CallingState.JOINED);

    // A spotlight tile keeps the same VideoRenderer across participant changes,
    // so `onLayout` fires only while the local participant occupies it - at
    // which point no TrackSubscriber is mounted to receive it.
    const { rerender } = render(
      <VideoRenderer participant={local} trackType="videoTrack" />,
      { call },
    );
    await act(async () => {}); // let the providers finish their async setup
    fireEvent(
      screen.getByTestId(ComponentTestIds.PARTICIPANT_MEDIA_STREAM),
      'layout',
      { nativeEvent: { layout: { width: 400, height: 300, x: 0, y: 0 } } },
    );

    expect(call.trackSubscriptionManager.subscriptions).toHaveLength(0);

    // Each remote in turn takes over the tile. The geometry never changes, so
    // React Native does not fire `onLayout` again - so the dropped event must
    // not be the tile's only source of truth, for the first occupant or any
    // later one.
    for (const remote of remotes) {
      rerender(<VideoRenderer participant={remote} trackType="videoTrack" />);
      expect(call.trackSubscriptionManager.subscriptions).toContainEqual(
        expect.objectContaining({
          sessionId: remote.sessionId,
          trackType: SfuModels.TrackType.VIDEO,
          dimension: { width: 400, height: 300 },
        }),
      );
    }
  });
});
