import React from 'react';
import { Platform } from 'react-native';
import { act, render } from '@testing-library/react-native';
import {
  type Call,
  CallingState,
  SfuModels,
  type VideoTrackType,
} from '@stream-io/video-client';
import { BehaviorSubject } from 'rxjs';
import TrackSubscriber from '../../src/components/Participant/ParticipantView/VideoRenderer/TrackSubscriber';
import mockParticipant from '../mocks/participant';
import { mockCall } from '../mocks/call';
import { mockClientWithUser } from '../mocks/client';

jest.useFakeTimers();

const sessionId = 'remote-session-1';

const joinedCall = (participants = [sessionId]): Call => {
  const call = mockCall(
    mockClientWithUser({ id: 'test-user-id' }),
    participants.map((session) =>
      mockParticipant({
        sessionId: session,
        publishedTracks: [
          SfuModels.TrackType.VIDEO,
          SfuModels.TrackType.SCREEN_SHARE,
        ],
      }),
    ),
  );
  call.state.setCallingState(CallingState.JOINED);
  return call;
};

const dimensionOf = (
  call: Call,
  session = sessionId,
  trackType = SfuModels.TrackType.VIDEO,
) =>
  call.trackSubscriptionManager.subscriptions.find(
    (subscription) =>
      subscription.sessionId === session &&
      subscription.trackType === trackType,
  )?.dimension;

const inlineSubscriber = (
  call: Call,
  dimensions$: BehaviorSubject<SfuModels.VideoDimension | undefined>,
  options: {
    session?: string;
    trackType?: VideoTrackType;
    isVisible?: boolean;
  } = {},
) => (
  <TrackSubscriber
    call={call}
    participantSessionId={options.session ?? sessionId}
    trackType={options.trackType ?? 'videoTrack'}
    isVisible={options.isVisible ?? true}
    dimensions$={dimensions$}
  />
);

const pipSubscriber = (
  call: Call,
  dimensions$: BehaviorSubject<SfuModels.VideoDimension | undefined>,
  options: { session?: string; trackType?: VideoTrackType } = {},
) => (
  <TrackSubscriber
    call={call}
    participantSessionId={options.session ?? sessionId}
    trackType={options.trackType ?? 'videoTrack'}
    isVisible={true}
    dimensions$={dimensions$}
    isPipWriter
  />
);

const inlineDimensions$ = (dimension?: SfuModels.VideoDimension) =>
  new BehaviorSubject<SfuModels.VideoDimension | undefined>(dimension);

describe('TrackSubscriber', () => {
  it('requests the video track when the participant appears in state after the subscriber mounted', () => {
    const client = mockClientWithUser({ id: 'test-user-id' });
    // The subscriber mounts before the remote participant is present in call
    // state (the initial-join / reconnect race).
    const call = mockCall(client, []);
    call.state.setCallingState(CallingState.JOINED);

    const dimensions$ = inlineDimensions$();

    render(inlineSubscriber(call, dimensions$));

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

  it('follows the publication of the track it renders', () => {
    const call = joinedCall();
    const dimensions$ = inlineDimensions$();

    render(pipSubscriber(call, dimensions$));
    act(() => dimensions$.next({ width: 180, height: 240 }));
    expect(dimensionOf(call)).toEqual({ width: 180, height: 240 });

    act(() =>
      call.state.setParticipants([
        mockParticipant({ sessionId, publishedTracks: [] }),
      ]),
    );
    expect(dimensionOf(call)).toBeUndefined();

    act(() =>
      call.state.setParticipants([
        mockParticipant({
          sessionId,
          publishedTracks: [SfuModels.TrackType.VIDEO],
        }),
      ]),
    );
    expect(dimensionOf(call)).toEqual({ width: 180, height: 240 });
  });

  it('requests the native window bounds again after a rejoin', () => {
    const call = joinedCall();
    const dimensions$ = inlineDimensions$();

    render(pipSubscriber(call, dimensions$));
    act(() => dimensions$.next({ width: 180, height: 240 }));

    act(() => {
      call.state.setCallingState(CallingState.RECONNECTING);
      call.state.updateParticipantTracks('videoTrack', {
        [sessionId]: { dimension: undefined },
      });
      call.state.setCallingState(CallingState.JOINED);
    });

    expect(dimensionOf(call)).toEqual({ width: 180, height: 240 });
  });

  it('unsubscribes from the video track when the view becomes invisible', () => {
    const call = joinedCall();
    const dimensions$ = inlineDimensions$({ width: 200, height: 200 });

    const { rerender } = render(
      inlineSubscriber(call, dimensions$, { isVisible: true }),
    );
    expect(dimensionOf(call)).toEqual({ width: 200, height: 200 });

    rerender(inlineSubscriber(call, dimensions$, { isVisible: false }));
    expect(dimensionOf(call)).toBeUndefined();

    rerender(inlineSubscriber(call, dimensions$, { isVisible: true }));
    expect(dimensionOf(call)).toEqual({ width: 200, height: 200 });
  });

  it('preserves Android layout, visibility, publication and rejoin behavior', () => {
    Platform.OS = 'android';
    try {
      const call = joinedCall();
      const dimensions$ = inlineDimensions$();

      const { rerender } = render(inlineSubscriber(call, dimensions$));

      act(() => dimensions$.next({ width: 200, height: 200 }));
      expect(dimensionOf(call)).toEqual({ width: 200, height: 200 });

      act(() => dimensions$.next({ width: 0, height: 0 }));
      expect(dimensionOf(call)).toBeUndefined();

      act(() => dimensions$.next({ width: 320, height: 180 }));
      act(() =>
        call.state.updateParticipant(sessionId, { publishedTracks: [] }),
      );
      expect(dimensionOf(call)).toBeUndefined();
      act(() =>
        call.state.updateParticipant(sessionId, {
          publishedTracks: [SfuModels.TrackType.VIDEO],
        }),
      );
      expect(dimensionOf(call)).toEqual({ width: 320, height: 180 });
      rerender(inlineSubscriber(call, dimensions$, { isVisible: false }));
      expect(dimensionOf(call)).toBeUndefined();
      rerender(inlineSubscriber(call, dimensions$));
      act(() => {
        call.state.setCallingState(CallingState.RECONNECTING);
        call.state.updateParticipantTracks('videoTrack', {
          [sessionId]: { dimension: undefined },
        });
        call.state.setCallingState(CallingState.JOINED);
      });
      expect(dimensionOf(call)).toEqual({ width: 320, height: 180 });
    } finally {
      Platform.OS = 'ios';
    }
  });
});
