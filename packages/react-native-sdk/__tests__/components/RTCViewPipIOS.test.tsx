import React from 'react';
import { UIManager } from 'react-native';
import { act } from '@testing-library/react-native';
import {
  type Call,
  CallingState,
  SfuModels,
  type StreamVideoParticipant,
} from '@stream-io/video-client';
import { BehaviorSubject } from 'rxjs';
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
    identity: props.pipIdentity as string,
    change: (active: boolean, identity: string = props.pipIdentity) =>
      act(() => props.onPiPChange({ nativeEvent: { active, identity } })),
    bounds: (
      width: number,
      height: number,
      identity: string = props.pipIdentity,
    ) =>
      act(() =>
        props.onPiPBoundsChange({ nativeEvent: { width, height, identity } }),
      ),
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

/** Lets the debounced participant selection and the debounced apply run. */
const settle = () => act(() => jest.advanceTimersByTime(1000));

describe('RTCViewPipIOS', () => {
  beforeEach(() => {
    isInPiPMode$.next(false);
  });

  it('keeps the native window bounds while the hidden inline layout grows', () => {
    const call = joinedCall();
    const updateSubscriptions = mockSfuClient(call);
    const inline$ = dimensions$({ width: 390, height: 725 });

    render(
      <>
        <RTCViewPipIOS />
        {inlineSubscriber(call, inline$)}
      </>,
      { call },
    );
    settle();
    expect(dimensionOf(call)).toEqual({ width: 390, height: 725 });

    pipView().change(true);
    pipView().bounds(180.6, 240.2);
    settle();

    // truncated logical points, no pixel ratio and no fit calculation.
    expect(dimensionOf(call)).toEqual({ width: 180, height: 240 });

    // the inline tile keeps laying out behind the window; it must not win.
    act(() => inline$.next({ width: 390, height: 800 }));
    settle();
    expect(dimensionOf(call)).toEqual({ width: 180, height: 240 });

    // the window is resized by the user.
    pipView().bounds(320, 180);
    settle();
    expect(dimensionOf(call)).toEqual({ width: 320, height: 180 });

    const sent = updateSubscriptions.mock.calls.length;
    // repeated and unusable bounds neither drop nor re-request the track.
    pipView().bounds(320, 180);
    pipView().bounds(0, 180);
    pipView().bounds(-320, 180);
    pipView().bounds(Number.NaN, 180);
    settle();
    expect(dimensionOf(call)).toEqual({ width: 320, height: 180 });
    expect(updateSubscriptions).toHaveBeenCalledTimes(sent);
  });

  it('restores the latest inline demand when the window stops, without a new layout', () => {
    const call = joinedCall();
    mockSfuClient(call);
    const inline$ = dimensions$({ width: 390, height: 725 });

    render(
      <>
        <RTCViewPipIOS />
        {inlineSubscriber(call, inline$)}
      </>,
      { call },
    );
    pipView().change(true);
    pipView().bounds(180, 240);
    settle();
    expect(dimensionOf(call)).toEqual({ width: 180, height: 240 });

    // the tile behind the window was laid out again while it was masked.
    act(() => inline$.next({ width: 390, height: 800 }));
    settle();

    pipView().change(false);
    settle();

    // restored from the cached inline demand, no new onLayout was needed.
    expect(dimensionOf(call)).toEqual({ width: 390, height: 800 });
  });

  it('retains the current demand while the window is active without bounds', () => {
    const call = joinedCall();
    const updateSubscriptions = mockSfuClient(call);
    const inline$ = dimensions$({ width: 390, height: 725 });

    render(
      <>
        <RTCViewPipIOS />
        {inlineSubscriber(call, inline$)}
      </>,
      { call },
    );
    settle();
    const sent = updateSubscriptions.mock.calls.length;

    pipView().change(true);
    // the hidden inline tile reports a much larger layout before any bounds.
    act(() => inline$.next({ width: 390, height: 900 }));
    settle();

    expect(dimensionOf(call)).toEqual({ width: 390, height: 725 });
    expect(updateSubscriptions).toHaveBeenCalledTimes(sent);
  });

  it('requests nothing before the window reports any geometry', () => {
    const call = joinedCall();
    const updateSubscriptions = mockSfuClient(call);

    render(<RTCViewPipIOS />, { call });
    pipView().change(true);
    settle();

    expect(dimensionOf(call)).toBeUndefined();
    expect(updateSubscriptions).not.toHaveBeenCalled();
  });

  it('subscribes to a selected track that has no inline tile and no stream yet', () => {
    // the participant is published but its media stream has not arrived: the
    // window must still be able to ask for it, otherwise it never renders.
    const call = joinedCall([remoteParticipant({ videoStream: undefined })]);
    mockSfuClient(call);

    render(<RTCViewPipIOS />, { call });
    pipView().change(true);
    pipView().bounds(180, 240);
    settle();

    expect(dimensionOf(call)).toEqual({ width: 180, height: 240 });
  });

  it('unsubscribes a window-only track when the window stops', () => {
    const call = joinedCall();
    mockSfuClient(call);

    render(<RTCViewPipIOS />, { call });
    pipView().change(true);
    pipView().bounds(180, 240);
    settle();
    expect(dimensionOf(call)).toEqual({ width: 180, height: 240 });

    pipView().change(false);
    settle();

    expect(dimensionOf(call)).toBeUndefined();
  });

  it('ignores the lifecycle and geometry events of a replaced view', () => {
    const call = joinedCall();
    mockSfuClient(call);
    const onPiPChange = jest.fn();
    const inline$ = dimensions$({ width: 390, height: 725 });

    render(
      <>
        <RTCViewPipIOS onPiPChange={onPiPChange} />
        {inlineSubscriber(call, inline$)}
      </>,
      { call },
    );
    settle();

    pipView().change(true, 'pip-of-a-replaced-view');
    pipView().bounds(180, 240, 'pip-of-a-replaced-view');
    settle();

    expect(dimensionOf(call)).toEqual({ width: 390, height: 725 });
    expect(onPiPChange).not.toHaveBeenCalled();
    expect(isInPiPMode$.getValue()).toBe(false);
  });

  it('reports the lifecycle once per transition and never for a resize', () => {
    const call = joinedCall();
    mockSfuClient(call);
    const onPiPChange = jest.fn();

    render(<RTCViewPipIOS onPiPChange={onPiPChange} />, { call });

    pipView().change(true);
    expect(onPiPChange).toHaveBeenCalledWith(true);
    expect(isInPiPMode$.getValue()).toBe(true);

    pipView().bounds(180, 240);
    pipView().bounds(320, 180);
    expect(onPiPChange).toHaveBeenCalledTimes(1);

    pipView().change(false);
    expect(onPiPChange).toHaveBeenCalledTimes(2);
    expect(onPiPChange).toHaveBeenLastCalledWith(false);
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
    // the participant the window does not render keeps its inline demand.
    expect(dimensionOf(call, otherSessionId)).toEqual({
      width: 200,
      height: 100,
    });

    // the other participant becomes the dominant speaker the window renders.
    act(() => {
      call.state.setParticipants((participants) => [...participants].reverse());
    });
    settle();

    // the new selection reuses the bounds of the unchanged window.
    expect(dimensionOf(call, otherSessionId)).toEqual({
      width: 180,
      height: 240,
    });
    // the previous selection goes back to its own inline tile.
    expect(dimensionOf(call)).toEqual({ width: 390, height: 725 });
  });

  it('transfers the demand from the camera to the screen share track', () => {
    const call = joinedCall();
    mockSfuClient(call);
    const inline$ = dimensions$({ width: 390, height: 725 });

    render(
      <>
        <RTCViewPipIOS />
        {inlineSubscriber(call, inline$)}
      </>,
      { call },
    );
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

    const { rerender } = render(
      <>
        <RTCViewPipIOS />
        {inlineSubscriber(call, inline$)}
      </>,
      { call },
    );
    pipView().change(true);
    pipView().bounds(180, 240);
    settle();
    expect(dimensionOf(call)).toEqual({ width: 180, height: 240 });

    rerender(<>{inlineSubscriber(call, inline$)}</>);
    settle();

    expect(dimensionOf(call)).toEqual({ width: 390, height: 725 });
  });

  it('gives the track back when the call is left', () => {
    const call = joinedCall();
    mockSfuClient(call);
    const inline$ = dimensions$({ width: 390, height: 725 });

    render(
      <>
        <RTCViewPipIOS />
        {inlineSubscriber(call, inline$)}
      </>,
      { call },
    );
    const view = pipView();
    view.change(true);
    view.bounds(180, 240);
    settle();
    expect(dimensionOf(call)).toEqual({ width: 180, height: 240 });

    act(() => call.state.setCallingState(CallingState.LEFT));
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
    const firstIdentity = pipView().identity;
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
    expect(pipView().identity).not.toBe(firstIdentity);

    // the replacement starts before its own window is laid out.
    pipView().change(true);
    settle();
    expect(dimensionOf(call)).toEqual({ width: 390, height: 725 });

    pipView().bounds(200, 300);
    settle();
    expect(dimensionOf(call)).toEqual({ width: 200, height: 300 });
  });

  it('protects the ownership and the mode of a newer view from an older one', () => {
    const call = joinedCall();
    mockSfuClient(call);
    const inline$ = dimensions$({ width: 390, height: 725 });
    const onPiPChange = jest.fn();

    const { rerender } = render(
      <>
        <RTCViewPipIOS key="first" onPiPChange={onPiPChange} />
        {inlineSubscriber(call, inline$)}
      </>,
      { call },
    );
    const first = pipView();
    first.change(true);
    first.bounds(180, 240);
    settle();

    rerender(
      <>
        <RTCViewPipIOS key="first" onPiPChange={onPiPChange} />
        <RTCViewPipIOS key="second" onPiPChange={onPiPChange} />
        {inlineSubscriber(call, inline$)}
      </>,
    );
    const second = pipView(1);
    second.change(true);
    second.bounds(200, 300);
    settle();
    expect(dimensionOf(call)).toEqual({ width: 200, height: 300 });

    // the older view stops and is torn down.
    first.change(false);
    rerender(
      <>
        <RTCViewPipIOS key="second" onPiPChange={onPiPChange} />
        {inlineSubscriber(call, inline$)}
      </>,
    );
    settle();

    expect(dimensionOf(call)).toEqual({ width: 200, height: 300 });
    expect(isInPiPMode$.getValue()).toBe(true);
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

    // closing the window of one call does not touch the other one.
    rerender(<>{inlineSubscriber(otherCall, otherInline$)}</>);
    settle();
    expect(dimensionOf(otherCall)).toEqual({ width: 390, height: 725 });
  });
});
