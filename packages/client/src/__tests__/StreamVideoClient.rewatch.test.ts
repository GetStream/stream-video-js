import '../rtc/__tests__/mocks/webrtc.mocks';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StreamVideoClient } from '../StreamVideoClient';
import { Call } from '../Call';
import { CallRingPayload } from './data';
import { settled, withoutConcurrency } from '../helpers/concurrency';
import { getCallInitConcurrencyTag } from '../helpers/clientUtils';
import { CallingState } from '../store';
import { dateToNs } from '../helpers/time';
import type { StreamVideoEvent } from '../coordinator/connection/types';
import type {
  CallResponse,
  ConnectedEvent,
  GetCallResponse,
  MemberResponse,
  QueryCallsResponse,
  TimestampNS,
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
    vi.spyOn(client.streamClient, 'doAxiosRequest').mockResolvedValue({
      data: {
        duration: '1ms',
        call: CallRingPayload.call,
        members: CallRingPayload.members,
        own_capabilities: [],
      } as GetCallResponse,
    } as never);

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
      .spyOn(client.streamClient, 'doAxiosRequest')
      .mockResolvedValue({
        data: queryCallsResponse({ ...CallRingPayload.call, recording: true }),
      } as never);

    reconnect();

    const queryCallsRequest = () =>
      post.mock.calls.find(
        ([method, url]) => method === 'post' && String(url).endsWith('/calls'),
      );
    await vi.waitFor(() => expect(queryCallsRequest()).toBeDefined());
    expect(queryCallsRequest()?.[2]).toMatchObject({
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
    vi.spyOn(client.streamClient, 'doAxiosRequest').mockResolvedValue({
      data: queryCallsResponse({
        ...CallRingPayload.call,
        session: {
          ...session,
          accepted_by: { [userId]: dateToNs(new Date('2025-08-14T14:49:00Z')) },
        },
      }),
    } as never);

    reconnect();

    // accepted on another device -> this device should stop ringing
    await vi.waitFor(() => expect(leave).toHaveBeenCalled());
  });

  describe('ring reconciliation after a rewatch', () => {
    const rewatchWith = async (
      call: Call,
      rejected_by: Record<string, TimestampNS>,
      extra: {
        accepted_by?: Record<string, TimestampNS>;
        members?: MemberResponse[];
        ended_at?: TimestampNS;
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
        .mockResolvedValue({ data: response } as never);
      const updated = vi.spyOn(call, 'updateFromCallStateResponse');
      reconnect();
      await vi.waitFor(() => expect(post).toHaveBeenCalled());
      await vi.waitFor(() => expect(updated).toHaveBeenCalled());
      for (let i = 0; i < 5; i++) await Promise.resolve();
      return leave;
    };
    const rejectedAt = () => dateToNs(new Date('2025-08-14T14:49:00Z'));

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
          data: {
            duration: '1ms',
            call: payload.call,
            members,
            own_capabilities: [],
          } as GetCallResponse,
        } as never);
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
    vi.spyOn(client.streamClient, 'doAxiosRequest').mockResolvedValue({
      data: queryCallsResponse(CallRingPayload.call),
    } as never);

    const result = await client.queryCalls({ watch: true });
    const [dashboardCall] = result.calls;
    expect(dashboardCall).not.toBe(joinedCall);
    expect(client.state.calls[0]).toBe(joinedCall);

    await joinedCall.leave({ reject: false });

    client.streamClient.dispatchEvent({
      type: 'call.updated',
      call_cid: joinedCall.cid,
      created_at: dateToNs(new Date('2025-08-14T14:50:00Z')),
      call: { ...CallRingPayload.call, recording: true },
      capabilities_by_role: {},
    } as StreamVideoEvent);

    await vi.waitFor(() => expect(dashboardCall.state.recording).toBe(true));
  });

  it('creates and registers a new instance for unknown cids', async () => {
    vi.spyOn(client.streamClient, 'doAxiosRequest').mockResolvedValue({
      data: queryCallsResponse(CallRingPayload.call),
    } as never);

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
      .spyOn(client.streamClient, 'doAxiosRequest')
      .mockResolvedValue({
        data: queryCallsResponse(CallRingPayload.call),
      } as never);

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
    // and all of its event handlers released but the state updater, which a
    // watched call keeps until stopWatching()
    expect(client.state.calls).toHaveLength(0);
    expect(call.state.callingState).toBe(CallingState.LEFT);
    expect(countListeners(client)).toBe(listenersBeforeRing + 1);

    call.stopWatching();
    expect(countListeners(client)).toBe(listenersBeforeRing);
  });

  const disconnect = () => {
    client.streamClient.dispatchEvent({
      type: 'connection.changed',
      online: false,
    });
  };

  it('re-watches a left call after a reconnect, and catches it up', async () => {
    const call = await setupRingingCall();
    await call.leave({ reject: false });
    expect(client.state.calls).toHaveLength(0);
    expect(call.watching).toBe(true);

    disconnect();
    expect(call.watching).toBe(true);

    const post = vi
      .spyOn(client.streamClient, 'doAxiosRequest')
      .mockResolvedValue({
        data: queryCallsResponse({ ...CallRingPayload.call, recording: true }),
      } as never);
    reconnect();

    await vi.waitFor(() => expect(call.state.recording).toBe(true));
    const [, , body] = post.mock.calls.find(([, url]) =>
      String(url).endsWith('/calls'),
    )!;
    expect(body).toMatchObject({
      watch: true,
      filter_conditions: { cid: { $in: [call.cid] } },
    });
    expect(call.watching).toBe(true);
    // still left, and not listed again
    expect(call.state.callingState).toBe(CallingState.LEFT);
    expect(client.state.calls).toHaveLength(0);
    call.stopWatching();
  });

  it('does not re-watch a call that stopped watching', async () => {
    const call = await setupRingingCall();
    // still ringing: has to be left first
    expect(() => call.stopWatching()).toThrow();
    await call.leave({ reject: false });
    call.stopWatching();
    disconnect();

    const post = vi.spyOn(client.streamClient, 'doAxiosRequest');
    reconnect();
    await Promise.resolve();

    // no re-watch query (POST /calls) for it
    const rewatches = post.mock.calls.filter(
      ([method, url]) => method === 'post' && String(url).endsWith('/calls'),
    );
    expect(rewatches).toHaveLength(0);
    expect(call.watching).toBe(false);
  });

  it('does not add a second state updater when a left call is joined again', async () => {
    const call = await setupRingingCall();
    await call.leave({ reject: false });
    const listenersAfterLeave = countListeners(client);

    // setting the call up again (as get/join do) must not register the
    // state updater a second time
    await call.setup();
    await call.leave({ reject: false });
    expect(countListeners(client)).toBe(listenersAfterLeave);
    call.stopWatching();
  });

  it('stops every watched call when the user disconnects', async () => {
    const call = await setupRingingCall();
    await call.leave({ reject: false });
    const listenersBeforeDisconnect = countListeners(client);

    // connectUser is mocked in this suite, so set what disconnectUser checks
    client.streamClient.user = { id: userId };
    vi.spyOn(client.streamClient, 'disconnectUser').mockResolvedValue();
    await client.disconnectUser();

    expect(call.watching).toBe(false);
    expect(countListeners(client)).toBeLessThan(listenersBeforeDisconnect);
    client.streamClient.dispatchEvent({
      type: 'call.updated',
      call_cid: call.cid,
      created_at: dateToNs(new Date('2025-08-14T14:50:00Z')),
      call: { ...CallRingPayload.call, recording: true },
      capabilities_by_role: {},
    } as StreamVideoEvent);
    expect(call.state.recording).toBeFalsy();
  });

  describe('stopWatching()', () => {
    const getCallResponse = () =>
      ({
        data: {
          duration: '1ms',
          call: CallRingPayload.call,
          members: CallRingPayload.members,
          own_capabilities: [],
        } as GetCallResponse,
      }) as never;

    const dispatchRecording = (cid: string) =>
      client.streamClient.dispatchEvent({
        type: 'call.updated',
        call_cid: cid,
        created_at: dateToNs(new Date('2025-08-14T14:50:00Z')),
        call: { ...CallRingPayload.call, recording: true },
        capabilities_by_role: {},
      } as StreamVideoEvent);

    const newCall = () =>
      client.call(CallRingPayload.call.type, CallRingPayload.call.id);

    beforeEach(() => {
      vi.spyOn(client.streamClient, '_hasConnectionID').mockReturnValue(true);
    });

    it('keeps updating a call that is watched again', async () => {
      vi.spyOn(client.streamClient, 'doAxiosRequest').mockResolvedValue(
        getCallResponse(),
      );
      const call = newCall();
      await call.get();
      call.stopWatching();
      await call.get();

      expect(call.watching).toBe(true);
      dispatchRecording(call.cid);
      expect(call.state.recording).toBe(true);
      call.stopWatching();
    });

    it('is not undone by a get() that was in flight', async () => {
      let respond!: (value: unknown) => void;
      const request = vi
        .spyOn(client.streamClient, 'doAxiosRequest')
        .mockReturnValue(
          new Promise((resolve) => (respond = resolve)) as never,
        );
      const call = newCall();
      const pending = call.get();
      await vi.waitFor(() => expect(request).toHaveBeenCalled());

      call.stopWatching();
      respond(getCallResponse());
      await pending;

      expect(call.watching).toBe(false);
      expect(client.state.watchedCalls).not.toContain(call);
      dispatchRecording(call.cid);
      expect(call.state.recording).toBeFalsy();
    });

    it('leaves no state updater behind for a call that was never watched', async () => {
      vi.spyOn(client.streamClient, 'doAxiosRequest').mockRejectedValue(
        new Error('get failed'),
      );
      const listenersBefore = countListeners(client);
      const call = newCall();
      await expect(call.get()).rejects.toThrow('get failed');
      await call.leave();

      expect(client.state.watchedCalls).not.toContain(call);
      expect(countListeners(client)).toBe(listenersBefore);
    });

    it('keeps more than 100 left calls watched until explicitly stopped', async () => {
      const calls = Array.from({ length: 101 }, (_, i) => {
        const call = client.call('default', `leaving-${i}`);
        call['markWatched']();
        return call;
      });
      for (const call of calls) await call.leave();

      expect(client.state.watchedCalls).toHaveLength(101);
      expect(calls.every((call) => call.watching)).toBe(true);
      dispatchRecording(calls[0].cid);
      expect(calls[0].state.recording).toBe(true);

      for (const call of calls) call.stopWatching();
      expect(client.state.watchedCalls).toHaveLength(0);
    });

    it('does not refresh a registered instance that stopped watching on reconnect', async () => {
      vi.spyOn(client.streamClient, 'doAxiosRequest').mockResolvedValue(
        getCallResponse(),
      );
      const left = newCall();
      await left.get();
      await left.leave();
      const stopped = newCall();
      expect(stopped).not.toBe(left);
      await stopped.get();
      stopped.stopWatching();

      disconnect();
      vi.spyOn(client.streamClient, 'doAxiosRequest').mockResolvedValue({
        data: queryCallsResponse({ ...CallRingPayload.call, recording: true }),
      } as never);
      reconnect();

      await vi.waitFor(() => expect(left.state.recording).toBe(true));
      expect(stopped.state.recording).toBeFalsy();
      expect(stopped.watching).toBe(false);
      left.stopWatching();
    });
  });

  it('re-watches more than 100 calls in batches of 100', async () => {
    const calls = Array.from({ length: 150 }, (_, i) => {
      const call = client.call('default', `batch-${i}`);
      call['markWatched']();
      return call;
    });
    disconnect();

    const post = vi
      .spyOn(client.streamClient, 'doAxiosRequest')
      .mockResolvedValue({ data: { duration: '1ms', calls: [] } } as never);
    reconnect();

    const queries = () =>
      post.mock.calls.filter(
        ([method, url]) => method === 'post' && String(url).endsWith('/calls'),
      );
    await vi.waitFor(() => expect(queries()).toHaveLength(2));
    const bodies = queries().map(
      ([, , body]) =>
        body as never as {
          limit: number;
          filter_conditions: { cid: { $in: string[] } };
        },
    );
    expect(bodies.map((b) => b.filter_conditions.cid.$in.length)).toEqual([
      100, 50,
    ]);
    expect(bodies.map((b) => b.limit)).toEqual([100, 50]);
    for (const call of calls) call.stopWatching();
  });

  it('creates a fresh instance when the previous one has left', async () => {
    const call = await setupRingingCall();
    const post = vi
      .spyOn(client.streamClient, 'doAxiosRequest')
      .mockResolvedValue({
        data: queryCallsResponse(CallRingPayload.call),
      } as never);

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
