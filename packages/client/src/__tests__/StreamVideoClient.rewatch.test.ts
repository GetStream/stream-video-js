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
  MemberResponse,
  QueryCallsResponse,
  UserResponse,
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

  describe('ring reconciliation after a rewatch', () => {
    const rewatchWith = async (
      call: Call,
      rejected_by: Record<string, string>,
      extra: {
        accepted_by?: Record<string, string>;
        members?: MemberResponse[];
        ended_at?: string;
      } = {},
    ) => {
      const leave = vi.spyOn(call, 'leave').mockResolvedValue(undefined);
      const session = CallRingPayload.call.session!;
      const response = queryCallsResponse({
        ...CallRingPayload.call,
        // keep the creator the call was set up with
        created_by: call.state.createdBy as UserResponse,
        ended_at: extra.ended_at,
        session: {
          ...session,
          rejected_by,
          accepted_by: extra.accepted_by ?? session.accepted_by,
        },
      });
      if (extra.members) response.calls[0].members = extra.members;
      const post = vi
        .spyOn(client.streamClient, 'doAxiosRequest')
        .mockResolvedValue(response as never);
      const updated = vi.spyOn(call, 'updateFromCallStateResponse');
      reconnect();
      await vi.waitFor(() => expect(post).toHaveBeenCalled());
      await vi.waitFor(() => expect(updated).toHaveBeenCalled());
      for (let i = 0; i < 5; i++) await Promise.resolve();
      return leave;
    };
    const rejectedAt = () => '2025-08-14T14:49:00Z';

    it('callee leaves when the creator cancelled while offline', async () => {
      const call = await setupRingingCall();
      const leave = await rewatchWith(call, { oliver_1: rejectedAt() });
      expect(leave).toHaveBeenCalledWith({
        reason: 'ended',
        message: 'ring: creator rejected',
      });
    });

    it('callee keeps ringing without a rejection', async () => {
      const call = await setupRingingCall();
      const leave = await rewatchWith(call, {});
      expect(leave).not.toHaveBeenCalled();
    });

    it('callee keeps ringing when only another member rejected', async () => {
      const call = await setupRingingCall();
      const leave = await rewatchWith(call, { someone_else: rejectedAt() });
      expect(leave).not.toHaveBeenCalled();
    });

    it('callee leaves when the call ended while offline', async () => {
      const call = await setupRingingCall();
      const leave = await rewatchWith(call, {}, { ended_at: rejectedAt() });
      expect(leave).toHaveBeenCalledWith({
        reason: 'ended',
        message: 'ring: call ended',
      });
    });

    it('does not reconcile a call that is not in RINGING state', async () => {
      const call = await setupRingingCall();
      call.state.setCallingState(CallingState.JOINED);
      const leave = await rewatchWith(call, { oliver_1: rejectedAt() });
      expect(leave).not.toHaveBeenCalled();
    });

    describe('as the caller', () => {
      const callee = CallRingPayload.members[0];
      const members = [
        callee,
        {
          ...callee,
          user_id: 'oliver_1',
          user: { ...callee.user, id: 'oliver_1' },
        },
      ];

      const setupOwnRingingCall = async () => {
        const payload = {
          ...CallRingPayload,
          call: {
            ...CallRingPayload.call,
            created_by: { ...CallRingPayload.call.created_by, id: userId },
          },
          members,
        };
        vi.spyOn(client.streamClient, 'doAxiosRequest').mockResolvedValue({
          duration: '1ms',
          call: payload.call,
          members,
          own_capabilities: [],
        } as GetCallResponse as never);
        client.streamClient.dispatchEvent(payload as StreamVideoEvent);
        await settled(getCallInitConcurrencyTag(payload.call_cid));
        const [call] = client.state.calls;
        expect(call.isCreatedByMe).toBeTruthy();
        expect(call.state.callingState).toBe(CallingState.RINGING);
        return call;
      };

      it('leaves when every other member rejected while offline', async () => {
        const call = await setupOwnRingingCall();
        const leave = await rewatchWith(
          call,
          { oliver_1: rejectedAt() },
          { members },
        );
        expect(leave).toHaveBeenCalledWith({
          reject: true,
          reason: 'cancel',
          message: 'ring: everyone rejected',
        });
      });

      it('joins when another member accepted while offline', async () => {
        const call = await setupOwnRingingCall();
        const join = vi.spyOn(call, 'join').mockResolvedValue(undefined);
        await rewatchWith(
          call,
          {},
          { members, accepted_by: { oliver_1: rejectedAt() } },
        );
        expect(join).toHaveBeenCalledWith({ joinSource: 'ring-poll-api' });
      });
    });
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
