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
 * The core's whole part in the React Native ringing lifecycle: hand a ringing
 * join to the RN owner, tell it when the call ends, and stop a join that a
 * `leave()` overtook. Setup, duplicate-trigger policy and release ordering are
 * the RN runner's, and are tested there.
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
  const runJoin = vi.fn((_call: Call, proceed: () => Promise<void>) =>
    proceed(),
  );
  const onLeave = vi.fn();
  const callingX = { joinCall: vi.fn(), endCall: vi.fn() };
  globalThis.streamRNVideoSDK = {
    ringingCallLifecycle: { runJoin, onLeave },
    callingX,
    // `leave()` reaches this unconditionally; the globals object is all-or-nothing
    callManager: { setup: vi.fn(), start: vi.fn(), stop: vi.fn() },
    ...overrides,
  } as any;
  return { runJoin, onLeave, callingX };
};

describe('ringing call lifecycle integration', () => {
  beforeEach(() => {
    globalThis.streamRNVideoSDK = undefined;
  });

  afterEach(() => {
    globalThis.streamRNVideoSDK = undefined;
    vi.restoreAllMocks();
  });

  it('routes a ringing join through the React Native owner', async () => {
    const { runJoin } = install();
    const call = createCall(true);
    const doJoin = vi.spyOn(call as any, 'doJoin').mockResolvedValue(undefined);

    await call.join();

    expect(runJoin).toHaveBeenCalledTimes(1);
    expect(doJoin).toHaveBeenCalledTimes(1);
  });

  it('leaves ordinary calls to join themselves', async () => {
    const { runJoin } = install();
    const call = createCall(false);
    vi.spyOn(call as any, 'doJoin').mockResolvedValue(undefined);

    await call.join();

    expect(runJoin).not.toHaveBeenCalled();
  });

  it('does not join when the owner refuses', async () => {
    const { runJoin } = install();
    runJoin.mockRejectedValue(new Error('no key'));
    const call = createCall(true);
    const doJoin = vi.spyOn(call as any, 'doJoin').mockResolvedValue(undefined);

    await expect(call.join()).rejects.toThrow('no key');

    expect(doJoin).not.toHaveBeenCalled();
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

  it('registers natively again on an ordinary rejoin of a reused instance', async () => {
    const { callingX } = install();
    callingX.joinCall.mockResolvedValue(undefined);
    const call = createCall(true);
    vi.spyOn(call as any, 'doJoin').mockResolvedValue(undefined);

    await call.join();
    await call.leave({ reject: false });
    callingX.joinCall.mockClear();
    await call.join({ ring: true });

    // the instance is still LEFT here - `setup()` only resets it afterwards
    expect(callingX.joinCall).toHaveBeenCalledTimes(1);
  });

  it('F1: routes a reused LEFT instance through the owner when join says ring', async () => {
    const { runJoin } = install();
    const call = createCall(false); // not ringing yet
    vi.spyOn(call as any, 'doJoin').mockResolvedValue(undefined);

    await call.join({ ring: true });

    // `options.ring` is what makes this a ringing call; reading `call.ringing`
    // alone would skip setup entirely
    expect(runJoin).toHaveBeenCalledTimes(1);
  });

  it('F2: a leave awaiting its response still stops the delayed join', async () => {
    let releaseHook: () => void = () => {};
    const { runJoin } = install();
    runJoin.mockImplementation(
      async (_c: Call, proceed: () => Promise<void>) => {
        await new Promise<void>((resolve) => (releaseHook = resolve));
        return proceed();
      },
    );
    const call = createCall(true);
    const doJoin = vi.spyOn(call as any, 'doJoin').mockResolvedValue(undefined);

    const joining = call.join();
    await vi.waitFor(() => expect(runJoin).toHaveBeenCalled());
    await call.leave({ reject: false });
    releaseHook();

    await expect(joining).rejects.toThrow(/left while the pre-join setup/i);
    expect(doJoin).not.toHaveBeenCalled();
    expect(call.state.callingState).toBe(CallingState.LEFT);
  });

  it('is inert when no React Native globals are registered', async () => {
    const call = createCall(true);
    await expect(call.leave()).resolves.not.toThrow();
  });
});
