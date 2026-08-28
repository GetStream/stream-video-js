import { describe, expect, it, vi } from 'vitest';
import { fromPartial } from '@total-typescript/shoehorn';
import { reconcileRingState } from '../reconcileRingState';
import { CallingState, StreamVideoWriteableStateStore } from '../../store';
import {
  CallResponse,
  CallSessionResponse,
  MemberResponse,
} from '../../gen/coordinator';
import { Call } from '../../Call';
import { StreamClient } from '../../coordinator/connection/client';
import { ClientEventReporter } from '../../reporting';
import { settled } from '../../helpers/concurrency';

describe('reconcileRingState', () => {
  describe('acceptance', () => {
    it('ignores an acceptance by the current user', async () => {
      const call = ringingCall({ currentUserId: 'm1', createdById: 'm1' });
      setSession(call, { accepted_by: { m1: timestamp() } });

      expect(await reconcileRingState(call)).toBe(false);
      expect(call.join).not.toHaveBeenCalled();
    });

    it('joins the call for the caller once a callee has accepted', async () => {
      const call = ringingCall({ currentUserId: 'm1', createdById: 'm1' });
      setSession(call, { accepted_by: { m2: timestamp() } });

      expect(await reconcileRingState(call)).toBe(true);
      expect(call.join).toHaveBeenCalled();
    });

    it('is not terminal when the join fails, so a retry can follow', async () => {
      const call = ringingCall({ currentUserId: 'm1', createdById: 'm1' });
      setSession(call, { accepted_by: { m2: timestamp() } });
      vi.mocked(call.join).mockRejectedValueOnce(new Error('transient'));

      expect(await reconcileRingState(call)).toBe(false);
      expect(call.join).toHaveBeenCalled();
      expect(call.leave).not.toHaveBeenCalled();
    });

    it('does not join another callee when someone else accepts', async () => {
      const call = ringingCall({ currentUserId: 'm2', createdById: 'm0' });
      setSession(call, { accepted_by: { m1: timestamp() } });

      expect(await reconcileRingState(call)).toBe(false);
      expect(call.join).not.toHaveBeenCalled();
    });
  });

  describe('rejection', () => {
    it('cancels the call once every callee has rejected', async () => {
      const call = ringingCall({
        currentUserId: 'm1',
        createdById: 'm1',
        members: ['m1', 'm2', 'm3'],
      });
      setSession(call, {
        rejected_by: { m2: timestamp(), m3: timestamp() },
      });

      expect(await reconcileRingState(call)).toBe(true);
      expect(call.leave).toHaveBeenCalledWith({
        reject: true,
        reason: 'cancel',
        message: 'ring: everyone rejected',
      });
    });

    it('keeps ringing while only one callee has rejected', async () => {
      const call = ringingCall({
        currentUserId: 'm0',
        createdById: 'm0',
        members: ['m0', 'm1', 'm2'],
      });
      setSession(call, { rejected_by: { m2: timestamp() } });

      expect(await reconcileRingState(call)).toBe(false);
      expect(call.leave).not.toHaveBeenCalled();
    });

    it('leaves a callee once the caller has cancelled', async () => {
      const call = ringingCall({
        currentUserId: 'm1',
        createdById: 'm0',
        members: ['m0', 'm1', 'm2'],
      });
      setSession(call, { rejected_by: { m0: timestamp() } });

      expect(await reconcileRingState(call)).toBe(true);
      expect(call.leave).toHaveBeenCalledWith({
        message: 'ring: creator rejected',
      });
    });

    it('keeps a callee ringing while another callee rejects', async () => {
      const call = ringingCall({
        currentUserId: 'm1',
        createdById: 'm0',
        members: ['m0', 'm1', 'm2'],
      });
      setSession(call, { rejected_by: { m2: timestamp() } });

      expect(await reconcileRingState(call)).toBe(false);
      expect(call.leave).not.toHaveBeenCalled();
    });
  });

  describe('missed', () => {
    it('drops the call once every callee has missed it', async () => {
      const call = ringingCall({
        currentUserId: 'm1',
        createdById: 'm1',
        members: ['m1', 'm2', 'm3'],
      });
      setSession(call, {
        missed_by: { m2: timestamp(), m3: timestamp() },
      });

      expect(await reconcileRingState(call)).toBe(true);
      expect(call.leave).toHaveBeenCalledWith({
        reject: true,
        reason: 'timeout',
        message: 'ring: no one accepted',
      });
    });

    it('drops the call when the callees are split between rejected and missed', async () => {
      const call = ringingCall({
        currentUserId: 'm1',
        createdById: 'm1',
        members: ['m1', 'm2', 'm3'],
      });
      setSession(call, {
        rejected_by: { m2: timestamp() },
        missed_by: { m3: timestamp() },
      });

      expect(await reconcileRingState(call)).toBe(true);
      expect(call.leave).toHaveBeenCalledWith({
        reject: true,
        reason: 'timeout',
        message: 'ring: no one accepted',
      });
    });

    it('keeps ringing while one callee can still accept', async () => {
      const call = ringingCall({
        currentUserId: 'm1',
        createdById: 'm1',
        members: ['m1', 'm2', 'm3'],
      });
      setSession(call, { missed_by: { m2: timestamp() } });

      expect(await reconcileRingState(call)).toBe(false);
      expect(call.leave).not.toHaveBeenCalled();
    });
  });

  describe('ended call', () => {
    it('leaves without rejecting, even when the call was accepted', async () => {
      const call = ringingCall({ currentUserId: 'm1', createdById: 'm1' });
      setSession(call, {
        accepted_by: { m2: timestamp() },
        ended_at: timestamp(),
      });

      expect(await reconcileRingState(call)).toBe(true);
      expect(call.join).not.toHaveBeenCalled();
      expect(call.leave).toHaveBeenCalledWith({
        reject: false,
        message: 'ring: call ended',
      });
    });

    it('leaves when the call itself has ended', async () => {
      const call = ringingCall({ currentUserId: 'm1', createdById: 'm1' });
      setSession(call, {});
      call.state.setEndedAt(new Date());

      expect(await reconcileRingState(call)).toBe(true);
      expect(call.leave).toHaveBeenCalledWith({
        reject: false,
        message: 'ring: call ended',
      });
    });
  });

  it('is terminal once the call is no longer ringing', async () => {
    const call = ringingCall({ currentUserId: 'm1', createdById: 'm1' });
    setSession(call, { accepted_by: { m2: timestamp() } });
    call.state.setCallingState(CallingState.JOINED);

    expect(await reconcileRingState(call)).toBe(true);
    expect(call.join).not.toHaveBeenCalled();
    expect(call.leave).not.toHaveBeenCalled();
  });

  // Pins the ordering the state-driven reconciler depends on: `Call.setup`
  // registers `updateFromEvent` as an `all` listener, and `dispatchEvent`
  // drains those before the typed ring handlers. Reconciling from state would
  // silently read the previous session if either side changed.
  it('sees the event data on the state by the time a ring handler runs', async () => {
    const call = ringingCall({ currentUserId: 'm1', createdById: 'm1' });
    await call.setup();
    call.state.setCallingState(CallingState.RINGING);

    call.streamClient.dispatchEvent(
      fromPartial({
        type: 'call.accepted',
        call_cid: call.cid,
        created_at: new Date().toISOString(),
        user: { id: 'm2' },
        call: {
          ...callResponse('m1'),
          session: {
            id: 'session-1',
            accepted_by: { m2: timestamp() },
            rejected_by: {},
            missed_by: {},
            participants: [],
            participants_count_by_role: {},
          },
        },
      }),
    );
    await settled(call['joinLeaveConcurrencyTag']);

    expect(call.join).toHaveBeenCalled();
  });

  it('keeps ringing when the call has no members yet', async () => {
    const call = ringingCall({
      currentUserId: 'm1',
      createdById: 'm1',
      members: [],
    });
    setSession(call, {});

    expect(await reconcileRingState(call)).toBe(false);
    expect(call.leave).not.toHaveBeenCalled();
  });
});

const timestamp = () => new Date().toISOString();

const callResponse = (createdById: string) =>
  fromPartial<CallResponse>({
    id: '12345',
    type: 'development',
    cid: 'development:12345',
    created_by: { id: createdById },
    blocked_user_ids: [],
    egress: {},
    settings: {
      ring: {
        auto_cancel_timeout_ms: 30_000,
        incoming_call_timeout_ms: 30_000,
        missed_call_timeout_ms: 30_000,
      },
      screensharing: { target_resolution: undefined },
    },
  });

const setSession = (call: Call, session: Partial<CallSessionResponse>) => {
  call.state['sessionSubject'].next(
    fromPartial({
      accepted_by: {},
      rejected_by: {},
      missed_by: {},
      ...session,
    }),
  );
};

const ringingCall = ({
  currentUserId,
  createdById,
  members = [currentUserId, 'm2'],
}: {
  currentUserId: string;
  createdById: string;
  members?: string[];
}) => {
  const store = new StreamVideoWriteableStateStore();
  store.setConnectedUser(fromPartial({ id: currentUserId }));
  const streamClient = new StreamClient('api-key');
  const call = new Call({
    type: 'development',
    id: '12345',
    clientStore: store,
    streamClient,
    clientEventReporter: new ClientEventReporter({ streamClient }),
    ringing: true,
  });

  call.state.updateFromCallResponse(callResponse(createdById));
  call.state.setMembers(
    members.map((userId) => fromPartial<MemberResponse>({ user_id: userId })),
  );
  call.state.setCallingState(CallingState.RINGING);

  vi.spyOn(call, 'join').mockResolvedValue(undefined);
  vi.spyOn(call, 'leave').mockResolvedValue(undefined);

  return call;
};
