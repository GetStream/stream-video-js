/**
 * @vitest-environment happy-dom
 */

import '../../rtc/__tests__/mocks/webrtc.mocks';

import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { AudioHealthInfo, AudioHealthMonitor } from '../AudioHealthMonitor';
import { Tracer } from '../../stats';
import { getCurrentValue } from '../../store/rxUtils';
import { HOST_AUDIO_SESSION_EVENT, type HostAudioSessionEvent } from '../types';

describe('AudioHealthMonitor', () => {
  // Stub a minimal `navigator.audioSession` so the browser-only detection
  // pipeline has something to attach to under happy-dom (which doesn't model
  // the W3C Audio Session API yet).
  type AudioSessionStub = {
    type: string;
    state: string;
    addEventListener: Mock;
    removeEventListener: Mock;
    /** Helper to simulate a `statechange` firing on the stub. */
    emitStateChange: () => void;
  };
  let audioSessionStub: AudioSessionStub;
  let tracer: Tracer;

  const makeStub = (): AudioSessionStub => {
    const handlers: Array<() => void> = [];
    return {
      type: 'auto',
      state: 'active',
      addEventListener: vi.fn((_: string, h: () => void) => {
        handlers.push(h);
      }),
      removeEventListener: vi.fn((_: string, h: () => void) => {
        const i = handlers.indexOf(h);
        if (i >= 0) handlers.splice(i, 1);
      }),
      emitStateChange: () => handlers.forEach((h) => h()),
    };
  };

  const installAudioSession = () => {
    audioSessionStub = makeStub();
    Object.defineProperty(globalThis.navigator, 'audioSession', {
      configurable: true,
      value: audioSessionStub,
    });
  };

  const uninstallAudioSession = () => {
    delete globalThis.navigator.audioSession;
  };

  const createdMonitors: AudioHealthMonitor[] = [];

  beforeEach(() => {
    installAudioSession();
    tracer = new Tracer('test');
  });

  afterEach(async () => {
    // Stop any monitor a test forgot about so its `window` listeners
    // don't bleed into the next test's log assertions.
    while (createdMonitors.length > 0) {
      await createdMonitors.pop()!.stop();
    }
    uninstallAudioSession();
  });

  const newMonitor = () => {
    const monitor = new AudioHealthMonitor(tracer);
    createdMonitors.push(monitor);
    return monitor;
  };

  /**
   * Tiny factory for a blocked audio element with a settable `srcObject` and
   * a `.play()` spy — happy-dom's default `<audio>` doesn't resolve `.play()`
   * nicely and locks `srcObject` down via validation.
   */
  const makeBlockedElement = (playMock?: Mock): HTMLAudioElement => {
    const el = document.createElement('audio');
    Object.defineProperty(el, 'srcObject', { writable: true });
    el.srcObject = new MediaStream();
    vi.spyOn(el, 'play').mockImplementation(playMock ?? vi.fn());
    return el;
  };

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  it('emits not-started on construction and does not mutate page-global audio state', () => {
    const monitor = newMonitor();
    expect(audioSessionStub.type).toBe('auto');
    expect(audioSessionStub.addEventListener).not.toHaveBeenCalled();
    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'unknown',
      reason: 'not-started',
    });
    // @ts-expect-error private property
    expect(monitor.audioContext).toBeUndefined();
    // @ts-expect-error private property
    expect(monitor.started).toBe(false);
  });

  it('installs the pipeline on start()', () => {
    const monitor = newMonitor();
    monitor.start();

    expect(audioSessionStub.type).toBe('play-and-record');
    expect(audioSessionStub.addEventListener).toHaveBeenCalledWith(
      'statechange',
      expect.any(Function),
    );
    // @ts-expect-error private property
    expect(monitor.audioContext).toBeDefined();
    // @ts-expect-error private property
    expect(monitor.started).toBe(true);
  });

  it('is idempotent across repeated start() calls', () => {
    const monitor = newMonitor();
    monitor.start();
    monitor.start();
    monitor.start();

    // Pipeline installed exactly once regardless of call count.
    expect(audioSessionStub.addEventListener).toHaveBeenCalledTimes(1);
  });

  it('removes the audioSession listener and restores the original type on stop()', async () => {
    audioSessionStub.type = 'playback'; // pre-existing host preference
    const monitor = newMonitor();
    monitor.start();

    expect(audioSessionStub.type).toBe('play-and-record');
    const installedHandler = audioSessionStub.addEventListener.mock.calls[0][1];

    await monitor.stop();

    expect(audioSessionStub.removeEventListener).toHaveBeenCalledWith(
      'statechange',
      installedHandler,
    );
    expect(audioSessionStub.type).toBe('playback');
    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'unknown',
      reason: 'not-started',
    });
    // @ts-expect-error private property
    expect(monitor.started).toBe(false);
    // @ts-expect-error private property
    expect(monitor.audioContext).toBeUndefined();
  });

  it('stop() is safe when start() was never called', async () => {
    const monitor = newMonitor();
    await monitor.stop();
    expect(audioSessionStub.removeEventListener).not.toHaveBeenCalled();
    expect(audioSessionStub.type).toBe('auto');
  });

  it('start → stop → start produces a fresh pipeline (no duplicate listeners)', async () => {
    audioSessionStub.type = 'playback';
    const monitor = newMonitor();

    monitor.start();
    expect(audioSessionStub.addEventListener).toHaveBeenCalledTimes(1);
    // @ts-expect-error private property
    const firstProbe = monitor.audioContext;

    await monitor.stop();
    expect(audioSessionStub.type).toBe('playback');

    monitor.start();
    expect(audioSessionStub.addEventListener).toHaveBeenCalledTimes(2);
    // @ts-expect-error private property
    expect(monitor.audioContext).toBeDefined();
    // @ts-expect-error private property
    expect(monitor.audioContext).not.toBe(firstProbe);
    expect(audioSessionStub.type).toBe('play-and-record');
    await monitor.stop();
    expect(audioSessionStub.type).toBe('playback');
    expect(audioSessionStub.removeEventListener).toHaveBeenCalledTimes(2);
  });

  it('stop() clears the blocked-elements set', async () => {
    const monitor = newMonitor();
    monitor.start();
    monitor.registerBlockedAudioElement(makeBlockedElement());
    expect(getCurrentValue(monitor.autoplayBlocked$)).toBe(true);

    await monitor.stop();
    expect(getCurrentValue(monitor.autoplayBlocked$)).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Classification
  // -------------------------------------------------------------------------

  it('stays not-started before start() is called', () => {
    const monitor = newMonitor();
    monitor.registerBlockedAudioElement(makeBlockedElement());
    audioSessionStub.state = 'interrupted';
    audioSessionStub.emitStateChange();
    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'unknown',
      reason: 'not-started',
    });
  });

  it('does not throw when constructed with no navigator', () => {
    uninstallAudioSession();
    const navigatorDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      'navigator',
    );
    try {
      delete globalThis.navigator;
      expect(() => newMonitor()).not.toThrow();
    } finally {
      if (navigatorDescriptor) {
        Object.defineProperty(globalThis, 'navigator', navigatorDescriptor);
      }
      installAudioSession();
    }
  });

  it('emits audio-session-active after start() when the session is active', () => {
    const monitor = newMonitor();
    monitor.start();
    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'healthy',
      reason: 'audio-session-active',
    });
  });

  it('emits unhealthy/audio-session-interrupted when the session is interrupted', () => {
    const monitor = newMonitor();
    monitor.start();
    audioSessionStub.state = 'interrupted';
    audioSessionStub.emitStateChange();
    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'unhealthy',
      reason: 'audio-session-interrupted',
    });
  });

  it('emits unhealthy/autoplay-blocked via registerBlockedAudioElement, separate from session interruption', () => {
    const monitor = newMonitor();
    monitor.start();
    expect(getCurrentValue(monitor.audioHealth$).reason).toBe(
      'audio-session-active',
    );

    const el = makeBlockedElement();
    monitor.registerBlockedAudioElement(el);
    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'unhealthy',
      reason: 'autoplay-blocked',
    });

    // Unregistering clears the block.
    monitor.unregisterBlockedAudioElement(el);
    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'healthy',
      reason: 'audio-session-active',
    });
  });

  it('session-interrupted wins over autoplay-blocked (priority order)', () => {
    const monitor = newMonitor();
    monitor.start();
    monitor.registerBlockedAudioElement(makeBlockedElement());
    expect(getCurrentValue(monitor.audioHealth$).reason).toBe(
      'autoplay-blocked',
    );

    audioSessionStub.state = 'interrupted';
    audioSessionStub.emitStateChange();
    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'unhealthy',
      reason: 'audio-session-interrupted',
    });
  });

  it('falls back to unsupported when started but no audioSession is present', () => {
    uninstallAudioSession();
    const monitor = newMonitor();
    monitor.start();
    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'unknown',
      reason: 'unsupported',
    });
  });

  it('deduplicates emissions on identical status + reason', () => {
    const monitor = newMonitor();
    const emissions: AudioHealthInfo[] = [];
    const sub = monitor.audioHealth$.subscribe((info) => emissions.push(info));
    // Initial not-started replayed to new subscriber.
    expect(emissions).toHaveLength(1);

    monitor.start();
    // start() flows through audio-session-active (1 more emission).
    expect(emissions).toHaveLength(2);

    // Re-emit the same state — no new emission.
    audioSessionStub.emitStateChange();
    audioSessionStub.emitStateChange();
    expect(emissions).toHaveLength(2);

    // Transition — new emission.
    audioSessionStub.state = 'interrupted';
    audioSessionStub.emitStateChange();
    expect(emissions).toHaveLength(3);
    expect(emissions[2].reason).toBe('audio-session-interrupted');

    // Redundant transition — no new emission.
    audioSessionStub.emitStateChange();
    expect(emissions).toHaveLength(3);

    sub.unsubscribe();
  });

  // -------------------------------------------------------------------------
  // resumeAudio()
  // -------------------------------------------------------------------------

  it('resumeAudio() calls .play() on each blocked element and removes resolved ones', async () => {
    const monitor = newMonitor();
    monitor.start();

    const playOk = vi.fn().mockResolvedValue(undefined);
    const playFail = vi
      .fn()
      .mockRejectedValue(new DOMException('', 'NotAllowedError'));
    const elA = makeBlockedElement(playOk);
    const elB = makeBlockedElement(playFail);

    monitor.registerBlockedAudioElement(elA);
    monitor.registerBlockedAudioElement(elB);
    expect(getCurrentValue(monitor.autoplayBlocked$)).toBe(true);

    await monitor.resumeAudio();

    expect(playOk).toHaveBeenCalled();
    expect(playFail).toHaveBeenCalled();
    // Only elB remains in the blocked set → still blocked overall.
    expect(getCurrentValue(monitor.autoplayBlocked$)).toBe(true);
    // @ts-expect-error private property
    const remaining = monitor.blockedAudioElementsSubject.getValue();
    expect(remaining.has(elA)).toBe(false);
    expect(remaining.has(elB)).toBe(true);
  });

  it('resumeAudio() clears the set when every play() resolves', async () => {
    const monitor = newMonitor();
    monitor.start();

    const el = makeBlockedElement(vi.fn().mockResolvedValue(undefined));
    monitor.registerBlockedAudioElement(el);
    expect(getCurrentValue(monitor.autoplayBlocked$)).toBe(true);

    await monitor.resumeAudio();

    expect(getCurrentValue(monitor.autoplayBlocked$)).toBe(false);
    // Transition from autoplay-blocked → audio-session-active flowed
    // through the reducer.
    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'healthy',
      reason: 'audio-session-active',
    });
  });

  // -------------------------------------------------------------------------
  // Host audio-session bridge
  // -------------------------------------------------------------------------

  const makeHostEvent = (
    overrides: Partial<HostAudioSessionEvent['state']> = {},
    eventOverrides: Partial<HostAudioSessionEvent> = {},
  ): HostAudioSessionEvent => ({
    schemaVersion: 1,
    source: 'ios',
    timestamp: 1_700_000_000_000,
    state: {
      category: 'AVAudioSessionCategoryPlayAndRecord',
      mode: 'AVAudioSessionModeVideoChat',
      categoryOptions: 0,
      interruption: null,
      routeChangeReason: null,
      ...overrides,
    },
    ...eventOverrides,
  });

  const dispatchHostEvent = (detail: unknown) => {
    window.dispatchEvent(new CustomEvent(HOST_AUDIO_SESSION_EVENT, { detail }));
  };

  it('flips to host-audio-session-interrupted on an `interruption: began` event', () => {
    const monitor = newMonitor();
    monitor.start();

    dispatchHostEvent(makeHostEvent({ interruption: { type: 'began' } }));

    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'unhealthy',
      reason: 'host-audio-session-interrupted',
    });
  });

  it('flips to host-audio-session-active on an event with no interruption', () => {
    const monitor = newMonitor();
    monitor.start();

    dispatchHostEvent(makeHostEvent());

    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'healthy',
      reason: 'host-audio-session-active',
    });
  });

  it('returns to host-audio-session-active after a began/ended pair', () => {
    const monitor = newMonitor();
    monitor.start();

    dispatchHostEvent(makeHostEvent({ interruption: { type: 'began' } }));
    expect(getCurrentValue(monitor.audioHealth$).reason).toBe(
      'host-audio-session-interrupted',
    );

    dispatchHostEvent(makeHostEvent({ interruption: { type: 'ended' } }));
    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'healthy',
      reason: 'host-audio-session-active',
    });
  });

  it('ignores events with unknown schemaVersion and does not spam the log', () => {
    const monitor = newMonitor();
    monitor.start();
    // @ts-expect-error private property
    const warnSpy = vi.spyOn(monitor.logger, 'warn');

    const baseline = getCurrentValue(monitor.audioHealth$);
    dispatchHostEvent({ ...makeHostEvent(), schemaVersion: 999 });
    dispatchHostEvent({ ...makeHostEvent(), schemaVersion: 999 });
    dispatchHostEvent({ ...makeHostEvent(), schemaVersion: 999 });

    expect(getCurrentValue(monitor.audioHealth$)).toEqual(baseline);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('ignores malformed payloads without throwing', () => {
    const monitor = newMonitor();
    monitor.start();
    const baseline = getCurrentValue(monitor.audioHealth$);

    expect(() => dispatchHostEvent(undefined)).not.toThrow();
    expect(() => dispatchHostEvent({ schemaVersion: 1 })).not.toThrow();
    expect(() =>
      dispatchHostEvent({ schemaVersion: 1, state: 'not an object' }),
    ).not.toThrow();

    // None of the above should change health state.
    expect(getCurrentValue(monitor.audioHealth$)).toEqual(baseline);
  });

  it('prefers the host-bridge reason when both host and W3C signal interrupted', () => {
    const monitor = newMonitor();
    monitor.start();

    audioSessionStub.state = 'interrupted';
    audioSessionStub.emitStateChange();
    dispatchHostEvent(makeHostEvent({ interruption: { type: 'began' } }));

    expect(getCurrentValue(monitor.audioHealth$).reason).toBe(
      'host-audio-session-interrupted',
    );
  });

  it('lets W3C unhealthy win over host-healthy (any unhealthy beats any healthy)', () => {
    const monitor = newMonitor();
    monitor.start();

    dispatchHostEvent(makeHostEvent()); // host says active
    audioSessionStub.state = 'interrupted';
    audioSessionStub.emitStateChange();

    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'unhealthy',
      reason: 'audio-session-interrupted',
    });
  });

  it('stop() detaches the host-bridge listener', async () => {
    const monitor = newMonitor();
    monitor.start();

    dispatchHostEvent(makeHostEvent({ interruption: { type: 'began' } }));
    expect(getCurrentValue(monitor.audioHealth$).reason).toBe(
      'host-audio-session-interrupted',
    );

    await monitor.stop();
    dispatchHostEvent(makeHostEvent({ interruption: { type: 'began' } }));

    // After stop(), health is reset and host events don't re-flip it.
    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'unknown',
      reason: 'not-started',
    });
  });

  it('start() after stop() re-attaches the host-bridge listener', async () => {
    const monitor = newMonitor();
    monitor.start();
    await monitor.stop();
    monitor.start();

    dispatchHostEvent(makeHostEvent({ interruption: { type: 'began' } }));

    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'unhealthy',
      reason: 'host-audio-session-interrupted',
    });
  });

  // -------------------------------------------------------------------------
  // Chrome-coverage: remote-tracks-muted
  // -------------------------------------------------------------------------

  /**
   * happy-dom doesn't model `MediaStreamTrack` mute semantics precisely,
   * so we use a plain object cast to MediaStreamTrack — the monitor only
   * uses the reference as a Map key, never reads `.muted` itself.
   */
  const fakeTrack = (): MediaStreamTrack => ({}) as unknown as MediaStreamTrack;

  it('flips to unhealthy/remote-tracks-muted when every registered track is muted (>= 2 tracks)', () => {
    // Force the Chrome path: no W3C audioSession stub, so the healthy
    // tiers below the new signal are deterministic.
    uninstallAudioSession();
    const monitor = newMonitor();
    monitor.start();

    const a = fakeTrack();
    const b = fakeTrack();
    monitor.handleRemoteAudioTrackChange(a, 'unmuted');
    monitor.handleRemoteAudioTrackChange(b, 'unmuted');
    expect(getCurrentValue(monitor.audioHealth$).reason).toBe(
      'playback-verified',
    );

    // Mute the first only — still healthy via the second.
    monitor.handleRemoteAudioTrackChange(a, 'muted');
    expect(getCurrentValue(monitor.audioHealth$).reason).toBe(
      'playback-verified',
    );

    // Mute both — minimum threshold satisfied (size === 2, all muted).
    monitor.handleRemoteAudioTrackChange(b, 'muted');
    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'unhealthy',
      reason: 'remote-tracks-muted',
    });
  });

  it('does not flip on remote-tracks-muted when only some tracks are muted', () => {
    uninstallAudioSession();
    const monitor = newMonitor();
    monitor.start();

    const a = fakeTrack();
    const b = fakeTrack();
    monitor.handleRemoteAudioTrackChange(a, 'muted');
    monitor.handleRemoteAudioTrackChange(b, 'unmuted');

    // One muted out of two → playback-verified is correct, not unhealthy.
    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'healthy',
      reason: 'playback-verified',
    });
  });

  it('removes ended tracks from the aggregation (remote leaving while muted edge case)', () => {
    uninstallAudioSession();
    const monitor = newMonitor();
    monitor.start();

    const a = fakeTrack();
    const b = fakeTrack();
    const c = fakeTrack();
    monitor.handleRemoteAudioTrackChange(a, 'muted');
    monitor.handleRemoteAudioTrackChange(b, 'muted');
    monitor.handleRemoteAudioTrackChange(c, 'unmuted');
    expect(getCurrentValue(monitor.audioHealth$).reason).toBe(
      'playback-verified',
    );

    // The unmuted track ends → two muted ones remain → flips
    // unhealthy. Without `'ended'` removing the track from the map,
    // the stale unmuted-but-gone entry would mask the muted condition.
    monitor.handleRemoteAudioTrackChange(c, 'ended');
    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'unhealthy',
      reason: 'remote-tracks-muted',
    });
  });

  it('does NOT fire remote-tracks-muted when only a single track is registered (1:1 calls)', () => {
    uninstallAudioSession();
    const monitor = newMonitor();
    monitor.start();

    monitor.handleRemoteAudioTrackChange(fakeTrack(), 'muted');

    // Single tracked track muted: per-sender hiccup is indistinguishable
    // from a client-wide problem, so the reducer falls through to
    // `unsupported` rather than reporting `remote-tracks-muted`.
    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'unknown',
      reason: 'unsupported',
    });
  });

  // -------------------------------------------------------------------------
  // Chrome-coverage: element-paused
  // -------------------------------------------------------------------------

  it('flips to unhealthy/element-paused on registerPausedAudioElement', () => {
    const monitor = newMonitor();
    monitor.start();

    const el = document.createElement('audio');
    monitor.registerPausedAudioElement(el);

    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'unhealthy',
      reason: 'element-paused',
    });
  });

  it('clears element-paused when the last paused element unregisters', () => {
    uninstallAudioSession();
    const monitor = newMonitor();
    monitor.start();
    const el = document.createElement('audio');
    monitor.registerPausedAudioElement(el);
    expect(getCurrentValue(monitor.audioHealth$).reason).toBe('element-paused');

    monitor.unregisterPausedAudioElement(el);
    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'unknown',
      reason: 'unsupported',
    });
  });

  // -------------------------------------------------------------------------
  // Reducer priority for the new signals
  // -------------------------------------------------------------------------

  it('autoplay-blocked beats remote-tracks-muted (user-actionable wins within tier 4)', () => {
    const monitor = newMonitor();
    monitor.start();

    const t = fakeTrack();
    monitor.handleRemoteAudioTrackChange(t, 'muted');
    monitor.registerBlockedAudioElement(makeBlockedElement());

    expect(getCurrentValue(monitor.audioHealth$).reason).toBe(
      'autoplay-blocked',
    );
  });

  it('any *-interrupted reason beats both new unhealthy reasons', () => {
    const monitor = newMonitor();
    monitor.start();

    const a = fakeTrack();
    const b = fakeTrack();
    monitor.handleRemoteAudioTrackChange(a, 'muted');
    monitor.handleRemoteAudioTrackChange(b, 'muted');
    monitor.registerPausedAudioElement(document.createElement('audio'));
    expect(getCurrentValue(monitor.audioHealth$).reason).toBe(
      'remote-tracks-muted',
    );

    audioSessionStub.state = 'interrupted';
    audioSessionStub.emitStateChange();
    expect(getCurrentValue(monitor.audioHealth$).reason).toBe(
      'audio-session-interrupted',
    );
  });

  // -------------------------------------------------------------------------
  // playback-verified
  // -------------------------------------------------------------------------

  it('does not promote to playback-verified before any remote audio track is registered', () => {
    uninstallAudioSession();
    const monitor = newMonitor();
    monitor.start();
    // Chrome/Firefox baseline: no audioSession, no host bridge, no
    // remote tracks yet → unsupported.
    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'unknown',
      reason: 'unsupported',
    });
  });

  it('promotes to playback-verified when a remote audio track is registered as unmuted (Chrome/Firefox path)', () => {
    uninstallAudioSession();
    const monitor = newMonitor();
    monitor.start();

    monitor.handleRemoteAudioTrackChange(fakeTrack(), 'unmuted');

    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'healthy',
      reason: 'playback-verified',
    });
  });

  it('host-audio-session-active still beats playback-verified (host is more authoritative)', () => {
    const monitor = newMonitor();
    monitor.start();

    monitor.handleRemoteAudioTrackChange(fakeTrack(), 'unmuted');
    dispatchHostEvent(makeHostEvent());

    expect(getCurrentValue(monitor.audioHealth$).reason).toBe(
      'host-audio-session-active',
    );
  });

  it('stop() clears remote-track and paused-element collections', async () => {
    const monitor = newMonitor();
    monitor.start();
    const a = fakeTrack();
    const b = fakeTrack();
    const el = document.createElement('audio');
    monitor.handleRemoteAudioTrackChange(a, 'muted');
    monitor.handleRemoteAudioTrackChange(b, 'muted');
    monitor.registerPausedAudioElement(el);
    expect(getCurrentValue(monitor.audioHealth$).reason).toBe(
      'remote-tracks-muted',
    );

    await monitor.stop();
    monitor.start();
    // Fresh start: stale state must not leak through.
    expect(getCurrentValue(monitor.audioHealth$).reason).not.toBe(
      'remote-tracks-muted',
    );
    expect(getCurrentValue(monitor.audioHealth$).reason).not.toBe(
      'element-paused',
    );
  });
});
