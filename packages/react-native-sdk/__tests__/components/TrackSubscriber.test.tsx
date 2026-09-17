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
import {
  getIosPipVideoDemand,
  type IosPipVideoWindow,
} from '../../src/utils/internal/IosPipVideoDemand';
import mockParticipant from '../mocks/participant';
import { mockCall } from '../mocks/call';
import { mockClientWithUser } from '../mocks/client';

jest.useFakeTimers();

const sessionId = 'remote-session-1';
const otherSessionId = 'remote-session-2';

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

/** Counts the subscription updates actually sent to the SFU. */
const mockSfuClient = (call: Call) => {
  const updateSubscriptions = jest.fn().mockResolvedValue({});
  call.trackSubscriptionManager.setSfuClient({
    updateSubscriptions,
  } as any);
  return updateSubscriptions;
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
  window: IosPipVideoWindow,
  options: { session?: string; trackType?: VideoTrackType } = {},
) => (
  <TrackSubscriber
    call={call}
    participantSessionId={options.session ?? sessionId}
    trackType={options.trackType ?? 'videoTrack'}
    isVisible={true}
    dimensions$={window.dimensions$}
    pipWindow={window}
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

  it('keeps the native picture in picture bounds while the hidden inline layout grows', () => {
    const call = joinedCall();
    const dimensions$ = inlineDimensions$({ width: 390, height: 725 });
    const window = getIosPipVideoDemand(call).claimWindow();

    const { rerender } = render(<>{inlineSubscriber(call, dimensions$)}</>);
    expect(dimensionOf(call)).toEqual({ width: 390, height: 725 });

    act(() => window.setBounds({ width: 180, height: 240 }));
    rerender(
      <>
        {inlineSubscriber(call, dimensions$)}
        {pipSubscriber(call, window)}
      </>,
    );
    expect(dimensionOf(call)).toEqual({ width: 180, height: 240 });

    // removing the call controls enlarges the tile that is no longer on screen
    act(() => dimensions$.next({ width: 390, height: 800 }));
    expect(dimensionOf(call)).toEqual({ width: 180, height: 240 });

    // the native window is resized by the user
    act(() => window.setBounds({ width: 240, height: 320 }));
    expect(dimensionOf(call)).toEqual({ width: 240, height: 320 });

    // stopping picture in picture restores the current inline demand, without
    // waiting for a new layout of the tile
    rerender(<>{inlineSubscriber(call, dimensions$)}</>);
    expect(dimensionOf(call)).toEqual({ width: 390, height: 800 });
  });

  it('keeps the last valid demand while the bounds of the native window are unknown', () => {
    const call = joinedCall();
    const dimensions$ = inlineDimensions$({ width: 390, height: 725 });
    const window = getIosPipVideoDemand(call).claimWindow();

    const { rerender } = render(<>{inlineSubscriber(call, dimensions$)}</>);

    // picture in picture starts before its window has been laid out
    rerender(
      <>
        {inlineSubscriber(call, dimensions$)}
        {pipSubscriber(call, window)}
      </>,
    );
    act(() => dimensions$.next({ width: 390, height: 800 }));
    expect(dimensionOf(call)).toEqual({ width: 390, height: 725 });

    act(() => window.setBounds({ width: 180, height: 240 }));
    expect(dimensionOf(call)).toEqual({ width: 180, height: 240 });
  });

  it('accepts bounds reported before the window renders the track', () => {
    const call = joinedCall();
    const dimensions$ = inlineDimensions$({ width: 390, height: 725 });
    const window = getIosPipVideoDemand(call).claimWindow();

    const { rerender } = render(<>{inlineSubscriber(call, dimensions$)}</>);
    act(() => window.setBounds({ width: 180, height: 240 }));

    rerender(
      <>
        {inlineSubscriber(call, dimensions$)}
        {pipSubscriber(call, window)}
      </>,
    );
    expect(dimensionOf(call)).toEqual({ width: 180, height: 240 });
  });

  it('serves the track of the native window without an inline view of it', () => {
    const call = joinedCall();
    const updateSubscriptions = mockSfuClient(call);
    const window = getIosPipVideoDemand(call).claimWindow();

    const { unmount } = render(pipSubscriber(call, window));
    // no geometry is known yet: nothing is requested
    expect(call.trackSubscriptionManager.subscriptions).toHaveLength(0);

    act(() => window.setBounds({ width: 180, height: 240 }));
    expect(dimensionOf(call)).toEqual({ width: 180, height: 240 });

    // no inline view needs the track, so its demand is given up
    act(() => unmount());
    expect(dimensionOf(call)).toBeUndefined();
    act(() => jest.advanceTimersByTime(1000));
    expect(updateSubscriptions).toHaveBeenLastCalledWith([]);
  });

  it('ignores invalid and repeated bounds', () => {
    const call = joinedCall();
    const updateSubscriptions = mockSfuClient(call);
    const window = getIosPipVideoDemand(call).claimWindow();

    render(pipSubscriber(call, window));
    act(() => window.setBounds({ width: 180.6, height: 240.9 }));
    act(() => jest.advanceTimersByTime(1000));
    expect(dimensionOf(call)).toEqual({ width: 180, height: 240 });
    expect(updateSubscriptions).toHaveBeenCalledTimes(1);

    act(() => {
      window.setBounds({ width: 0, height: 0 });
      window.setBounds({ width: Number.NaN, height: 240 });
      window.setBounds(undefined);
      window.setBounds({ width: 180, height: 240 });
      jest.advanceTimersByTime(1000);
    });
    expect(dimensionOf(call)).toEqual({ width: 180, height: 240 });
    expect(updateSubscriptions).toHaveBeenCalledTimes(1);
  });

  it('transfers the demand to a newly selected participant', () => {
    const call = joinedCall([sessionId, otherSessionId]);
    const dimensions$ = inlineDimensions$({ width: 390, height: 725 });
    const otherDimensions$ = inlineDimensions$({ width: 100, height: 120 });
    const window = getIosPipVideoDemand(call).claimWindow();

    const inlineViews = (
      <>
        {inlineSubscriber(call, dimensions$)}
        {inlineSubscriber(call, otherDimensions$, { session: otherSessionId })}
      </>
    );

    const { rerender } = render(<>{inlineViews}</>);
    act(() => window.setBounds({ width: 180, height: 240 }));
    rerender(
      <>
        {inlineViews}
        {pipSubscriber(call, window)}
      </>,
    );
    expect(dimensionOf(call)).toEqual({ width: 180, height: 240 });

    // the dominant speaker changes: the bounds of the unchanged window now
    // drive the other participant, the previous one falls back to its tile
    rerender(
      <>
        {inlineViews}
        {pipSubscriber(call, window, { session: otherSessionId })}
      </>,
    );
    expect(dimensionOf(call)).toEqual({ width: 390, height: 725 });
    expect(dimensionOf(call, otherSessionId)).toEqual({
      width: 180,
      height: 240,
    });
  });

  it('transfers the demand when the selection switches to the screen share', () => {
    const call = joinedCall();
    const dimensions$ = inlineDimensions$({ width: 390, height: 725 });
    const screenShareDimensions$ = inlineDimensions$({
      width: 300,
      height: 200,
    });
    const window = getIosPipVideoDemand(call).claimWindow();

    const inlineViews = (
      <>
        {inlineSubscriber(call, dimensions$)}
        {inlineSubscriber(call, screenShareDimensions$, {
          trackType: 'screenShareTrack',
        })}
      </>
    );

    const { rerender } = render(<>{inlineViews}</>);
    act(() => window.setBounds({ width: 180, height: 240 }));
    rerender(
      <>
        {inlineViews}
        {pipSubscriber(call, window)}
      </>,
    );
    rerender(
      <>
        {inlineViews}
        {pipSubscriber(call, window, { trackType: 'screenShareTrack' })}
      </>,
    );

    expect(dimensionOf(call)).toEqual({ width: 390, height: 725 });
    expect(
      dimensionOf(call, sessionId, SfuModels.TrackType.SCREEN_SHARE),
    ).toEqual({ width: 180, height: 240 });
  });

  it('follows the publication of the track it renders', () => {
    const call = joinedCall();
    const window = getIosPipVideoDemand(call).claimWindow();

    render(pipSubscriber(call, window));
    act(() => window.setBounds({ width: 180, height: 240 }));
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

  it('does not reuse the bounds of a replaced window', () => {
    const call = joinedCall();
    const dimensions$ = inlineDimensions$({ width: 390, height: 725 });
    const demand = getIosPipVideoDemand(call);
    const window = demand.claimWindow();

    const { rerender } = render(
      <>
        {inlineSubscriber(call, dimensions$)}
        {pipSubscriber(call, window)}
      </>,
    );
    act(() => window.setBounds({ width: 180, height: 240 }));
    expect(dimensionOf(call)).toEqual({ width: 180, height: 240 });

    // the view is replaced: its window is disposed before the new one reports
    // its own bounds
    rerender(<>{inlineSubscriber(call, dimensions$)}</>);
    act(() => window.release());
    const replacementWindow = demand.claimWindow();
    rerender(
      <>
        {inlineSubscriber(call, dimensions$)}
        {pipSubscriber(call, replacementWindow)}
      </>,
    );

    expect(dimensionOf(call)).toEqual({ width: 390, height: 725 });
  });

  it('does not let a disposed window release the ownership of its replacement', () => {
    const call = joinedCall();
    const dimensions$ = inlineDimensions$({ width: 390, height: 725 });
    const demand = getIosPipVideoDemand(call);
    const window = demand.claimWindow();
    const replacementWindow = demand.claimWindow();

    // the replacement view mounts before the old one is unmounted
    const { rerender } = render(
      <>
        {inlineSubscriber(call, dimensions$)}
        {pipSubscriber(call, window)}
        {pipSubscriber(call, replacementWindow)}
      </>,
    );
    act(() => {
      window.setBounds({ width: 180, height: 240 });
      replacementWindow.setBounds({ width: 200, height: 300 });
    });
    expect(dimensionOf(call)).toEqual({ width: 200, height: 300 });

    rerender(
      <>
        {inlineSubscriber(call, dimensions$)}
        {pipSubscriber(call, replacementWindow)}
      </>,
    );
    act(() => window.release());

    act(() => dimensions$.next({ width: 390, height: 800 }));
    expect(dimensionOf(call)).toEqual({ width: 200, height: 300 });
  });

  it('keeps the picture in picture demand of another call untouched', () => {
    const client = mockClientWithUser({ id: 'test-user-id' });
    const remote = () =>
      mockParticipant({
        sessionId,
        publishedTracks: [SfuModels.TrackType.VIDEO],
      });
    // two Call objects of the same cid, as created by a rejoin
    const call = mockCall(client, [remote()]);
    const otherCall = mockCall(client, [remote()]);
    call.state.setCallingState(CallingState.JOINED);
    otherCall.state.setCallingState(CallingState.JOINED);

    const dimensions$ = inlineDimensions$({ width: 390, height: 725 });
    const otherDimensions$ = inlineDimensions$({ width: 390, height: 725 });
    const window = getIosPipVideoDemand(call).claimWindow();

    render(
      <>
        {inlineSubscriber(call, dimensions$)}
        {pipSubscriber(call, window)}
        {inlineSubscriber(otherCall, otherDimensions$)}
      </>,
    );
    act(() => window.setBounds({ width: 180, height: 240 }));

    expect(dimensionOf(call)).toEqual({ width: 180, height: 240 });
    expect(dimensionOf(otherCall)).toEqual({ width: 390, height: 725 });
  });

  it('requests the native window bounds again after a rejoin', () => {
    const call = joinedCall();
    const window = getIosPipVideoDemand(call).claimWindow();

    render(pipSubscriber(call, window));
    act(() => window.setBounds({ width: 180, height: 240 }));

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

  it('requests the video track with the view dimensions on Android', () => {
    Platform.OS = 'android';
    try {
      const call = joinedCall();
      const dimensions$ = inlineDimensions$();

      render(inlineSubscriber(call, dimensions$));

      act(() => dimensions$.next({ width: 200, height: 200 }));
      expect(dimensionOf(call)).toEqual({ width: 200, height: 200 });

      act(() => dimensions$.next({ width: 0, height: 0 }));
      expect(dimensionOf(call)).toBeUndefined();
    } finally {
      Platform.OS = 'ios';
    }
  });
});
