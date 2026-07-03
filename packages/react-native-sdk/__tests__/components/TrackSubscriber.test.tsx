import React, { createRef } from 'react';
import { LayoutChangeEvent } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { CallingState, SfuModels } from '@stream-io/video-client';
import TrackSubscriber, {
  TrackSubscriberHandle,
} from '../../src/components/Participant/ParticipantView/VideoRenderer/TrackSubscriber';
import mockParticipant from '../mocks/participant';
import { mockCall } from '../mocks/call';
import { mockClientWithUser } from '../mocks/client';

jest.useFakeTimers();

const layoutEvent = (width: number, height: number) =>
  ({
    nativeEvent: { layout: { width, height, x: 0, y: 0 } },
  }) as unknown as LayoutChangeEvent;

describe('TrackSubscriber', () => {
  it('requests the video track when the participant appears in state after the subscriber mounted', () => {
    const client = mockClientWithUser({ id: 'test-user-id' });
    // The subscriber mounts before the remote participant is present in call
    // state (the initial-join / reconnect race).
    const call = mockCall(client, []);
    call.state.setCallingState(CallingState.JOINED);

    const sessionId = 'remote-session-1';
    const ref = createRef<TrackSubscriberHandle>();

    render(
      <TrackSubscriber
        ref={ref}
        call={call}
        participantSessionId={sessionId}
        trackType="videoTrack"
        isVisible={true}
      />,
    );

    // Nothing to subscribe to yet: the participant is not in state.
    expect(call.trackSubscriptionManager.subscriptions).toHaveLength(0);

    // The remote participant now appears, publishing video ("state looks good").
    act(() => {
      call.state.setParticipants([
        mockParticipant({
          sessionId,
          publishedTracks: [SfuModels.TrackType.VIDEO],
        }),
      ]);
    });

    // The view lays out and reports its dimensions.
    act(() => {
      ref.current?.onLayoutUpdate(layoutEvent(200, 200));
    });

    // The client must now request the participant's video track. Before the fix
    // the subscription stream was terminated at mount time, so this stayed empty.
    expect(call.trackSubscriptionManager.subscriptions).toContainEqual(
      expect.objectContaining({
        sessionId,
        trackType: SfuModels.TrackType.VIDEO,
      }),
    );
  });
});
