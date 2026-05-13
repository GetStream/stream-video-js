import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fromPartial } from '@total-typescript/shoehorn';
import { TrackSubscriptionManager } from '../TrackSubscriptionManager';
import { CallState } from '../../store';
import { Tracer } from '../../stats';
import { DebounceType } from '../../types';
import { TrackType } from '../../gen/video/sfu/models/models';
import type { StreamSfuClient } from '../../StreamSfuClient';

describe('TrackSubscriptionManager', () => {
  let state: CallState;
  let tracer: Tracer;
  let manager: TrackSubscriptionManager;
  let updateSubscriptions: ReturnType<typeof vi.fn>;
  let sfuClient: Pick<StreamSfuClient, 'updateSubscriptions'>;

  const addParticipant = (
    sessionId: string,
    overrides: Partial<{
      userId: string;
      publishedTracks: TrackType[];
      videoDimension: { width: number; height: number };
      screenShareDimension: { width: number; height: number };
      isLocalParticipant: boolean;
    }> = {},
  ) => {
    state.updateOrAddParticipant(
      sessionId,
      fromPartial({
        sessionId,
        userId: overrides.userId ?? `user-${sessionId}`,
        publishedTracks: overrides.publishedTracks ?? [],
        videoDimension: overrides.videoDimension,
        screenShareDimension: overrides.screenShareDimension,
        isLocalParticipant: overrides.isLocalParticipant,
      }),
    );
  };

  beforeEach(() => {
    state = new CallState();
    tracer = new Tracer('test');
    manager = new TrackSubscriptionManager(state, tracer);
    updateSubscriptions = vi.fn().mockResolvedValue(undefined);
    sfuClient = { updateSubscriptions };
    manager.setSfuClient(sfuClient as StreamSfuClient);
  });

  // ---------------------------------------------------------------------
  // subscriptions getter
  // ---------------------------------------------------------------------

  it('subscriptions returns empty for a call with no remote participants', () => {
    expect(manager.subscriptions).toEqual([]);
  });

  it('subscriptions returns one VIDEO entry per published remote video track, skipping the local participant', () => {
    addParticipant('local', {
      isLocalParticipant: true,
      publishedTracks: [TrackType.VIDEO],
      videoDimension: { width: 640, height: 480 },
    });
    addParticipant('remote-a', {
      publishedTracks: [TrackType.VIDEO],
      videoDimension: { width: 320, height: 240 },
    });
    addParticipant('remote-b', {
      publishedTracks: [TrackType.VIDEO],
      videoDimension: { width: 1280, height: 720 },
    });

    const subs = manager.subscriptions;
    expect(subs).toHaveLength(2);
    expect(subs.every((s) => s.sessionId !== 'local')).toBe(true);
    expect(subs.map((s) => s.trackType)).toEqual([
      TrackType.VIDEO,
      TrackType.VIDEO,
    ]);
    expect(subs.find((s) => s.sessionId === 'remote-a')?.dimension).toEqual({
      width: 320,
      height: 240,
    });
  });

  it('subscriptions includes SCREEN_SHARE + SCREEN_SHARE_AUDIO entries when published', () => {
    addParticipant('presenter', {
      publishedTracks: [
        TrackType.VIDEO,
        TrackType.SCREEN_SHARE,
        TrackType.SCREEN_SHARE_AUDIO,
      ],
      videoDimension: { width: 320, height: 240 },
      screenShareDimension: { width: 1920, height: 1080 },
    });

    const subs = manager.subscriptions;
    expect(subs).toHaveLength(3);
    const trackTypes = new Set(subs.map((s) => s.trackType));
    expect(trackTypes.has(TrackType.VIDEO)).toBe(true);
    expect(trackTypes.has(TrackType.SCREEN_SHARE)).toBe(true);
    expect(trackTypes.has(TrackType.SCREEN_SHARE_AUDIO)).toBe(true);
  });

  // ---------------------------------------------------------------------
  // setOverrides
  // ---------------------------------------------------------------------

  it('applies a global override with a preferred dimension to every remote video subscription', () => {
    addParticipant('a', {
      publishedTracks: [TrackType.VIDEO],
      videoDimension: { width: 320, height: 240 },
    });
    addParticipant('b', {
      publishedTracks: [TrackType.VIDEO],
      videoDimension: { width: 320, height: 240 },
    });

    manager.setOverrides({
      enabled: true,
      dimension: { width: 1280, height: 720 },
    });

    const subs = manager.subscriptions;
    expect(subs).toHaveLength(2);
    expect(subs.every((s) => s.dimension?.width === 1280)).toBe(true);
    expect(subs.every((s) => s.dimension?.height === 720)).toBe(true);
  });

  it('applies a per-session override only to listed participants', () => {
    addParticipant('a', {
      publishedTracks: [TrackType.VIDEO],
      videoDimension: { width: 320, height: 240 },
    });
    addParticipant('b', {
      publishedTracks: [TrackType.VIDEO],
      videoDimension: { width: 320, height: 240 },
    });

    manager.setOverrides(
      { enabled: true, dimension: { width: 1280, height: 720 } },
      ['a'],
    );

    const subs = manager.subscriptions;
    const a = subs.find((s) => s.sessionId === 'a');
    const b = subs.find((s) => s.sessionId === 'b');
    expect(a?.dimension).toEqual({ width: 1280, height: 720 });
    expect(b?.dimension).toEqual({ width: 320, height: 240 });
  });

  it('drops video from the subscription list when the override sets enabled=false globally', () => {
    addParticipant('a', {
      publishedTracks: [TrackType.VIDEO],
      videoDimension: { width: 320, height: 240 },
    });

    manager.setOverrides({ enabled: false });

    expect(manager.subscriptions).toEqual([]);
  });

  // ---------------------------------------------------------------------
  // apply(): debouncing + SFU push
  // ---------------------------------------------------------------------

  it('apply() debounces rapid calls into one SFU RPC with the exact subscription payload', () => {
    vi.useFakeTimers();
    addParticipant('a', {
      publishedTracks: [TrackType.VIDEO],
      videoDimension: { width: 320, height: 240 },
    });

    manager.apply(DebounceType.FAST);
    manager.apply(DebounceType.FAST);
    manager.apply(DebounceType.FAST);

    expect(updateSubscriptions).not.toHaveBeenCalled();
    vi.advanceTimersByTime(DebounceType.FAST);
    expect(updateSubscriptions).toHaveBeenCalledTimes(1);
    const [payload] = updateSubscriptions.mock.calls[0];
    expect(payload).toEqual([
      {
        userId: 'user-a',
        sessionId: 'a',
        trackType: TrackType.VIDEO,
        dimension: { width: 320, height: 240 },
      },
    ]);
    vi.useRealTimers();
  });

  it('apply(0) fires synchronously - no timer involved - with the exact subscription payload', () => {
    addParticipant('a', {
      publishedTracks: [TrackType.VIDEO],
      videoDimension: { width: 320, height: 240 },
    });

    // DebounceType is a numeric enum; the implementation uses a truthy
    // check, so `0` takes the synchronous branch.
    manager.apply(0 as DebounceType);

    expect(updateSubscriptions).toHaveBeenCalledTimes(1);
    const [payload] = updateSubscriptions.mock.calls[0];
    expect(payload).toEqual([
      {
        userId: 'user-a',
        sessionId: 'a',
        trackType: TrackType.VIDEO,
        dimension: { width: 320, height: 240 },
      },
    ]);
  });

  it('apply() with DebounceType.SLOW (default) fires after 1200ms', () => {
    vi.useFakeTimers();
    addParticipant('a', {
      publishedTracks: [TrackType.VIDEO],
      videoDimension: { width: 320, height: 240 },
    });

    manager.apply();
    expect(updateSubscriptions).not.toHaveBeenCalled();
    vi.advanceTimersByTime(DebounceType.SLOW);
    expect(updateSubscriptions).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  // ---------------------------------------------------------------------
  // dispose() cancels pending timeout
  // ---------------------------------------------------------------------

  it('dispose() cancels a pending debounced push: no RPC fires after dispose', () => {
    vi.useFakeTimers();
    addParticipant('a', {
      publishedTracks: [TrackType.VIDEO],
      videoDimension: { width: 320, height: 240 },
    });

    manager.apply(DebounceType.FAST);
    manager.dispose();
    vi.advanceTimersByTime(DebounceType.FAST * 2);

    expect(updateSubscriptions).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  // ---------------------------------------------------------------------
  // incomingVideoSettings$
  // ---------------------------------------------------------------------

  it('incomingVideoSettings$ reflects global + per-session overrides', () => {
    let latest: unknown;
    const sub = manager.incomingVideoSettings$.subscribe((v) => {
      latest = v;
    });

    manager.setOverrides({
      enabled: true,
      dimension: { width: 1280, height: 720 },
    });
    manager.setOverrides({ enabled: false }, ['muted-session']);

    expect(latest).toMatchObject({
      enabled: true,
      preferredResolution: { width: 1280, height: 720 },
      participants: {
        'muted-session': { enabled: false, preferredResolution: undefined },
      },
    });
    // isParticipantVideoEnabled helper honors per-session + global precedence.
    expect(
      (
        latest as { isParticipantVideoEnabled: (id: string) => boolean }
      ).isParticipantVideoEnabled('muted-session'),
    ).toBe(false);
    expect(
      (
        latest as { isParticipantVideoEnabled: (id: string) => boolean }
      ).isParticipantVideoEnabled('other-session'),
    ).toBe(true);

    sub.unsubscribe();
  });

  it('incomingVideoSettings$ replays the latest value to a late subscriber (shareReplay(1))', () => {
    // Set state BEFORE any subscriber attaches.
    manager.setOverrides({
      enabled: true,
      dimension: { width: 1280, height: 720 },
    });
    manager.setOverrides({ enabled: false }, ['muted-session']);

    let latest: unknown;
    const sub = manager.incomingVideoSettings$.subscribe((v) => {
      latest = v;
    });

    // The late subscriber must receive the buffered value synchronously
    // on attach without needing a fresh setOverrides call.
    expect(latest).toMatchObject({
      enabled: true,
      preferredResolution: { width: 1280, height: 720 },
      participants: {
        'muted-session': { enabled: false, preferredResolution: undefined },
      },
    });

    sub.unsubscribe();
  });
});
