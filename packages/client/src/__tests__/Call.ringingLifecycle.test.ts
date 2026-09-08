/**
 * @vitest-environment happy-dom
 */

import '../rtc/__tests__/mocks/webrtc.mocks';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Call } from '../Call';
import { CallingState } from '../store';
import { StreamClient } from '../coordinator/connection/client';
import { ClientEventReporter } from '../reporting';
import { generateUUIDv4 } from '../coordinator/connection/utils';
import { StreamVideoWriteableStateStore } from '../store';

/**
 * The core's whole part in the React Native ringing lifecycle: await RN's
 * preparation inside the join, tell RN when a ringing join failed terminally or
 * the call ended, and stop a join that a `leave()` overtook. What preparation
 * and release actually do is RN's, and is tested there.
 */

const createCall = (ringing: boolean) => {
  const streamClient = new StreamClient('abc');
  return new Call({
    type: 'test',
    id: generateUUIDv4(),
    ringing,
    streamClient,
    clientEventReporter: new ClientEventReporter({ streamClient }),
    clientStore: new StreamVideoWriteableStateStore(),
  });
};

const install = (overrides: Record<string, unknown> = {}) => {
  const beforeJoin = vi.fn(() => Promise.resolve());
  const onJoinFailed = vi.fn(() => Promise.resolve());
  const onLeave = vi.fn();
  const callingX = { joinCall: vi.fn(), endCall: vi.fn() };
  globalThis.streamRNVideoSDK = {
    ringingCallLifecycle: { beforeJoin, onJoinFailed, onLeave },
    callingX,
    // `leave()` reaches this unconditionally; the globals object is all-or-nothing
    callManager: { setup: vi.fn(), start: vi.fn(), stop: vi.fn() },
    ...overrides,
  } as any;
  return { beforeJoin, onJoinFailed, onLeave, callingX };
};

describe('ringing call lifecycle integration', () => {
  beforeEach(() => {
    globalThis.streamRNVideoSDK = undefined;
  });

  afterEach(() => {
    globalThis.streamRNVideoSDK = undefined;
    vi.restoreAllMocks();
  });

  it('prepares a ringing call before it joins', async () => {
    const { beforeJoin, callingX } = install();
    const call = createCall(true);
    const doJoin = vi.spyOn(call as any, 'doJoin').mockResolvedValue(undefined);

    await call.join();

    expect(beforeJoin).toHaveBeenCalledTimes(1);
    expect(beforeJoin).toHaveBeenCalledBefore(callingX.joinCall);
    expect(doJoin).toHaveBeenCalledTimes(1);
  });

  it('leaves ordinary calls to join themselves', async () => {
    const { beforeJoin, onJoinFailed } = install();
    const call = createCall(false);
    vi.spyOn(call as any, 'doJoin').mockResolvedValue(undefined);

    await call.join();

    expect(beforeJoin).not.toHaveBeenCalled();
    expect(onJoinFailed).not.toHaveBeenCalled();
  });

  it('does not join when preparation fails, and reports the failure', async () => {
    const { beforeJoin, onJoinFailed } = install();
    beforeJoin.mockRejectedValue(new Error('no key'));
    const call = createCall(true);
    const doJoin = vi.spyOn(call as any, 'doJoin').mockResolvedValue(undefined);

    await expect(call.join()).rejects.toThrow('no key');

    expect(doJoin).not.toHaveBeenCalled();
    expect(onJoinFailed).toHaveBeenCalledWith(call);
  });

  it('reports a terminal join failure, keeping the original error', async () => {
    const { onJoinFailed } = install();
    const call = createCall(true);
    vi.spyOn(call as any, 'doJoin').mockRejectedValue(new Error('sfu down'));

    await expect(call.join({ maxJoinRetries: 1 })).rejects.toThrow('sfu down');

    expect(onJoinFailed).toHaveBeenCalledWith(call);
  });

  it('refuses a duplicate join on a live call without tearing it down', async () => {
    const { beforeJoin, onJoinFailed, onLeave } = install();
    const call = createCall(true);
    vi.spyOn(call as any, 'doJoin').mockImplementation(async () => {
      call.state.setCallingState(CallingState.JOINED);
    });

    await call.join();
    await expect(call.join()).rejects.toThrow('Illegal State');

    expect(beforeJoin).toHaveBeenCalledTimes(1);
    // the guard sits ahead of the failure boundary, so nothing is released
    expect(onJoinFailed).not.toHaveBeenCalled();
    expect(onLeave).not.toHaveBeenCalled();
  });

  it('tells the owner when a ringing call ends', async () => {
    const { onLeave } = install();
    const call = createCall(true);

    await call.leave();

    expect(onLeave).toHaveBeenCalledWith(call);
    expect(call.state.callingState).toBe(CallingState.LEFT);
  });

  it('does not tell the owner about an ordinary call', async () => {
    const { onLeave } = install();

    await createCall(false).leave();

    expect(onLeave).not.toHaveBeenCalled();
  });

  it('keeps an app-owned manager across leave, as setE2EEManager promises', async () => {
    install();
    const call = createCall(true);
    const manager = { encrypt: vi.fn(), decrypt: vi.fn() } as any;
    call.setE2EEManager(manager);

    await call.leave();

    expect(call.e2eeManager).toBe(manager);
  });

  it('abandons a join that a leave overtook during native registration', async () => {
    let finishRegistration: () => void = () => {};
    const { callingX } = install();
    callingX.joinCall.mockImplementation(
      () => new Promise<void>((resolve) => (finishRegistration = resolve)),
    );
    const call = createCall(true);
    const doJoin = vi.spyOn(call as any, 'doJoin').mockResolvedValue(undefined);

    const joining = call.join();
    await vi.waitFor(() => expect(callingX.joinCall).toHaveBeenCalled());
    await call.leave({ reject: false });
    finishRegistration();

    await expect(joining).rejects.toThrow(
      /left while the join was in progress/i,
    );
    // `doJoin` captures the generation itself, so this check has to be here
    expect(doJoin).not.toHaveBeenCalled();
  });

  it('does not resume the retry loop after a leave during backoff', async () => {
    vi.useFakeTimers();
    try {
      install();
      const call = createCall(true);
      const doJoin = vi
        .spyOn(call as any, 'doJoin')
        .mockRejectedValue(new Error('recoverable'));

      const joining = call.join().catch(() => {});
      await vi.waitFor(() => expect(doJoin).toHaveBeenCalledTimes(1));
      await call.leave({ reject: false });
      await vi.advanceTimersByTimeAsync(30_000);
      await joining;

      expect(doJoin).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('prepares an outgoing call that this join makes ringing', async () => {
    const { beforeJoin } = install();
    // a fresh instance, not ringing until its first join says so
    const call = createCall(false);
    vi.spyOn(call as any, 'doJoin').mockResolvedValue(undefined);

    await call.join({ ring: true });

    // reading `call.ringing` before applying `options.ring` would skip
    // preparation entirely on this path
    expect(beforeJoin).toHaveBeenCalledTimes(1);
  });

  it('stops a join that a leave overtook during preparation', async () => {
    let releaseHook: () => void = () => {};
    const { beforeJoin } = install();
    beforeJoin.mockImplementation(
      () => new Promise<void>((resolve) => (releaseHook = resolve)),
    );
    const call = createCall(true);
    const doJoin = vi.spyOn(call as any, 'doJoin').mockResolvedValue(undefined);

    const joining = call.join();
    await vi.waitFor(() => expect(beforeJoin).toHaveBeenCalled());
    await call.leave({ reject: false });
    releaseHook();

    await expect(joining).rejects.toThrow(
      /left while the join was in progress/i,
    );
    expect(doJoin).not.toHaveBeenCalled();
    expect(call.state.callingState).toBe(CallingState.LEFT);
  });

  it('is inert when no React Native globals are registered', async () => {
    const call = createCall(true);
    await expect(call.leave()).resolves.not.toThrow();
  });
});
