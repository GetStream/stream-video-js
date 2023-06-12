import { describe, expect, it, vi } from 'vitest';
import {
  CallingState,
  CallState,
  StreamVideoWriteableStateStore,
} from '../../store';
import {
  watchCallAccepted,
  watchCallEnded,
  watchCallRejected,
  watchCallUpdated,
} from '../call';
import {
  CallAcceptedEvent,
  CallEndedEvent,
  CallResponse,
  CallUpdatedEvent,
} from '../../gen/coordinator';
import { Call } from '../../Call';
import { StreamClient } from '../../coordinator/connection/client';

describe('Call ringing events', () => {
  describe('call.updated', () => {
    it(`will update the call's metadata`, () => {
      const state = new CallState();
      const handler = watchCallUpdated(state);
      const event: CallUpdatedEvent = {
        type: 'call.updated',
        call_cid: 'development:12345',
        // @ts-expect-error
        call: {
          cid: 'development:12345',
        },
      };

      // @ts-ignore
      handler(event);
      expect(state.metadata).toEqual(event.call);
    });

    it(`will ignore unknown events`, () => {
      const state = new CallState();
      const handler = watchCallUpdated(state);
      const event = {
        type: 'call.updated.unknown',
        call_cid: 'development:12345',
        call: {
          cid: 'development:12345',
        },
      };

      // @ts-ignore
      handler(event);
      expect(state.metadata).toBeUndefined();
    });
  });

  describe(`call.accepted`, () => {
    it(`will ignore events from the current user`, async () => {
      const call = fakeCall();
      vi.spyOn(call, 'join');
      const handler = watchCallAccepted(call);
      const event: CallAcceptedEvent = {
        type: 'call.accepted',
        // @ts-expect-error
        user: {
          id: 'test-user-id',
        },
      };
      // @ts-ignore
      await handler(event);

      expect(call.join).not.toHaveBeenCalled();
    });

    it(`will join the call if at least one callee has accepted`, async () => {
      const call = fakeCall();
      vi.spyOn(call, 'join').mockImplementation(async () => {
        console.log(`TEST: join() called`);
      });
      const handler = watchCallAccepted(call);
      const event: CallAcceptedEvent = {
        type: 'call.accepted',
        // @ts-expect-error
        user: {
          id: 'test-user-id-callee',
        },
      };
      // @ts-ignore
      await handler(event);

      expect(call.join).toHaveBeenCalled();
    });
  });

  describe(`call.rejected`, () => {
    it(`caller will leave the call if all callees have rejected`, async () => {
      const call = fakeCall({ currentUserId: 'm1' });
      call.state.setMetadata({
        ...fakeMetadata(),
        // @ts-ignore
        created_by: { id: 'm1' },
      });
      call.state.setMembers([
        // @ts-expect-error
        { user_id: 'm1' },
        // @ts-expect-error
        { user_id: 'm2' },
        // @ts-expect-error
        { user_id: 'm3' },
      ]);
      call.state.setCallingState(CallingState.RINGING);
      vi.spyOn(call, 'leave').mockImplementation(async () => {
        console.log(`TEST: leave() called`);
      });

      const handler = watchCallRejected(call);
      // all members reject the call
      await handler({
        type: 'call.rejected',
        // @ts-ignore
        user: {
          id: 'm2',
        },
        call: {
          // @ts-ignore
          created_by: {
            id: 'm1',
          },
          // @ts-ignore
          session: {
            rejected_by: {
              m2: new Date().toISOString(),
              m3: new Date().toISOString(),
            },
          },
        },
      });
      expect(call.leave).toHaveBeenCalled();
    });

    it(`caller will not leave the call if only one callee rejects`, async () => {
      const call = fakeCall();
      call.state.setMetadata({
        ...fakeMetadata(),
        // @ts-ignore
        created_by: { id: 'm0' },
      });
      // @ts-expect-error
      call.state.setMembers([{ user_id: 'm1' }, { user_id: 'm2' }]);
      vi.spyOn(call, 'leave').mockImplementation(async () => {
        console.log(`TEST: leave() called`);
      });
      const handler = watchCallRejected(call);

      // only one member rejects the call
      // @ts-ignore
      const event: CallAcceptedEvent = {
        type: 'call.rejected',
        // @ts-ignore
        user: {
          id: 'm2',
        },
        call: {
          // @ts-ignore
          created_by: {
            id: 'm0',
          },
          // @ts-ignore
          session: {
            rejected_by: {
              m2: new Date().toISOString(),
            },
          },
        },
      };
      // @ts-ignore
      await handler(event);

      expect(call.leave).not.toHaveBeenCalled();
    });

    it('callee will leave the call if caller rejects', async () => {
      const call = fakeCall({ currentUserId: 'm1' });
      call.state.setMetadata({
        ...fakeMetadata(),
        // @ts-ignore
        created_by: { id: 'm0' },
      });
      // @ts-expect-error
      call.state.setMembers([{ user_id: 'm1' }, { user_id: 'm2' }]);
      vi.spyOn(call, 'leave').mockImplementation(async () => {
        console.log(`TEST: leave() called`);
      });
      const handler = watchCallRejected(call);

      // only one member rejects the call
      // @ts-ignore
      const event: CallAcceptedEvent = {
        type: 'call.rejected',
        // @ts-ignore
        user: {
          id: 'm0',
        },
        call: {
          // @ts-ignore
          created_by: {
            id: 'm0',
          },
          // @ts-ignore
          session: {
            rejected_by: {
              m0: new Date().toISOString(),
            },
          },
        },
      };
      // @ts-ignore
      await handler(event);

      expect(call.leave).toHaveBeenCalled();
    });
  });

  describe(`call.ended`, () => {
    it(`will leave the call unless joined`, async () => {
      const call = fakeCall();
      vi.spyOn(call, 'leave').mockImplementation(async () => {
        console.log(`TEST: leave() called`);
      });
      const handler = watchCallEnded(call);

      // @ts-ignore
      const event: CallEndedEvent = { type: 'call.ended' };
      // @ts-ignore
      await handler(event);

      expect(call.leave).toHaveBeenCalled();
    });

    it(`will leave the call if joined`, async () => {
      const call = fakeCall();
      vi.spyOn(call, 'join').mockImplementation(async () => {
        console.log(`TEST: join() called`);
        call.state.setCallingState(CallingState.JOINED);
      });
      vi.spyOn(call, 'leave').mockImplementation(async () => {
        console.log(`TEST: leave() called`);
      });

      await call.join();

      const handler = watchCallEnded(call);

      // @ts-ignore
      const event: CallEndedEvent = { type: 'call.ended' };
      // @ts-ignore
      await handler(event);

      expect(call.leave).toHaveBeenCalled();
    });

    it(`will not leave the call if idle`, async () => {
      const call = fakeCall({ ring: false });
      vi.spyOn(call, 'leave').mockImplementation(async () => {
        console.log(`TEST: leave() called`);
      });

      const handler = watchCallEnded(call);

      // @ts-ignore
      const event: CallEndedEvent = { type: 'call.ended' };
      // @ts-ignore
      await handler(event);

      expect(call.leave).not.toHaveBeenCalled();
    });
  });
});

const fakeCall = ({ ring = true, currentUserId = 'test-user-id' } = {}) => {
  const store = new StreamVideoWriteableStateStore();
  store.setConnectedUser({
    id: currentUserId,
    created_at: '',
    updated_at: '',
    role: '',
    custom: {},
    teams: [],
    devices: [],
  });
  const client = new StreamClient('api-key');
  return new Call({
    type: 'development',
    id: '12345',
    clientStore: store,
    streamClient: client,
    ringing: ring,
  });
};

const fakeMetadata = (): CallResponse => {
  return {
    id: '12345',
    type: 'development',
    cid: 'development:12345',

    // @ts-ignore
    created_by: {
      id: 'test-user-id',
    },
    own_capabilities: [],
    blocked_user_ids: [],

    // @ts-ignore
    settings: {
      ring: {
        auto_cancel_timeout_ms: 30000,
        incoming_call_timeout_ms: 30000,
      },
    },
  };
};
