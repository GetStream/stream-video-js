/**
 * @vitest-environment happy-dom
 */

import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { BehaviorSubject } from 'rxjs';
import { AudioHealthAutoRecovery } from '../AudioHealthAutoRecovery';
import type {
  AudioHealthInfo,
  AudioHealthReason,
  AudioHealthStatus,
} from '../AudioHealthMonitor';
import { CameraManager } from '../../devices/CameraManager';
import { MicrophoneManager } from '../../devices/MicrophoneManager';
import { Tracer } from '../../stats';

describe('AudioHealthAutoRecovery', () => {
  let audioHealth$: BehaviorSubject<AudioHealthInfo>;
  let mic: { state: { status: string }; disable: Mock; enable: Mock };
  let cam: { state: { status: string }; disable: Mock; enable: Mock };
  let tracer: Tracer;
  const recoveries: AudioHealthAutoRecovery[] = [];

  const makeDevice = (status: 'enabled' | 'disabled' | undefined) => ({
    state: { status: status ?? 'disabled' },
    disable: vi.fn(() => Promise.resolve()),
    enable: vi.fn(() => Promise.resolve()),
  });

  beforeEach(() => {
    audioHealth$ = new BehaviorSubject<AudioHealthInfo>({
      status: 'unknown',
      reason: 'not-started',
    });
    mic = makeDevice('enabled');
    cam = makeDevice('enabled');
    tracer = new Tracer('test');
  });

  afterEach(() => {
    while (recoveries.length > 0) {
      recoveries.pop()!.stop();
    }
  });

  const newRecovery = (config = {}) => {
    const r = new AudioHealthAutoRecovery(
      audioHealth$,
      mic as unknown as MicrophoneManager,
      cam as unknown as CameraManager,
      tracer,
      config,
    );
    recoveries.push(r);
    return r;
  };

  const emit = (status: AudioHealthStatus, reason: AudioHealthReason) => {
    audioHealth$.next({ status, reason });
  };

  /**
   * Drains the `withoutConcurrency` chain that `createSafeAsyncSubscription`
   * uses to serialize handler invocations. The JS event loop drains all
   * pending microtasks before firing the next macrotask, so a single
   * `setTimeout(resolve, 0)` is enough to flush an arbitrarily long
   * handler chain - no magic-number drain loop required.
   *
   * NB: this assumes real timers. The debounce test uses a `Date.now`
   * spy instead of `vi.useFakeTimers()` for that reason.
   */
  const flushMicrotasks = () =>
    new Promise<void>((resolve) => setTimeout(resolve, 0));

  it('auto-mutes the mic on healthy → unhealthy with a local-capture reason', async () => {
    const r = newRecovery();
    r.start();

    emit('healthy', 'host-audio-session-active');
    emit('unhealthy', 'host-audio-session-interrupted');
    await flushMicrotasks();

    expect(mic.disable).toHaveBeenCalledTimes(1);
    expect(cam.disable).not.toHaveBeenCalled();
  });

  it('skips auto-mute when the reason is non-local-capture (autoplay-blocked)', async () => {
    const r = newRecovery();
    r.start();

    emit('healthy', 'host-audio-session-active');
    emit('unhealthy', 'autoplay-blocked');
    await flushMicrotasks();

    expect(mic.disable).not.toHaveBeenCalled();
  });

  it('skips auto-mute when the mic is already disabled (respects user mute)', async () => {
    mic.state.status = 'disabled';
    const r = newRecovery();
    r.start();

    emit('healthy', 'host-audio-session-active');
    emit('unhealthy', 'host-audio-session-interrupted');
    await flushMicrotasks();

    expect(mic.disable).not.toHaveBeenCalled();
  });

  it('skips auto-mute on transitions involving `unknown` (initial join noise)', async () => {
    const r = newRecovery();
    r.start();

    // unknown → unhealthy is the canonical "call just started, host bridge
    // hasn't snapshotted yet" sequence. Without the guard, every user
    // would auto-mute at call start.
    emit('unhealthy', 'host-audio-session-interrupted');
    await flushMicrotasks();

    expect(mic.disable).not.toHaveBeenCalled();
  });

  it('auto-mutes only on the second transition through unknown → healthy → unhealthy', async () => {
    const r = newRecovery();
    r.start();

    emit('healthy', 'host-audio-session-active');
    emit('unhealthy', 'host-audio-session-interrupted');
    await flushMicrotasks();

    expect(mic.disable).toHaveBeenCalledTimes(1);
  });

  it('debounces successive auto-mutes within the configured window', async () => {
    // Real timers (so `setTimeout(0)` in `flushMicrotasks` still fires)
    // + `Date.now` spy gives us a controllable clock without faking the
    // event loop.
    let now = 0;
    const dateNowSpy = vi.spyOn(Date, 'now').mockImplementation(() => now);

    // Disable cycling so this test exercises only the mute path - the
    // recovery cycle would also call mic.disable on the unhealthy →
    // healthy hop and confuse the count.
    const r = newRecovery({
      autoMuteDebounceMs: 1000,
      autoCycleMic: false,
    });
    r.start();

    // First flap → mute fires.
    emit('healthy', 'host-audio-session-active');
    emit('unhealthy', 'host-audio-session-interrupted');
    await flushMicrotasks();
    expect(mic.disable).toHaveBeenCalledTimes(1);

    // Second flap, 500ms later - within debounce → no mute.
    now = 500;
    mic.state.status = 'enabled'; // pretend the user re-enabled
    emit('healthy', 'host-audio-session-active');
    emit('unhealthy', 'host-audio-session-interrupted');
    await flushMicrotasks();
    expect(mic.disable).toHaveBeenCalledTimes(1);

    // Third flap, after debounce window - fires.
    now = 1500;
    emit('healthy', 'host-audio-session-active');
    emit('unhealthy', 'host-audio-session-interrupted');
    await flushMicrotasks();
    expect(mic.disable).toHaveBeenCalledTimes(2);

    dateNowSpy.mockRestore();
  });

  // -------------------------------------------------------------------------
  // Auto-cycle on recovery
  // -------------------------------------------------------------------------

  it('cycles mic and camera on unhealthy → healthy when both flags are set', async () => {
    const r = newRecovery({ autoCycleMic: true, autoCycleCamera: true });
    r.start();

    emit('unhealthy', 'host-audio-session-interrupted');
    emit('healthy', 'host-audio-session-active');
    await flushMicrotasks();

    expect(mic.disable).toHaveBeenCalledTimes(1);
    expect(mic.enable).toHaveBeenCalledTimes(1);
    expect(cam.disable).toHaveBeenCalledTimes(1);
    expect(cam.enable).toHaveBeenCalledTimes(1);
  });

  it('skips mic cycle when mic is disabled (e.g. previously auto-muted), still cycles camera', async () => {
    const r = newRecovery({ autoCycleMic: true, autoCycleCamera: true });
    r.start();

    mic.state.status = 'disabled';
    emit('unhealthy', 'host-audio-session-interrupted');
    emit('healthy', 'host-audio-session-active');
    await flushMicrotasks();

    expect(mic.disable).not.toHaveBeenCalled();
    expect(mic.enable).not.toHaveBeenCalled();
    expect(cam.disable).toHaveBeenCalledTimes(1);
    expect(cam.enable).toHaveBeenCalledTimes(1);
  });

  it('does not cycle when no flags are set', async () => {
    const r = newRecovery({ autoCycleMic: false, autoCycleCamera: false });
    r.start();

    emit('unhealthy', 'host-audio-session-interrupted');
    emit('healthy', 'host-audio-session-active');
    await flushMicrotasks();

    expect(mic.disable).not.toHaveBeenCalled();
    expect(cam.disable).not.toHaveBeenCalled();
  });

  // Regression for the Codex adversarial review finding: a quick
  // unhealthy → healthy hop right after auto-mute could re-enable a mic
  // the SDK had just intentionally muted. The fix relies on
  // `createSafeAsyncSubscription` serializing handler invocations via
  // `withoutConcurrency`, so the recovery handler can't run until the
  // auto-mute disable has actually settled (and flipped `state.status`
  // to `disabled`, which makes the cycle path skip naturally).
  it('does not re-enable the mic on a fast unhealthy → healthy flap after auto-mute', async () => {
    let resolveDisable!: () => void;
    const disablePromise = new Promise<void>((resolve) => {
      resolveDisable = resolve;
    });
    // Realistic device-manager behavior: `disable()` flips `state.status`
    // when its promise settles, not synchronously when called.
    mic.disable.mockImplementation(async () => {
      await disablePromise;
      mic.state.status = 'disabled';
    });

    const r = newRecovery({ autoMuteOnInterruption: true, autoCycleMic: true });
    r.start();

    emit('healthy', 'host-audio-session-active');
    emit('unhealthy', 'host-audio-session-interrupted');
    await flushMicrotasks();
    // Auto-mute kicked off but is still pending (disablePromise unresolved).
    expect(mic.disable).toHaveBeenCalledTimes(1);

    // Fast recovery hop - emission queues behind the in-flight handler.
    emit('healthy', 'host-audio-session-active');
    await flushMicrotasks();

    // Recovery handler hasn't run yet (still queued behind the auto-mute).
    expect(mic.enable).not.toHaveBeenCalled();

    // Let auto-mute settle. The recovery handler now runs; mic reads
    // `disabled`, so the cycle path skips it.
    resolveDisable();
    await flushMicrotasks();

    expect(mic.disable).toHaveBeenCalledTimes(1);
    expect(mic.enable).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  it('does nothing before start()', () => {
    newRecovery();
    emit('healthy', 'host-audio-session-active');
    emit('unhealthy', 'host-audio-session-interrupted');
    expect(mic.disable).not.toHaveBeenCalled();
  });

  it('detaches on stop() - emissions afterwards have no effect', async () => {
    const r = newRecovery({ autoCycleMic: true });
    r.start();

    emit('healthy', 'host-audio-session-active');
    r.stop();

    emit('unhealthy', 'host-audio-session-interrupted');
    emit('healthy', 'host-audio-session-active');
    await flushMicrotasks();

    expect(mic.disable).not.toHaveBeenCalled();
    expect(mic.enable).not.toHaveBeenCalled();
  });

  it('start() is idempotent - repeated calls do not double-subscribe', async () => {
    const r = newRecovery();
    r.start();
    r.start();
    r.start();

    emit('healthy', 'host-audio-session-active');
    emit('unhealthy', 'host-audio-session-interrupted');
    await flushMicrotasks();

    expect(mic.disable).toHaveBeenCalledTimes(1);
  });

  it('updateConfig() replaces the active config without re-subscribing', async () => {
    // updateConfig does a full replace (defaults fill unset fields), so
    // each test config must spell out every flag it cares about.
    const r = newRecovery({
      autoMuteOnInterruption: false,
      autoCycleMic: false,
    });
    r.start();

    emit('healthy', 'host-audio-session-active');
    emit('unhealthy', 'host-audio-session-interrupted');
    await flushMicrotasks();
    expect(mic.disable).not.toHaveBeenCalled();

    r.updateConfig({ autoMuteOnInterruption: true, autoCycleMic: false });

    emit('healthy', 'host-audio-session-active');
    emit('unhealthy', 'host-audio-session-interrupted');
    await flushMicrotasks();
    expect(mic.disable).toHaveBeenCalledTimes(1);
  });

  it('all flags off - no mic/camera calls regardless of transitions', async () => {
    const r = newRecovery({
      autoMuteOnInterruption: false,
      autoCycleMic: false,
      autoCycleCamera: false,
    });
    r.start();

    emit('healthy', 'host-audio-session-active');
    emit('unhealthy', 'host-audio-session-interrupted');
    emit('healthy', 'host-audio-session-active');
    await flushMicrotasks();

    expect(mic.disable).not.toHaveBeenCalled();
    expect(mic.enable).not.toHaveBeenCalled();
    expect(cam.disable).not.toHaveBeenCalled();
    expect(cam.enable).not.toHaveBeenCalled();
  });
});
