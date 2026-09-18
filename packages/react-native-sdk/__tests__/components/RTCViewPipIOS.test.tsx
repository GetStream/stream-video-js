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
const inlineLayout = { width: 390, height: 725 };
const pipBounds = { width: 180, height: 240 };

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

/** Drives the native events of the rendered picture in picture view. */
const pipView = () => {
  const props = screen.UNSAFE_getByType(RTCViewPipNative).props;
  return {
    change: (active: boolean) =>
      act(() => props.onPiPChange({ nativeEvent: { active } })),
    bounds: (width: number, height: number) =>
      act(() => props.onPiPBoundsChange({ nativeEvent: { width, height } })),
  };
};

const dimensions$ = (dimension?: SfuModels.VideoDimension) =>
  new BehaviorSubject<SfuModels.VideoDimension | undefined>(dimension);

const inlineSubscriber = (
  call: Call,
  inline$: BehaviorSubject<SfuModels.VideoDimension | undefined>,
  session = sessionId,
) => (
  <TrackSubscriber
    call={call}
    participantSessionId={session}
    trackType="videoTrack"
    isVisible={true}
    dimensions$={inline$}
  />
);

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
    'requests the native bounds instead of the hidden inline layout (%s)',
    (order) => {
      const call = joinedCall();
      const updates = mockSfuClient(call);
      const inline$ = dimensions$(inlineLayout);
      renderPip(call, inline$);
      settle();
      expect(dimensionOf(call)).toEqual(inlineLayout);

      if (order === 'start-first') {
        pipView().change(true);
        settle();
        // nothing to request until the window reports its bounds.
        expect(dimensionOf(call)).toEqual(inlineLayout);
      }
      pipView().bounds(pipBounds.width, pipBounds.height);
      if (order === 'bounds-first') pipView().change(true);
      settle();
      expect(dimensionOf(call)).toEqual(pipBounds);

      // the hidden inline layout can no longer overwrite the window.
      act(() => inline$.next({ width: 390, height: 800 }));
      settle();
      expect(dimensionOf(call)).toEqual(pipBounds);

      pipView().bounds(320, 180);
      settle();
      expect(dimensionOf(call)).toEqual({ width: 320, height: 180 });

      // leaving PiP hands the track back to the inline view in one update.
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

  it('transfers the demand between participants and clears a track without an inline view', () => {
    const call = joinedCall([
      remoteParticipant(),
      remoteParticipant({ sessionId: otherSessionId, videoStream: undefined }),
    ]);
    const updates = mockSfuClient(call);
    const inline$ = dimensions$(inlineLayout);
    renderPip(call, inline$);
    pipView().change(true);
    pipView().bounds(pipBounds.width, pipBounds.height);
    settle();
    expect(dimensionOf(call)).toEqual(pipBounds);
    expect(dimensionOf(call, otherSessionId)).toBeUndefined();

    const switchSpotlight = () => {
      act(() =>
        call.state.setParticipants((participants) =>
          [...participants].reverse(),
        ),
      );
      settle();
    };

    // the other participant has no inline view: it is subscribed from PiP only.
    switchSpotlight();
    expect(dimensionOf(call, otherSessionId)).toEqual(pipBounds);
    expect(dimensionOf(call)).toEqual(inlineLayout);

    // and dropped again when the window moves on.
    switchSpotlight();
    expect(dimensionOf(call)).toEqual(pipBounds);
    expect(dimensionOf(call, otherSessionId)).toBeUndefined();

    pipView().change(false);
    settle();
    expect(dimensionOf(call)).toEqual(inlineLayout);
    expect(updates).toHaveBeenLastCalledWith([
      expect.objectContaining({ sessionId, dimension: inlineLayout }),
    ]);
  });

  it('transfers the demand from the camera to the screen share track', () => {
    const call = joinedCall();
    mockSfuClient(call);
    const inline$ = dimensions$(inlineLayout);
    renderPip(call, inline$);
    pipView().change(true);
    pipView().bounds(pipBounds.width, pipBounds.height);
    settle();
    expect(dimensionOf(call)).toEqual(pipBounds);

    const publish = (...tracks: SfuModels.TrackType[]) => {
      act(() =>
        call.state.updateParticipant(sessionId, { publishedTracks: tracks }),
      );
      settle();
    };
    const screenShare = () =>
      dimensionOf(call, sessionId, SfuModels.TrackType.SCREEN_SHARE);

    publish(SfuModels.TrackType.VIDEO, SfuModels.TrackType.SCREEN_SHARE);
    expect(screenShare()).toEqual(pipBounds);
    expect(dimensionOf(call)).toEqual(inlineLayout);

    publish(SfuModels.TrackType.VIDEO);
    expect(dimensionOf(call)).toEqual(pipBounds);
    expect(screenShare()).toBeUndefined();
  });

  it('deduplicates lifecycle transitions and uses the latest callback', () => {
    const call = joinedCall();
    const firstCallback = jest.fn();
    const nextCallback = jest.fn();
    const { rerender } = renderPip(call, undefined, {
      onPiPChange: firstCallback,
    });
    pipView().change(true);
    pipView().change(true);
    pipView().bounds(pipBounds.width, pipBounds.height);
    pipView().bounds(320, 180);
    expect(firstCallback.mock.calls).toEqual([[true]]);
    expect(isInPiPMode$.getValue()).toBe(true);
    rerender(<RTCViewPipIOS onPiPChange={nextCallback} />);
    expect(dimensionOf(call)).toEqual({ width: 320, height: 180 });
    pipView().change(false);
    pipView().change(false);
    expect(nextCallback.mock.calls).toEqual([[false]]);
    expect(isInPiPMode$.getValue()).toBe(false);
  });

  it('creates no subscription for a local only picture in picture', () => {
    const call = joinedCall([
      mockParticipant({
        sessionId: 'local-session',
        isLocalParticipant: true,
        publishedTracks: [SfuModels.TrackType.VIDEO],
      }),
    ]);
    const updates = mockSfuClient(call);
    render(<RTCViewPipIOS includeLocalParticipantVideo={true} />, { call });
    pipView().change(true);
    pipView().bounds(pipBounds.width, pipBounds.height);
    settle();
    expect(call.trackSubscriptionManager.subscriptions).toHaveLength(0);
    expect(updates).not.toHaveBeenCalled();
  });

  it('gives the track back when the view is unmounted', () => {
    const call = joinedCall();
    mockSfuClient(call);
    const inline$ = dimensions$(inlineLayout);
    const { rerender } = renderPip(call, inline$);
    pipView().change(true);
    pipView().bounds(pipBounds.width, pipBounds.height);
    settle();
    expect(dimensionOf(call)).toEqual(pipBounds);

    rerender(<>{inlineSubscriber(call, inline$)}</>);
    settle();
    expect(dimensionOf(call)).toEqual(inlineLayout);
    expect(isInPiPMode$.getValue()).toBe(false);
  });

  it.each(['call.ended event', 'LEFT calling state'])(
    'gives the track back on %s and ignores later native events',
    (reason) => {
      const call = joinedCall();
      mockSfuClient(call);
      const onPiPChange = jest.fn();
      let endCall: (() => void) | undefined;
      const originalOn = call.on.bind(call);
      jest.spyOn(call, 'on').mockImplementation(((name: any, cb: any) => {
        if (name === 'call.ended') endCall = cb;
        return originalOn(name, cb);
      }) as typeof call.on);
      const inline$ = dimensions$(inlineLayout);
      renderPip(call, inline$, { onPiPChange });
      const view = pipView();
      view.change(true);
      view.bounds(pipBounds.width, pipBounds.height);
      settle();
      expect(dimensionOf(call)).toEqual(pipBounds);

      act(() => {
        if (reason === 'call.ended event') endCall?.();
        else call.state.setCallingState(CallingState.LEFT);
      });
      expect(isInPiPMode$.getValue()).toBe(false);
      expect(onPiPChange.mock.calls).toEqual([[true], [false]]);

      // the disposed window is not valid geometry anymore.
      act(() => call.state.setCallingState(CallingState.JOINED));
      view.change(true);
      view.bounds(400, 500);
      settle();
      expect(dimensionOf(call)).toEqual(inlineLayout);
      expect(onPiPChange).toHaveBeenCalledTimes(2);
    },
  );

  it('does not let a pending stop clear a restarted PiP subscription', () => {
    const call = joinedCall();
    renderPip(call);
    pipView().change(true);
    pipView().bounds(pipBounds.width, pipBounds.height);
    pipView().change(false);
    pipView().change(true);
    pipView().bounds(200, 300);
    settle();
    expect(dimensionOf(call)).toEqual({ width: 200, height: 300 });
  });

  it.each([false, true])(
    'releases PiP demand when both views unmount (inline first: %s)',
    (inlineFirst) => {
      const call = joinedCall();
      const updates = mockSfuClient(call);
      const inline = inlineSubscriber(call, dimensions$(inlineLayout));
      const { unmount } = render(
        <>
          {inlineFirst && inline}
          <RTCViewPipIOS />
          {!inlineFirst && inline}
        </>,
        { call },
      );
      pipView().change(true);
      pipView().bounds(pipBounds.width, pipBounds.height);
      settle();
      unmount();
      settle();
      expect(dimensionOf(call)).toBeUndefined();
      expect(updates).toHaveBeenLastCalledWith([]);
      expect(isInPiPMode$.getValue()).toBe(false);
    },
  );

  it('keeps the demand of each Call instance apart, even with the same cid', () => {
    const client = mockClientWithUser({ id: 'test-user-id' });
    const call = joinedCall([remoteParticipant()], client);
    const otherCall = joinedCall([remoteParticipant()], client);
    expect(otherCall.cid).toBe(call.cid);
    mockSfuClient(call);
    mockSfuClient(otherCall);
    const otherInline$ = dimensions$(inlineLayout);
    const { rerender } = render(
      <>
        <RTCViewPipIOS />
        {inlineSubscriber(otherCall, otherInline$)}
      </>,
      { call },
    );
    pipView().change(true);
    pipView().bounds(pipBounds.width, pipBounds.height);
    settle();
    expect(dimensionOf(call)).toEqual(pipBounds);
    expect(dimensionOf(otherCall)).toEqual(inlineLayout);

    rerender(<>{inlineSubscriber(otherCall, otherInline$)}</>);
    settle();
    expect(dimensionOf(otherCall)).toEqual(inlineLayout);
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
    first.bounds(pipBounds.width, pipBounds.height);
    rerender(content(nextCall));
    settle();
    expect(isInPiPMode$.getValue()).toBe(false);

    // events the replaced window queued before the switch are rejected.
    first.change(true);
    first.bounds(400, 500);
    expect(isInPiPMode$.getValue()).toBe(false);
    expect(dimensionOf(nextCall)).toBeUndefined();

    pipView().change(true);
    expect(dimensionOf(nextCall)).toBeUndefined();
    pipView().bounds(200, 300);
    expect(dimensionOf(nextCall)).toEqual({ width: 200, height: 300 });
    expect(dimensionOf(call)).toBeUndefined();
  });
});
