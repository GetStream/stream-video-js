import React from 'react';
import { UIManager } from 'react-native';
import { act } from '@testing-library/react-native';
import {
  type Call,
  CallingState,
  DebounceType,
  SfuModels,
  type StreamVideoParticipant,
} from '@stream-io/video-client';
import { BehaviorSubject } from 'rxjs';
import { StreamCallProvider } from '@stream-io/video-react-bindings';
import { render, screen } from '../utils/RNTLTools';
import { RTCViewPipIOS } from '../../src/components/Call/CallContent/RTCViewPipIOS';
import { RTCViewPipNative } from '../../src/components/Call/CallContent/RTCViewPipNative';
import TrackSubscriber from '../../src/components/Participant/ParticipantView/VideoRenderer/TrackSubscriber';
import { isInPiPMode$ } from '../../src/utils/internal/rxSubjects';
import mockParticipant from '../mocks/participant';
import { mockCall } from '../mocks/call';
import { mockClientWithUser } from '../mocks/client';

jest.useFakeTimers();

// the view manager only exists in a real app; the commands the component
// dispatches to it are irrelevant to the subscription demand under test.
jest.spyOn(UIManager, 'getViewManagerConfig').mockReturnValue({
  Commands: { onCallClosed: 1, setPreferredContentSize: 2 },
} as any);

const sessionId = 'remote-session-1';
const otherSessionId = 'remote-session-2';

const remoteParticipant = (custom?: Partial<StreamVideoParticipant>) =>
  mockParticipant({
    sessionId,
    publishedTracks: [SfuModels.TrackType.VIDEO],
    ...custom,
  });

const joinedCall = (
  participants: StreamVideoParticipant[] = [remoteParticipant()],
  client = mockClientWithUser({ id: 'test-user-id' }),
): Call => {
  const call = mockCall(client, participants);
  call.state.setCallingState(CallingState.JOINED);
  return call;
};

/** Counts the subscription updates actually sent to the SFU. */
const mockSfuClient = (call: Call) => {
  const updateSubscriptions = jest.fn().mockResolvedValue({});
  call.trackSubscriptionManager.setSfuClient({ updateSubscriptions } as any);
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

/** Drives the native events of one rendered picture in picture view. */
const pipView = (index = 0) => {
  const view = screen.UNSAFE_getAllByType(RTCViewPipNative).at(index);
  if (!view) throw new Error(`no picture in picture view at index ${index}`);
  const props = view.props;
  return {
    props,
    change: (active: boolean) =>
      act(() => props.onPiPChange({ nativeEvent: { active } })),
    bounds: (width: number, height: number) =>
      act(() => props.onPiPBoundsChange({ nativeEvent: { width, height } })),
  };
};

const inlineSubscriber = (
  call: Call,
  dimensions$: BehaviorSubject<SfuModels.VideoDimension | undefined>,
  session = sessionId,
) => (
  <TrackSubscriber
    call={call}
    participantSessionId={session}
    trackType="videoTrack"
    isVisible={true}
    dimensions$={dimensions$}
  />
);

const dimensions$ = (dimension?: SfuModels.VideoDimension) =>
  new BehaviorSubject<SfuModels.VideoDimension | undefined>(dimension);

const renderPip = (
  call: Call,
  inline$?: BehaviorSubject<SfuModels.VideoDimension | undefined>,
  props: React.ComponentProps<typeof RTCViewPipIOS> = {},
) =>
  render(
    <>
      <RTCViewPipIOS {...props} />
      {inline$ && inlineSubscriber(call, inline$)}
    </>,
    { call },
  );

/** Lets the debounced participant selection and the debounced apply run. */
const settle = () => act(() => jest.advanceTimersByTime(1000));

describe('RTCViewPipIOS', () => {
  beforeEach(() => {
    isInPiPMode$.next(false);
  });

  it.each(['start-first', 'bounds-first'])(
    'keeps native bounds through hidden layout and resize (%s)',
    (order) => {
      const call = joinedCall();
      const updates = mockSfuClient(call);
      const inline$ = dimensions$({ width: 390, height: 725 });

      renderPip(call, inline$);
      settle();
      expect(dimensionOf(call)).toEqual({ width: 390, height: 725 });

      if (order === 'start-first') pipView().change(true);
      pipView().bounds(180, 240);
      if (order === 'bounds-first') pipView().change(true);
      settle();

      // Native events already contain validated, truncated logical points.
      expect(dimensionOf(call)).toEqual({ width: 180, height: 240 });

      act(() => inline$.next({ width: 390, height: 800 }));
      settle();
      expect(dimensionOf(call)).toEqual({ width: 180, height: 240 });

      pipView().bounds(320, 180);
      settle();
      expect(dimensionOf(call)).toEqual({ width: 320, height: 180 });
      updates.mockClear();
      pipView().change(false);
      settle();
      expect(dimensionOf(call)).toEqual({ width: 390, height: 800 });
      expect(updates).toHaveBeenCalledTimes(1);
      expect(updates).toHaveBeenLastCalledWith([
        expect.objectContaining({ dimension: { width: 390, height: 800 } }),
      ]);
    },
  );

  it.each([false, true])(
    'waits for native bounds (inline mounted: %s)',
    (withInline) => {
      const call = joinedCall();
      const updates = mockSfuClient(call);
      const inline$ = withInline
        ? dimensions$({ width: 390, height: 725 })
        : undefined;
      renderPip(call, inline$);
      settle();
      const sent = updates.mock.calls.length;
      pipView().change(true);
      act(() => inline$?.next({ width: 390, height: 900 }));
      settle();
      expect(dimensionOf(call)).toEqual(
        withInline ? { width: 390, height: 725 } : undefined,
      );
      expect(updates).toHaveBeenCalledTimes(sent);
    },
  );

  it('subscribes without an inline tile or stream and clears the previous selection', () => {
    const call = joinedCall([
      remoteParticipant({ videoStream: undefined }),
      remoteParticipant({ sessionId: otherSessionId, videoStream: undefined }),
    ]);
    const updates = mockSfuClient(call);
    renderPip(call);
    pipView().change(true);
    pipView().bounds(180, 240);
    expect(dimensionOf(call)).toEqual({ width: 180, height: 240 });
    act(() =>
      call.state.setParticipants((participants) => [...participants].reverse()),
    );
    settle();
    expect(dimensionOf(call)).toBeUndefined();
    expect(dimensionOf(call, otherSessionId)).toEqual({
      width: 180,
      height: 240,
    });
    pipView().change(false);
    settle();
    expect(updates).toHaveBeenLastCalledWith([]);
  });

  it('deduplicates lifecycle transitions and uses the latest callback', () => {
    const call = joinedCall();
    const firstCallback = jest.fn();
    const nextCallback = jest.fn();
    const { rerender } = renderPip(call, undefined, {
      onPiPChange: firstCallback,
    });
    const view = pipView();
    view.change(true);
    view.change(true);
    view.bounds(180, 240);
    view.bounds(320, 180);
    expect(firstCallback.mock.calls).toEqual([[true]]);
    expect(isInPiPMode$.getValue()).toBe(true);
    rerender(<RTCViewPipIOS onPiPChange={nextCallback} />);
    expect(dimensionOf(call)).toEqual({ width: 320, height: 180 });
    pipView().change(false);
    pipView().change(false);
    expect(nextCallback.mock.calls).toEqual([[false]]);
    expect(isInPiPMode$.getValue()).toBe(false);
  });

  it('transfers the demand between participants with the same window bounds', () => {
    const call = joinedCall([
      remoteParticipant(),
      remoteParticipant({ sessionId: otherSessionId }),
    ]);
    mockSfuClient(call);
    const inline$ = dimensions$({ width: 390, height: 725 });
    const otherInline$ = dimensions$({ width: 200, height: 100 });

    render(
      <>
        <RTCViewPipIOS />
        {inlineSubscriber(call, inline$)}
        {inlineSubscriber(call, otherInline$, otherSessionId)}
      </>,
      { call },
    );
    pipView().change(true);
    pipView().bounds(180, 240);
    settle();

    expect(dimensionOf(call)).toEqual({ width: 180, height: 240 });
    expect(dimensionOf(call, otherSessionId)).toEqual({
      width: 200,
      height: 100,
    });

    act(() => {
      call.state.setParticipants((participants) => [...participants].reverse());
    });
    settle();

    expect(dimensionOf(call, otherSessionId)).toEqual({
      width: 180,
      height: 240,
    });
    expect(dimensionOf(call)).toEqual({ width: 390, height: 725 });
  });

  it('transfers the demand from the camera to the screen share track', () => {
    const call = joinedCall();
    mockSfuClient(call);
    const inline$ = dimensions$({ width: 390, height: 725 });

    renderPip(call, inline$);
    pipView().change(true);
    pipView().bounds(180, 240);
    settle();
    expect(dimensionOf(call)).toEqual({ width: 180, height: 240 });

    act(() => {
      call.state.updateParticipant(sessionId, {
        publishedTracks: [
          SfuModels.TrackType.VIDEO,
          SfuModels.TrackType.SCREEN_SHARE,
        ],
      });
    });
    settle();

    expect(
      dimensionOf(call, sessionId, SfuModels.TrackType.SCREEN_SHARE),
    ).toEqual({ width: 180, height: 240 });
    expect(dimensionOf(call)).toEqual({ width: 390, height: 725 });
    act(() =>
      call.state.updateParticipant(sessionId, {
        publishedTracks: [SfuModels.TrackType.VIDEO],
      }),
    );
    settle();
    expect(dimensionOf(call)).toEqual({ width: 180, height: 240 });
    expect(
      dimensionOf(call, sessionId, SfuModels.TrackType.SCREEN_SHARE),
    ).toBeUndefined();
  });

  it('creates no subscription for a local only picture in picture', () => {
    const call = joinedCall([
      mockParticipant({
        sessionId: 'local-session',
        isLocalParticipant: true,
        publishedTracks: [SfuModels.TrackType.VIDEO],
      }),
    ]);
    const updateSubscriptions = mockSfuClient(call);

    render(<RTCViewPipIOS includeLocalParticipantVideo={true} />, { call });
    pipView().change(true);
    pipView().bounds(180, 240);
    settle();

    expect(call.trackSubscriptionManager.subscriptions).toHaveLength(0);
    expect(updateSubscriptions).not.toHaveBeenCalled();
  });

  it('gives the track back when the view is unmounted', () => {
    const call = joinedCall();
    mockSfuClient(call);
    const inline$ = dimensions$({ width: 390, height: 725 });

    const { rerender } = renderPip(call, inline$);
    pipView().change(true);
    pipView().bounds(180, 240);
    settle();
    expect(dimensionOf(call)).toEqual({ width: 180, height: 240 });

    rerender(<>{inlineSubscriber(call, inline$)}</>);
    settle();

    expect(dimensionOf(call)).toEqual({ width: 390, height: 725 });
    expect(isInPiPMode$.getValue()).toBe(false);
  });

  it('gives the track back when the call is left', () => {
    const call = joinedCall();
    mockSfuClient(call);
    const inline$ = dimensions$({ width: 390, height: 725 });

    renderPip(call, inline$);
    const view = pipView();
    view.change(true);
    view.bounds(180, 240);
    settle();
    expect(dimensionOf(call)).toEqual({ width: 180, height: 240 });

    act(() => call.state.setCallingState(CallingState.LEFT));
    expect(isInPiPMode$.getValue()).toBe(false);
    act(() => call.state.setCallingState(CallingState.JOINED));
    // the disposed window is not valid geometry anymore.
    view.bounds(200, 300);
    settle();

    expect(dimensionOf(call)).toEqual({ width: 390, height: 725 });
  });

  it('does not let a replaced window resurrect its bounds', () => {
    const call = joinedCall();
    mockSfuClient(call);
    const inline$ = dimensions$({ width: 390, height: 725 });

    const { rerender } = render(
      <>
        <RTCViewPipIOS key="first" />
        {inlineSubscriber(call, inline$)}
      </>,
      { call },
    );

    pipView().change(true);
    pipView().bounds(180, 240);
    settle();
    expect(dimensionOf(call)).toEqual({ width: 180, height: 240 });

    rerender(
      <>
        <RTCViewPipIOS key="second" />
        {inlineSubscriber(call, inline$)}
      </>,
    );
    settle();

    pipView().change(true);
    settle();
    expect(dimensionOf(call)).toEqual({ width: 390, height: 725 });

    pipView().bounds(200, 300);
    settle();
    expect(dimensionOf(call)).toEqual({ width: 200, height: 300 });
  });

  it('leaves another call with the same cid alone', () => {
    const client = mockClientWithUser({ id: 'test-user-id' });
    const call = joinedCall([remoteParticipant()], client);
    const otherCall = joinedCall([remoteParticipant()], client);
    expect(otherCall.cid).toBe(call.cid);
    mockSfuClient(call);
    mockSfuClient(otherCall);
    const otherInline$ = dimensions$({ width: 390, height: 725 });

    const { rerender } = render(
      <>
        <RTCViewPipIOS />
        {inlineSubscriber(otherCall, otherInline$)}
      </>,
      { call },
    );
    pipView().change(true);
    pipView().bounds(180, 240);
    settle();

    expect(dimensionOf(call)).toEqual({ width: 180, height: 240 });
    expect(dimensionOf(otherCall)).toEqual({ width: 390, height: 725 });

    rerender(<>{inlineSubscriber(otherCall, otherInline$)}</>);
    settle();
    expect(dimensionOf(otherCall)).toEqual({ width: 390, height: 725 });
  });

  it('starts with fresh bounds when the provider replaces a call with the same cid', () => {
    const call = joinedCall();
    const nextCall = joinedCall();
    expect(nextCall.cid).toBe(call.cid);
    const content = (current: Call) => (
      <StreamCallProvider call={current}>
        <RTCViewPipIOS />
      </StreamCallProvider>
    );
    const { rerender } = render(content(call), { call });
    const first = pipView();
    first.change(true);
    first.bounds(180, 240);
    rerender(content(nextCall));
    settle();
    expect(isInPiPMode$.getValue()).toBe(false);
    first.bounds(400, 500);
    pipView().change(true);
    expect(dimensionOf(nextCall)).toBeUndefined();
    pipView().bounds(200, 300);
    expect(dimensionOf(nextCall)).toEqual({ width: 200, height: 300 });
    expect(dimensionOf(call)).toBeUndefined();
  });

  it('does not let a pending stop clear a restarted PiP subscription', () => {
    const call = joinedCall();
    renderPip(call);
    pipView().change(true);
    pipView().bounds(180, 240);
    pipView().change(false);
    pipView().change(true);
    pipView().bounds(200, 300);
    settle();
    expect(dimensionOf(call)).toEqual({ width: 200, height: 300 });
  });

  it('clears PiP on call end and ignores subsequent native events', () => {
    const call = joinedCall();
    const onPiPChange = jest.fn();
    let endCall: (() => void) | undefined;
    const originalOn = call.on.bind(call);
    jest.spyOn(call, 'on').mockImplementation(((name: any, callback: any) => {
      if (name === 'call.ended') endCall = callback;
      return originalOn(name, callback);
    }) as typeof call.on);
    render(<RTCViewPipIOS onPiPChange={onPiPChange} />, { call });
    const view = pipView();
    view.change(true);
    view.bounds(180, 240);
    act(() => endCall?.());
    view.change(true);
    view.bounds(400, 500);
    settle();
    expect(isInPiPMode$.getValue()).toBe(false);
    expect(dimensionOf(call)).toBeUndefined();
    expect(onPiPChange.mock.calls).toEqual([[true], [false]]);
  });

  it.each([false, true])(
    'releases PiP demand when both views unmount (inline first: %s)',
    (inlineFirst) => {
      const call = joinedCall();
      const updateSubscriptions = mockSfuClient(call);
      const inline$ = dimensions$({ width: 390, height: 725 });
      const inline = inlineSubscriber(call, inline$);
      const { unmount } = render(
        <>
          {inlineFirst && inline}
          <RTCViewPipIOS />
          {!inlineFirst && inline}
        </>,
        { call },
      );
      pipView().change(true);
      pipView().bounds(180, 240);
      settle();
      unmount();
      settle();
      expect(dimensionOf(call)).toBeUndefined();
      expect(updateSubscriptions).toHaveBeenLastCalledWith([]);
      expect(isInPiPMode$.getValue()).toBe(false);
    },
  );

  it('preserves camera override precedence and resumes automatic bounds when cleared', () => {
    const call = joinedCall();
    const updateSubscriptions = mockSfuClient(call);
    render(<RTCViewPipIOS />, { call });
    pipView().change(true);
    pipView().bounds(180, 240);
    const globalResolution = { width: 640, height: 360 };
    const sessionResolution = { width: 1280, height: 720 };
    act(() => call.setPreferredIncomingVideoResolution(globalResolution));
    expect(dimensionOf(call)).toEqual(globalResolution);
    act(() =>
      call.setPreferredIncomingVideoResolution(sessionResolution, [sessionId]),
    );
    expect(dimensionOf(call)).toEqual(sessionResolution);
    act(() => call.setIncomingVideoEnabled(false));
    expect(dimensionOf(call)).toBeUndefined();
    act(() =>
      call.setPreferredIncomingVideoResolution(sessionResolution, [sessionId]),
    );
    expect(dimensionOf(call)).toEqual(sessionResolution);
    act(() => call.setPreferredIncomingVideoResolution(undefined, [sessionId]));
    pipView().bounds(200, 300);
    expect(dimensionOf(call)).toBeUndefined();
    act(() => call.setIncomingVideoEnabled(true));
    act(() => jest.advanceTimersByTime(DebounceType.SLOW));
    expect(dimensionOf(call)).toEqual({ width: 200, height: 300 });
    expect(updateSubscriptions).toHaveBeenLastCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          sessionId,
          dimension: { width: 200, height: 300 },
        }),
      ]),
    );
  });

  it('does not apply camera overrides to screen share demand', () => {
    const call = joinedCall([
      remoteParticipant({
        publishedTracks: [SfuModels.TrackType.SCREEN_SHARE],
      }),
    ]);
    render(<RTCViewPipIOS />, { call });
    act(() => call.setIncomingVideoEnabled(false));
    pipView().change(true);
    pipView().bounds(180, 240);
    expect(
      dimensionOf(call, sessionId, SfuModels.TrackType.SCREEN_SHARE),
    ).toEqual({ width: 180, height: 240 });
    act(() =>
      call.setPreferredIncomingVideoResolution({ width: 1280, height: 720 }),
    );
    expect(
      dimensionOf(call, sessionId, SfuModels.TrackType.SCREEN_SHARE),
    ).toEqual({ width: 180, height: 240 });
  });
});
