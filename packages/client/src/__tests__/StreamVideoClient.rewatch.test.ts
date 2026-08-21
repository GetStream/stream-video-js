import '../rtc/__tests__/mocks/webrtc.mocks';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StreamVideoClient } from '../StreamVideoClient';
import { Call } from '../Call';
import { CallRingPayload } from './data';
import { settled, withoutConcurrency } from '../helpers/concurrency';
import { getCallInitConcurrencyTag } from '../helpers/clientUtils';
import { CallingState } from '../store';
import type { StreamVideoEvent } from '../coordinator/connection/types';
import type {
  CallResponse,
  ConnectedEvent,
  GetCallResponse,
  QueryCallsResponse,
} from '../gen/coordinator';

const apiKey = 'mock-api-key';
// the receiver of the CallRingPayload fixture
const userId = 'marcelo';

const queryCallsResponse = (call: CallResponse): QueryCallsResponse => ({
  duration: '1ms',
  calls: [{ call, members: CallRingPayload.members, own_capabilities: [] }],
});

const countListeners = (client: StreamVideoClient) =>
  Object.values(client.streamClient.listeners).reduce(
    (count, listeners) => count + (listeners?.length ?? 0),
    0,
  );

describe('StreamVideoClient re-watching calls on reconnect', () => {
  let client: StreamVideoClient;

  beforeEach(async () => {
    client = new StreamVideoClient(apiKey, {
      // tests run in node, so we have to fake being in browser env
      browser: true,
    });
    client.streamClient.connectUser = vi.fn().mockResolvedValue({
      me: { id: userId },
    } as ConnectedEvent);
    await client.connectUser({ id: userId }, 'mock-token');
  });

  afterEach(() => {
    for (const call of client.state.calls) {
      call['cancelAutoDrop']();
    }
    vi.restoreAllMocks();
  });

  const setupRingingCall = async () => {
    vi.spyOn(client.streamClient, 'get').mockResolvedValue({
      duration: '1ms',
      call: CallRingPayload.call,
      members: CallRingPayload.members,
      own_capabilities: [],
    } as GetCallResponse);

    client.streamClient.dispatchEvent(CallRingPayload as StreamVideoEvent);
    await settled(getCallInitConcurrencyTag(CallRingPayload.call_cid));

    const [call] = client.state.calls;
    expect(call).toBeDefined();
    expect(call.watching).toBe(true);
    expect(call.state.callingState).toBe(CallingState.RINGING);
    return call;
  };

  const reconnect = () => {
    client.streamClient.dispatchEvent({
      type: 'connection.changed',
      online: true,
    });
  };

  it('reuses the registered instance and refreshes its state', async () => {
    const call = await setupRingingCall();
    const listenerCountBeforeReconnect = countListeners(client);

    const post = vi
      .spyOn(client.streamClient, 'post')
      .mockResolvedValue(
        queryCallsResponse({ ...CallRingPayload.call, recording: true }),
      );

    reconnect();

    await vi.waitFor(() => expect(post).toHaveBeenCalled());
    expect(post).toHaveBeenCalledWith('/calls', {
      watch: true,
      filter_conditions: { cid: { $in: [call.cid] } },
    });

    // the refreshed state must reach the instance the integrator holds
    await vi.waitFor(() => expect(call.state.recording).toBe(true));
    expect(client.state.calls).toHaveLength(1);
    expect(client.state.calls[0]).toBe(call);
    expect(call.watching).toBe(true);

    // re-watching must not leak event handlers (one orphaned Call
    // used to register its handlers on every reconnect)
    expect(countListeners(client)).toBe(listenerCountBeforeReconnect);
  });

  it('drops a ringing call accepted elsewhere while the socket was down', async () => {
    const call = await setupRingingCall();
    const leave = vi.spyOn(call, 'leave').mockResolvedValue(undefined);

    const session = CallRingPayload.call.session!;
    vi.spyOn(client.streamClient, 'post').mockResolvedValue(
      queryCallsResponse({
        ...CallRingPayload.call,
        session: {
          ...session,
          accepted_by: { [userId]: '2025-08-14T14:49:00Z' },
        },
      }),
    );

    reconnect();

    // accepted on another device -> this device should stop ringing
    await vi.waitFor(() => expect(leave).toHaveBeenCalled());
  });

  it('drops a ringing call cancelled by the caller while the socket was down', async () => {
    const call = await setupRingingCall();
    const leave = vi.spyOn(call, 'leave').mockResolvedValue(undefined);

    const session = CallRingPayload.call.session!;
    const callerId = CallRingPayload.call.created_by.id;
    vi.spyOn(client.streamClient, 'post').mockResolvedValue(
      queryCallsResponse({
        ...CallRingPayload.call,
        session: {
          ...session,
          rejected_by: { [callerId]: '2025-08-14T14:49:00Z' },
        },
      }),
    );

    reconnect();

    // the caller cancelled -> this device should stop ringing
    await vi.waitFor(() => expect(leave).toHaveBeenCalled());
  });

  it('drops a ringing call that ended while the socket was down', async () => {
    const call = await setupRingingCall();
    const leave = vi.spyOn(call, 'leave').mockResolvedValue(undefined);

    const session = CallRingPayload.call.session!;
    vi.spyOn(client.streamClient, 'post').mockResolvedValue(
      queryCallsResponse({
        ...CallRingPayload.call,
        ended_at: '2025-08-14T14:49:00Z',
        session: { ...session, ended_at: '2025-08-14T14:49:00Z' },
      }),
    );

    reconnect();

    // the call ended -> this device should stop ringing
    await vi.waitFor(() => expect(leave).toHaveBeenCalled());
  });

  it('queryCalls returns an independent instance for registered calls', async () => {
    // e.g. being on a call while watching a dashboard of calls:
    // leaving the joined instance must not silence the dashboard instance
    const joinedCall = await setupRingingCall();
    vi.spyOn(client.streamClient, 'post').mockResolvedValue(
      queryCallsResponse(CallRingPayload.call),
    );

    const result = await client.queryCalls({ watch: true });
    const [dashboardCall] = result.calls;
    expect(dashboardCall).not.toBe(joinedCall);
    expect(client.state.calls[0]).toBe(joinedCall);

    await joinedCall.leave({ reject: false });

    client.streamClient.dispatchEvent({
      type: 'call.updated',
      call_cid: joinedCall.cid,
      created_at: '2025-08-14T14:50:00Z',
      call: { ...CallRingPayload.call, recording: true },
    } as StreamVideoEvent);

    await vi.waitFor(() => expect(dashboardCall.state.recording).toBe(true));
  });

  it('creates and registers a new instance for unknown cids', async () => {
    vi.spyOn(client.streamClient, 'post').mockResolvedValue(
      queryCallsResponse(CallRingPayload.call),
    );

    const result = await client.queryCalls({ watch: true });

    expect(result.calls).toHaveLength(1);
    const [call] = result.calls;
    expect(call).toBeInstanceOf(Call);
    expect(call.watching).toBe(true);
    expect(client.state.calls[0]).toBe(call);
  });

  it('does not resurrect a call that leaves during a re-watch', async () => {
    const listenersBeforeRing = countListeners(client);
    const call = await setupRingingCall();
    const post = vi
      .spyOn(client.streamClient, 'post')
      .mockResolvedValue(queryCallsResponse(CallRingPayload.call));

    // hold the call's join/leave queue so leave() is still in flight
    // while the re-watch response is being processed
    let releaseGate!: () => void;
    const gate = new Promise<void>((resolve) => (releaseGate = resolve));
    withoutConcurrency(call['joinLeaveConcurrencyTag'], () => gate);
    const leavePromise = call.leave({ reject: false });

    reconnect();
    await vi.waitFor(() => expect(post).toHaveBeenCalled());
    await Promise.resolve();

    releaseGate();
    await leavePromise;

    // the left call must stay dead: not re-registered, not re-initialized,
    // and all of its event handlers released
    expect(client.state.calls).toHaveLength(0);
    expect(call.state.callingState).toBe(CallingState.LEFT);
    expect(countListeners(client)).toBe(listenersBeforeRing);
  });

  it('creates a fresh instance when the previous one has left', async () => {
    const call = await setupRingingCall();
    const post = vi
      .spyOn(client.streamClient, 'post')
      .mockResolvedValue(queryCallsResponse(CallRingPayload.call));

    // leaving unregisters the call from the client store
    await call.leave({ reject: false });
    expect(client.state.calls).toHaveLength(0);

    const result = await client.queryCalls({ watch: true });
    expect(post).toHaveBeenCalled();
    expect(result.calls).toHaveLength(1);
    expect(result.calls[0]).not.toBe(call);
    expect(client.state.calls[0]).toBe(result.calls[0]);
    expect(result.calls[0].watching).toBe(true);
  });
});
