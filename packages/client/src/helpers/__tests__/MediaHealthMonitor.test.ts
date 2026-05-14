/**
 * @vitest-environment happy-dom
 */

import '../../rtc/__tests__/mocks/webrtc.mocks';

import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { MediaHealthMonitor } from '../MediaHealthMonitor';
import { Tracer } from '../../stats';
import { getCurrentValue } from '../../store/rxUtils';
import {
  HOST_AUDIO_SESSION_EVENT,
  type AudioHealthInfo,
  type HostAudioSessionEvent,
} from '../mediaHealthTypes';

describe('MediaHealthMonitor', () => {
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

  const createdMonitors: MediaHealthMonitor[] = [];

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
    vi.useRealTimers();
    uninstallAudioSession();
  });

  const newMonitor = () => {
    const monitor = new MediaHealthMonitor(tracer);
    createdMonitors.push(monitor);
    return monitor;
  };

  /**
   * Tiny factory for a blocked audio element with a settable `srcObject` and
   * a `.play()` spy - happy-dom's default `<audio>` doesn't resolve `.play()`
   * nicely and locks `srcObject` down via validation.
   */
  const makeBlockedElement = (playMock?: Mock): HTMLAudioElement => {
    const el = document.createElement('audio');
    Object.defineProperty(el, 'srcObject', { writable: true });
    el.srcObject = new MediaStream();
    vi.spyOn(el, 'play').mockImplementation(playMock ?? vi.fn());
    return el;
  };

  /**
   * Same idea as {@link makeBlockedElement} but for `<video>` - happy-dom's
   * default `<video>` element won't resolve `.play()` either.
   */
  const makeVideoElement = (playMock?: Mock): HTMLVideoElement => {
    const el = document.createElement('video');
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
      direction: 'both',
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
      direction: 'both',
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

  it('serializes start() that arrives during a still-pending stop()', async () => {
    const monitor = newMonitor();
    monitor.start();
    // @ts-expect-error private property
    const firstProbe = monitor.audioContext as AudioContext;
    expect(firstProbe).toBeDefined();

    // Hold probe.close() open so stop() is stuck mid-await.
    let releaseClose!: () => void;
    const closeBlocker = new Promise<void>((resolve) => {
      releaseClose = resolve;
    });
    vi.spyOn(firstProbe, 'close').mockReturnValueOnce(
      closeBlocker as Promise<void>,
    );

    const stopPromise = monitor.stop();
    const startPromise = monitor.start();

    // While stop() is still awaiting close(), start() must not have run yet:
    // it's queued on lifecycleTag behind stop().
    // @ts-expect-error private property
    expect(monitor.audioContext).toBe(firstProbe);

    releaseClose();
    await stopPromise;
    await startPromise;

    // After both settle: stop fully tore down, then start built a fresh probe.
    // @ts-expect-error private property
    expect(monitor.started).toBe(true);
    // @ts-expect-error private property
    expect(monitor.audioContext).toBeDefined();
    // @ts-expect-error private property
    expect(monitor.audioContext).not.toBe(firstProbe);
    expect(getCurrentValue(monitor.audioHealth$)).not.toEqual({
      status: 'unknown',
      reason: 'not-started',
      direction: 'both',
    });
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
    monitor.updateAutoplayBlockedState(makeBlockedElement(), true);
    expect(getCurrentValue(monitor.autoplayBlocked$)).toBe(true);

    await monitor.stop();
    expect(getCurrentValue(monitor.autoplayBlocked$)).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Classification
  // -------------------------------------------------------------------------

  it('stays not-started before start() is called', () => {
    const monitor = newMonitor();
    monitor.updateAutoplayBlockedState(makeBlockedElement(), true);
    audioSessionStub.state = 'interrupted';
    audioSessionStub.emitStateChange();
    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'unknown',
      reason: 'not-started',
      direction: 'both',
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
      direction: 'both',
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
      direction: 'both',
    });
  });

  it('emits unhealthy/autoplay-blocked via onAutoplayBlockedChange, separate from session interruption', () => {
    const monitor = newMonitor();
    monitor.start();
    expect(getCurrentValue(monitor.audioHealth$).reason).toBe(
      'audio-session-active',
    );

    const el = makeBlockedElement();
    monitor.updateAutoplayBlockedState(el, true);
    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'unhealthy',
      reason: 'autoplay-blocked',
      direction: 'playback',
    });

    // Unregistering clears the block.
    monitor.updateAutoplayBlockedState(el, false);
    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'healthy',
      reason: 'audio-session-active',
      direction: 'both',
    });
  });

  it('session-interrupted wins over autoplay-blocked (priority order)', () => {
    const monitor = newMonitor();
    monitor.start();
    monitor.updateAutoplayBlockedState(makeBlockedElement(), true);
    expect(getCurrentValue(monitor.audioHealth$).reason).toBe(
      'autoplay-blocked',
    );

    audioSessionStub.state = 'interrupted';
    audioSessionStub.emitStateChange();
    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'unhealthy',
      reason: 'audio-session-interrupted',
      direction: 'both',
    });
  });

  it('falls back to pending when started but no audioSession is present', () => {
    uninstallAudioSession();
    const monitor = newMonitor();
    monitor.start();
    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'unknown',
      reason: 'pending',
      direction: 'both',
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

    // Re-emit the same state - no new emission.
    audioSessionStub.emitStateChange();
    audioSessionStub.emitStateChange();
    expect(emissions).toHaveLength(2);

    // Transition - new emission.
    audioSessionStub.state = 'interrupted';
    audioSessionStub.emitStateChange();
    expect(emissions).toHaveLength(3);
    expect(emissions[2].reason).toBe('audio-session-interrupted');

    // Redundant transition - no new emission.
    audioSessionStub.emitStateChange();
    expect(emissions).toHaveLength(3);

    sub.unsubscribe();
  });

  // -------------------------------------------------------------------------
  // resumeMedia()
  // -------------------------------------------------------------------------

  it('resumeMedia() calls .play() on each blocked element and removes resolved ones', async () => {
    const monitor = newMonitor();
    monitor.start();

    const playOk = vi.fn().mockResolvedValue(undefined);
    const playFail = vi
      .fn()
      .mockRejectedValue(new DOMException('', 'NotAllowedError'));
    const elA = makeBlockedElement(playOk);
    const elB = makeBlockedElement(playFail);

    monitor.updateAutoplayBlockedState(elA, true);
    monitor.updateAutoplayBlockedState(elB, true);
    expect(getCurrentValue(monitor.autoplayBlocked$)).toBe(true);

    await monitor.resumeMedia();

    expect(playOk).toHaveBeenCalled();
    expect(playFail).toHaveBeenCalled();
    // Only elB remains in the blocked set → still blocked overall.
    expect(getCurrentValue(monitor.autoplayBlocked$)).toBe(true);
    // @ts-expect-error private property
    const remaining = monitor.blockedAudioElementsSubject.getValue();
    expect(remaining.has(elA)).toBe(false);
    expect(remaining.has(elB)).toBe(true);
  });

  it('resumeMedia() clears the set when every blocked play() resolves', async () => {
    const monitor = newMonitor();
    monitor.start();

    const el = makeBlockedElement(vi.fn().mockResolvedValue(undefined));
    monitor.updateAutoplayBlockedState(el, true);
    expect(getCurrentValue(monitor.autoplayBlocked$)).toBe(true);

    await monitor.resumeMedia();

    expect(getCurrentValue(monitor.autoplayBlocked$)).toBe(false);
    // Transition from autoplay-blocked → audio-session-active flowed
    // through the reducer.
    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'healthy',
      reason: 'audio-session-active',
      direction: 'both',
    });
  });

  it('resumeMedia() calls .play() on paused-live elements and removes resolved ones', async () => {
    const monitor = newMonitor();
    monitor.start();

    const playOk = vi.fn().mockResolvedValue(undefined);
    const playFail = vi
      .fn()
      .mockRejectedValue(new DOMException('', 'NotAllowedError'));
    const elA = makeBlockedElement(playOk);
    const elB = makeBlockedElement(playFail);

    monitor.updateElementPausedState(elA, true);
    monitor.updateElementPausedState(elB, true);

    await monitor.resumeMedia();

    expect(playOk).toHaveBeenCalled();
    expect(playFail).toHaveBeenCalled();
    // @ts-expect-error private property
    expect(monitor.pausedAudio.elements.has(elA)).toBe(false);
    // @ts-expect-error private property
    expect(monitor.pausedAudio.elements.has(elB)).toBe(true);
    expect(getCurrentValue(monitor.audioHealth$).reason).toBe('element-paused');
  });

  it('auto-recovers element-paused when replaying the paused element resolves', async () => {
    const monitor = newMonitor();
    monitor.start();

    const playOk = vi.fn().mockResolvedValue(undefined);
    const el = makeBlockedElement(playOk);

    monitor.updateElementPausedState(el, true);
    await vi.waitFor(() => expect(playOk).toHaveBeenCalled());

    await vi.waitFor(() => {
      // @ts-expect-error private property
      expect(monitor.pausedAudio.elements.has(el)).toBe(false);
      expect(getCurrentValue(monitor.audioHealth$).reason).toBe(
        'audio-session-active',
      );
    });
  });

  it('retries paused-live elements after the first automatic replay fails', async () => {
    vi.useFakeTimers();
    const monitor = newMonitor();
    monitor.start();

    const play = vi
      .fn()
      .mockRejectedValueOnce(new DOMException('', 'AbortError'))
      .mockResolvedValue(undefined);
    const el = makeBlockedElement(play);

    monitor.updateElementPausedState(el, true);

    await vi.advanceTimersByTimeAsync(0);
    expect(play).toHaveBeenCalledTimes(1);
    expect(getCurrentValue(monitor.audioHealth$).reason).toBe('element-paused');

    await vi.advanceTimersByTimeAsync(500);

    expect(play).toHaveBeenCalledTimes(2);
    // @ts-expect-error private property
    expect(monitor.pausedAudio.elements.has(el)).toBe(false);
    expect(getCurrentValue(monitor.audioHealth$).reason).toBe(
      'audio-session-active',
    );
    vi.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // Host audio-session bridge
  // -------------------------------------------------------------------------

  const makeHostEvent = (
    overrides: Partial<HostAudioSessionEvent> = {},
  ): HostAudioSessionEvent => ({
    schemaVersion: 1,
    timestamp: 1_700_000_000_000,
    session: {
      category: 'playAndRecord',
      mode: 'videoChat',
      options: [],
    },
    interruption: null,
    routeChange: null,
    ...overrides,
  });

  const dispatchHostEvent = (detail: unknown) => {
    window.dispatchEvent(new CustomEvent(HOST_AUDIO_SESSION_EVENT, { detail }));
  };

  it('flips to host-audio-session-interrupted on an `interruption: began` event', () => {
    const monitor = newMonitor();
    monitor.start();

    dispatchHostEvent(
      makeHostEvent({ interruption: { type: 'began', reason: null } }),
    );

    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'unhealthy',
      reason: 'host-audio-session-interrupted',
      direction: 'both',
    });
  });

  it('flips to host-audio-session-active on an event with no interruption', () => {
    const monitor = newMonitor();
    monitor.start();

    dispatchHostEvent(makeHostEvent());

    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'healthy',
      reason: 'host-audio-session-active',
      direction: 'both',
    });
  });

  it('returns to host-audio-session-active after a began/ended pair', () => {
    const monitor = newMonitor();
    monitor.start();

    dispatchHostEvent(
      makeHostEvent({ interruption: { type: 'began', reason: null } }),
    );
    expect(getCurrentValue(monitor.audioHealth$).reason).toBe(
      'host-audio-session-interrupted',
    );

    dispatchHostEvent(
      makeHostEvent({ interruption: { type: 'ended', reason: null } }),
    );
    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'healthy',
      reason: 'host-audio-session-active',
      direction: 'both',
    });
  });

  it('clears `began` when a later event drops `interruption` even if the route changed', () => {
    // iOS does not reliably post `interruption.ended` for category-conflict
    // interruptions. Hosts recover by re-dispatching a snapshot with
    // `interruption: null` once they observe audio is back, typically
    // alongside a route-change. The SDK reducer must treat the cleared
    // `interruption` field as the terminal signal regardless of which other
    // fields the host updated in the same dispatch.
    const monitor = newMonitor();
    monitor.start();

    dispatchHostEvent(
      makeHostEvent({ interruption: { type: 'began', reason: null } }),
    );
    expect(getCurrentValue(monitor.audioHealth$).reason).toBe(
      'host-audio-session-interrupted',
    );

    dispatchHostEvent(
      makeHostEvent({
        interruption: null,
        routeChange: { reason: 'override' },
      }),
    );
    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'healthy',
      reason: 'host-audio-session-active',
      direction: 'both',
    });
  });

  it('ignores events with unknown schemaVersion', () => {
    const monitor = newMonitor();
    monitor.start();

    const baseline = getCurrentValue(monitor.audioHealth$);
    dispatchHostEvent({ ...makeHostEvent(), schemaVersion: 999 });
    dispatchHostEvent({ ...makeHostEvent(), schemaVersion: 999 });
    dispatchHostEvent({ ...makeHostEvent(), schemaVersion: 999 });

    expect(getCurrentValue(monitor.audioHealth$)).toEqual(baseline);
  });

  it('ignores malformed payloads without throwing or flipping health', () => {
    const monitor = newMonitor();
    monitor.start();
    const baseline = getCurrentValue(monitor.audioHealth$);

    // `detail` missing entirely - must not throw on the destructuring.
    expect(() => dispatchHostEvent(undefined)).not.toThrow();
    // `detail` is null - same path.
    expect(() => dispatchHostEvent(null)).not.toThrow();
    // Sparse v1 payload with no `session` field - must not flip
    // `audioHealth` to `host-audio-session-active` just because the
    // detail object is truthy. (Codex review: schema-drift trust
    // boundary - a buggy older host bridge could otherwise hide a real
    // interruption.)
    expect(() => dispatchHostEvent({ schemaVersion: 1 })).not.toThrow();
    expect(() =>
      dispatchHostEvent({ schemaVersion: 1, session: 'not an object' }),
    ).not.toThrow();

    // None of the malformed payloads should have changed health state.
    expect(getCurrentValue(monitor.audioHealth$)).toEqual(baseline);
  });

  it('prefers the host-bridge reason when both host and W3C signal interrupted', () => {
    const monitor = newMonitor();
    monitor.start();

    audioSessionStub.state = 'interrupted';
    audioSessionStub.emitStateChange();
    dispatchHostEvent(
      makeHostEvent({ interruption: { type: 'began', reason: null } }),
    );

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
      direction: 'both',
    });
  });

  it('resumes an interrupted probe AudioContext when the host reports active', async () => {
    const monitor = newMonitor();
    monitor.start();
    // @ts-expect-error private property
    const probe = monitor.audioContext as AudioContext & { state: string };
    probe.state = 'interrupted';
    // @ts-expect-error private method
    monitor.onAudioContextStateChange();
    expect(getCurrentValue(monitor.audioHealth$).reason).toBe(
      'audio-context-interrupted',
    );

    dispatchHostEvent(makeHostEvent());

    await vi.waitFor(() => expect(probe.resume).toHaveBeenCalled());
    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'healthy',
      reason: 'host-audio-session-active',
      direction: 'both',
    });
  });

  it('retries interrupted probe AudioContext recovery when the first resume fails', async () => {
    vi.useFakeTimers();
    const monitor = newMonitor();
    monitor.start();
    // @ts-expect-error private property
    const probe = monitor.audioContext as AudioContext & { state: string };
    const resume = vi
      .fn()
      .mockRejectedValueOnce(new DOMException('', 'AbortError'))
      .mockImplementationOnce(async function (
        this: AudioContext & { state: string },
      ) {
        this.state = 'running';
      });
    probe.resume = resume;
    probe.state = 'interrupted';
    // @ts-expect-error private method
    monitor.onAudioContextStateChange();

    await vi.advanceTimersByTimeAsync(0);
    expect(resume).toHaveBeenCalledTimes(1);
    expect(getCurrentValue(monitor.audioHealth$).reason).toBe(
      'audio-context-interrupted',
    );

    await vi.advanceTimersByTimeAsync(500);

    expect(resume).toHaveBeenCalledTimes(2);
    expect(getCurrentValue(monitor.audioHealth$).reason).toBe(
      'audio-session-active',
    );
  });

  it('stop() detaches the host-bridge listener', async () => {
    const monitor = newMonitor();
    monitor.start();

    dispatchHostEvent(
      makeHostEvent({ interruption: { type: 'began', reason: null } }),
    );
    expect(getCurrentValue(monitor.audioHealth$).reason).toBe(
      'host-audio-session-interrupted',
    );

    await monitor.stop();
    dispatchHostEvent(
      makeHostEvent({ interruption: { type: 'began', reason: null } }),
    );

    // After stop(), health is reset and host events don't re-flip it.
    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'unknown',
      reason: 'not-started',
      direction: 'both',
    });
  });

  it('start() after stop() re-attaches the host-bridge listener', async () => {
    const monitor = newMonitor();
    monitor.start();
    await monitor.stop();
    monitor.start();

    dispatchHostEvent(
      makeHostEvent({ interruption: { type: 'began', reason: null } }),
    );

    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'unhealthy',
      reason: 'host-audio-session-interrupted',
      direction: 'both',
    });
  });

  // -------------------------------------------------------------------------
  // Host audio-session bridge: direction
  // -------------------------------------------------------------------------
  //
  // `host-audio-session-interrupted` always emits `direction: 'both'`
  // regardless of the host-claimed category. When iOS posts
  // `interruption.began`, WebKit's `RTCAudioSession` stops the audio
  // device entirely until the session is restored, so neither WebRTC
  // direction is alive while the interruption is in effect. The
  // category in the snapshot reflects the host's intent (output-only,
  // input-only, etc.) but does not keep WebRTC's other direction
  // working. See AUDIO-SESSIONS.md "audio stays dead until restore".

  it('emits direction=both for `host-audio-session-interrupted` with category=playback', () => {
    const monitor = newMonitor();
    monitor.start();

    dispatchHostEvent(
      makeHostEvent({
        session: { category: 'playback', mode: 'default', options: [] },
        interruption: { type: 'began', reason: null },
      }),
    );

    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'unhealthy',
      reason: 'host-audio-session-interrupted',
      direction: 'both',
    });
  });

  it('emits direction=both for `host-audio-session-interrupted` with category=record', () => {
    const monitor = newMonitor();
    monitor.start();

    dispatchHostEvent(
      makeHostEvent({
        session: { category: 'record', mode: 'default', options: [] },
        interruption: { type: 'began', reason: null },
      }),
    );

    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'unhealthy',
      reason: 'host-audio-session-interrupted',
      direction: 'both',
    });
  });

  it('emits direction=both for `host-audio-session-interrupted` with category=playAndRecord', () => {
    const monitor = newMonitor();
    monitor.start();

    dispatchHostEvent(
      makeHostEvent({
        session: { category: 'playAndRecord', mode: 'videoChat', options: [] },
        interruption: { type: 'began', reason: 'appWasSuspended' },
      }),
    );

    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'unhealthy',
      reason: 'host-audio-session-interrupted',
      direction: 'both',
    });
  });

  // -------------------------------------------------------------------------
  // Chrome-coverage: remote-tracks-muted
  // -------------------------------------------------------------------------

  /**
   * happy-dom doesn't model `MediaStreamTrack` mute semantics precisely,
   * so we use a plain object cast to MediaStreamTrack - the monitor only
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

    // Mute the first only - still healthy via the second.
    monitor.handleRemoteAudioTrackChange(a, 'muted');
    expect(getCurrentValue(monitor.audioHealth$).reason).toBe(
      'playback-verified',
    );

    // Mute both - minimum threshold satisfied (size === 2, all muted).
    monitor.handleRemoteAudioTrackChange(b, 'muted');
    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'unhealthy',
      reason: 'remote-tracks-muted',
      direction: 'playback',
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
      direction: 'both',
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
      direction: 'playback',
    });
  });

  it('does NOT fire remote-tracks-muted when only a single track is registered (1:1 calls)', () => {
    uninstallAudioSession();
    const monitor = newMonitor();
    monitor.start();

    monitor.handleRemoteAudioTrackChange(fakeTrack(), 'muted');

    // Single tracked track muted: per-sender hiccup is indistinguishable
    // from a client-wide problem, so the reducer falls through to
    // `pending` rather than reporting `remote-tracks-muted`.
    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'unknown',
      reason: 'pending',
      direction: 'both',
    });
  });

  // -------------------------------------------------------------------------
  // Chrome-coverage: element-paused
  // -------------------------------------------------------------------------

  it('flips to unhealthy/element-paused on onElementPausedChange', () => {
    const monitor = newMonitor();
    monitor.start();

    const el = document.createElement('audio');
    monitor.updateElementPausedState(el, true);

    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'unhealthy',
      reason: 'element-paused',
      direction: 'playback',
    });
  });

  it('clears element-paused when the last paused element unregisters', () => {
    uninstallAudioSession();
    const monitor = newMonitor();
    monitor.start();
    const el = document.createElement('audio');
    monitor.updateElementPausedState(el, true);
    expect(getCurrentValue(monitor.audioHealth$).reason).toBe('element-paused');

    monitor.updateElementPausedState(el, false);
    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'unknown',
      reason: 'pending',
      direction: 'both',
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
    monitor.updateAutoplayBlockedState(makeBlockedElement(), true);

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
    monitor.updateElementPausedState(document.createElement('audio'), true);
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
    // remote tracks yet → pending.
    expect(getCurrentValue(monitor.audioHealth$)).toEqual({
      status: 'unknown',
      reason: 'pending',
      direction: 'both',
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
      direction: 'both',
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
    monitor.updateElementPausedState(el, true);
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

  // -------------------------------------------------------------------------
  // Paused video elements
  // -------------------------------------------------------------------------
  //
  // The monitor mirrors the paused-audio retry loop for `<video>` elements
  // that the iOS WebView pauses during an `AVAudioSession` interruption.
  // Same bounded retry, same interruption gates, but silent - video pause
  // must never emit on `audioHealth$` (the signal stays audio-only).

  it('updateVideoElementPausedState(true) schedules a retry that calls .play()', async () => {
    vi.useFakeTimers();
    const monitor = newMonitor();
    monitor.start();

    const play = vi.fn().mockResolvedValue(undefined);
    const el = makeVideoElement(play);
    monitor.updateVideoElementPausedState(el, true);

    await vi.advanceTimersByTimeAsync(0);
    expect(play).toHaveBeenCalled();
    // @ts-expect-error private property
    expect(monitor.pausedVideo.elements.has(el)).toBe(false);
    vi.useRealTimers();
  });

  it('paused video retry stops at the max-attempts cap', async () => {
    vi.useFakeTimers();
    const monitor = newMonitor();
    monitor.start();

    const play = vi.fn().mockRejectedValue(new DOMException('', 'AbortError'));
    const el = makeVideoElement(play);
    monitor.updateVideoElementPausedState(el, true);

    // 6 attempts: initial (delay 0) + 5 retries (delay 500 each).
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(500 * 6);

    expect(play).toHaveBeenCalledTimes(6);
    // @ts-expect-error private property
    expect(monitor.pausedVideo.elements.has(el)).toBe(true);
    vi.useRealTimers();
  });

  it('paused video retry is suppressed while host-bridge interruption is began', async () => {
    vi.useFakeTimers();
    const monitor = newMonitor();
    monitor.start();

    dispatchHostEvent(
      makeHostEvent({ interruption: { type: 'began', reason: null } }),
    );

    const play = vi.fn().mockResolvedValue(undefined);
    const el = makeVideoElement(play);
    monitor.updateVideoElementPausedState(el, true);

    await vi.advanceTimersByTimeAsync(500 * 10);

    expect(play).not.toHaveBeenCalled();
    // @ts-expect-error private property
    expect(monitor.pausedVideo.elements.has(el)).toBe(true);
    vi.useRealTimers();
  });

  it('paused video retry is suppressed while audioSessionState is interrupted', async () => {
    vi.useFakeTimers();
    const monitor = newMonitor();
    monitor.start();
    audioSessionStub.state = 'interrupted';
    audioSessionStub.emitStateChange();

    const play = vi.fn().mockResolvedValue(undefined);
    const el = makeVideoElement(play);
    monitor.updateVideoElementPausedState(el, true);

    await vi.advanceTimersByTimeAsync(500 * 10);

    expect(play).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('paused video retry is suppressed while audioContext is interrupted', async () => {
    vi.useFakeTimers();
    const monitor = newMonitor();
    monitor.start();
    // @ts-expect-error private property
    const probe = monitor.audioContext as AudioContext & { state: string };
    // Make probe.resume() fail so the probe-context recovery loop can't
    // clear the interruption mid-test.
    probe.resume = vi
      .fn()
      .mockRejectedValue(new DOMException('', 'AbortError'));
    probe.state = 'interrupted';
    // @ts-expect-error private method
    monitor.onAudioContextStateChange();

    const play = vi.fn().mockResolvedValue(undefined);
    const el = makeVideoElement(play);
    monitor.updateVideoElementPausedState(el, true);

    await vi.advanceTimersByTimeAsync(500 * 10);

    expect(play).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('paused video retry restarts when host-bridge interruption clears', async () => {
    vi.useFakeTimers();
    const monitor = newMonitor();
    monitor.start();
    dispatchHostEvent(
      makeHostEvent({ interruption: { type: 'began', reason: null } }),
    );

    const play = vi.fn().mockResolvedValue(undefined);
    const el = makeVideoElement(play);
    monitor.updateVideoElementPausedState(el, true);
    await vi.advanceTimersByTimeAsync(500 * 2);
    expect(play).not.toHaveBeenCalled();

    // Interruption ends.
    dispatchHostEvent(
      makeHostEvent({ interruption: { type: 'ended', reason: null } }),
    );
    await vi.advanceTimersByTimeAsync(0);

    expect(play).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('paused video retry restarts when W3C audio session goes active', async () => {
    vi.useFakeTimers();
    const monitor = newMonitor();
    monitor.start();
    audioSessionStub.state = 'interrupted';
    audioSessionStub.emitStateChange();

    const play = vi.fn().mockResolvedValue(undefined);
    const el = makeVideoElement(play);
    monitor.updateVideoElementPausedState(el, true);
    await vi.advanceTimersByTimeAsync(500 * 2);
    expect(play).not.toHaveBeenCalled();

    audioSessionStub.state = 'active';
    audioSessionStub.emitStateChange();
    await vi.advanceTimersByTimeAsync(0);

    expect(play).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('paused video retry restarts when probe AudioContext clears interruption', async () => {
    vi.useFakeTimers();
    const monitor = newMonitor();
    monitor.start();
    // @ts-expect-error private property
    const probe = monitor.audioContext as AudioContext & { state: string };
    // Same as above - block auto-recovery so we control the transition.
    probe.resume = vi
      .fn()
      .mockRejectedValue(new DOMException('', 'AbortError'));
    probe.state = 'interrupted';
    // @ts-expect-error private method
    monitor.onAudioContextStateChange();

    const play = vi.fn().mockResolvedValue(undefined);
    const el = makeVideoElement(play);
    monitor.updateVideoElementPausedState(el, true);
    await vi.advanceTimersByTimeAsync(500 * 2);
    expect(play).not.toHaveBeenCalled();

    probe.state = 'running';
    // @ts-expect-error private method
    monitor.onAudioContextStateChange();
    await vi.advanceTimersByTimeAsync(0);

    expect(play).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('stop() clears the paused-video set and recovery timer', async () => {
    vi.useFakeTimers();
    const monitor = newMonitor();
    monitor.start();

    const play = vi.fn().mockRejectedValue(new DOMException('', 'AbortError'));
    const el = makeVideoElement(play);
    monitor.updateVideoElementPausedState(el, true);
    await vi.advanceTimersByTimeAsync(0);
    expect(play).toHaveBeenCalledTimes(1);

    await monitor.stop();

    // @ts-expect-error private property
    expect(monitor.pausedVideo.elements.size).toBe(0);
    // After stop, no scheduled timer should fire more play attempts.
    await vi.advanceTimersByTimeAsync(500 * 10);
    expect(play).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('updateVideoElementPausedState does NOT emit on audioHealth$', async () => {
    const monitor = newMonitor();
    monitor.start();

    const emissions: AudioHealthInfo[] = [];
    const sub = monitor.audioHealth$.subscribe((info) => emissions.push(info));
    const baselineCount = emissions.length;

    const el = makeVideoElement();
    monitor.updateVideoElementPausedState(el, true);
    monitor.updateVideoElementPausedState(el, false);

    expect(emissions.length).toBe(baselineCount);
    sub.unsubscribe();
  });

  it('updateVideoElementPausedState(el, false) on an unknown element is a no-op', () => {
    const monitor = newMonitor();
    monitor.start();

    const el = makeVideoElement();
    // No prior `true` for this element.
    expect(() =>
      monitor.updateVideoElementPausedState(el, false),
    ).not.toThrow();
    // @ts-expect-error private property
    expect(monitor.pausedVideo.elements.size).toBe(0);
  });

  it('resumeMedia() kicks both audio and video recovery loops', async () => {
    const monitor = newMonitor();
    monitor.start();

    const playAudio = vi.fn().mockResolvedValue(undefined);
    const playVideo = vi.fn().mockResolvedValue(undefined);
    const audioEl = makeBlockedElement(playAudio);
    const videoEl = makeVideoElement(playVideo);

    monitor.updateElementPausedState(audioEl, true);
    monitor.updateVideoElementPausedState(videoEl, true);

    await monitor.resumeMedia();

    expect(playAudio).toHaveBeenCalled();
    expect(playVideo).toHaveBeenCalled();
  });
});
