import React from 'react';
import { Platform } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { type Call, CallingState, SfuModels } from '@stream-io/video-client';
import { BehaviorSubject } from 'rxjs';
import TrackSubscriber from '../../src/components/Participant/ParticipantView/VideoRenderer/TrackSubscriber';
import { getIosVideoSubscriptionDemand } from '../../src/utils/internal/IosVideoSubscriptionDemand';
import mockParticipant from '../mocks/participant';
import { mockCall } from '../mocks/call';
import { mockClientWithUser } from '../mocks/client';

jest.useFakeTimers();

const sessionId = 'remote-session-1';

const joinedCallWithRemote = (): Call => {
  const call = mockCall(mockClientWithUser({ id: 'test-user-id' }), [
    mockParticipant({
      sessionId,
      publishedTracks: [SfuModels.TrackType.VIDEO],
    }),
  ]);
  call.state.setCallingState(CallingState.JOINED);
  return call;
};

const videoDimensionOf = (call: Call) =>
  call.trackSubscriptionManager.subscriptions.find(
    (subscription) =>
      subscription.sessionId === sessionId &&
      subscription.trackType === SfuModels.TrackType.VIDEO,
  )?.dimension;

describe('TrackSubscriber', () => {
  it('requests the video track when the participant appears in state after the subscriber mounted', () => {
    const client = mockClientWithUser({ id: 'test-user-id' });
    // The subscriber mounts before the remote participant is present in call
    // state (the initial-join / reconnect race).
    const call = mockCall(client, []);
    call.state.setCallingState(CallingState.JOINED);

    const dimensions$ = new BehaviorSubject<
      SfuModels.VideoDimension | undefined
    >(undefined);

    render(
      <TrackSubscriber
        call={call}
        participantSessionId={sessionId}
        trackType="videoTrack"
        isVisible={true}
        dimensions$={dimensions$}
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
      dimensions$.next({ width: 200, height: 200 });
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

  it('keeps the native picture in picture demand while the hidden call layout grows', () => {
    const call = joinedCallWithRemote();
    // the visible tile of the participant that picture in picture shows too
    const dimensions$ = new BehaviorSubject<
      SfuModels.VideoDimension | undefined
    >({ width: 390, height: 725 });

    render(
      <TrackSubscriber
        call={call}
        participantSessionId={sessionId}
        trackType="videoTrack"
        isVisible={true}
        dimensions$={dimensions$}
      />,
    );
    expect(videoDimensionOf(call)).toEqual({ width: 390, height: 725 });

    const demand = getIosVideoSubscriptionDemand(call);
    act(() => {
      demand.setPipDimension({ width: 180, height: 240 });
      demand.acquirePip({ sessionId, trackType: 'videoTrack' });
    });
    expect(videoDimensionOf(call)).toEqual({ width: 180, height: 240 });

    // removing the call controls enlarges the tile that is no longer on screen
    act(() => dimensions$.next({ width: 390, height: 800 }));
    expect(videoDimensionOf(call)).toEqual({ width: 180, height: 240 });

    act(() => demand.releasePip());
    expect(videoDimensionOf(call)).toEqual({ width: 390, height: 800 });
  });

  it('unsubscribes from the video track when the view becomes invisible', () => {
    const call = joinedCallWithRemote();
    const dimensions$ = new BehaviorSubject<
      SfuModels.VideoDimension | undefined
    >({ width: 200, height: 200 });

    const trackSubscriber = (isVisible: boolean) => (
      <TrackSubscriber
        call={call}
        participantSessionId={sessionId}
        trackType="videoTrack"
        isVisible={isVisible}
        dimensions$={dimensions$}
      />
    );

    const { rerender } = render(trackSubscriber(true));
    expect(videoDimensionOf(call)).toEqual({ width: 200, height: 200 });

    rerender(trackSubscriber(false));
    expect(videoDimensionOf(call)).toBeUndefined();

    rerender(trackSubscriber(true));
    expect(videoDimensionOf(call)).toEqual({ width: 200, height: 200 });
  });

  it('requests the video track with the view dimensions on Android', () => {
    Platform.OS = 'android';
    try {
      const call = joinedCallWithRemote();
      const dimensions$ = new BehaviorSubject<
        SfuModels.VideoDimension | undefined
      >(undefined);

      render(
        <TrackSubscriber
          call={call}
          participantSessionId={sessionId}
          trackType="videoTrack"
          isVisible={true}
          dimensions$={dimensions$}
        />,
      );

      act(() => dimensions$.next({ width: 200, height: 200 }));
      expect(videoDimensionOf(call)).toEqual({ width: 200, height: 200 });

      act(() => dimensions$.next({ width: 0, height: 0 }));
      expect(videoDimensionOf(call)).toBeUndefined();
    } finally {
      Platform.OS = 'ios';
    }
  });
});
