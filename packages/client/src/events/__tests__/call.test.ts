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
    it(`will ignore events from the current user`, () => {
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
      handler(event);

      expect(call.join).not.toHaveBeenCalled();
    });

    it(`will join the call if at least one callee has accepted`, () => {
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
      handler(event);

      expect(call.join).toHaveBeenCalled();
    });
  });

  describe(`call.rejected`, () => {
    it(`will leave the call if all callees have rejected`, () => {
      const call = fakeCall();
      // @ts-expect-error
      call.state.setMembers([{ user_id: 'm1' }, { user_id: 'm2' }]);
      vi.spyOn(call, 'leave').mockImplementation(async () => {
        console.log(`TEST: leave() called`);
      });
      const handler = watchCallRejected(call);

      // all members reject the call
      call.state.members.forEach(() => {
        // @ts-ignore
        const event: CallAcceptedEvent = { type: 'call.rejected' };
        // @ts-ignore
        handler(event);
      });

      expect(call.leave).toHaveBeenCalled();
    });

    it(`will not leave the call if only one callee rejects`, () => {
      const call = fakeCall();
      // @ts-expect-error
      call.state.setMembers([{ user_id: 'm1' }, { user_id: 'm2' }]);
      vi.spyOn(call, 'leave').mockImplementation(async () => {
        console.log(`TEST: leave() called`);
      });
      const handler = watchCallRejected(call);

      // only one member rejects the call
      // @ts-ignore
      const event: CallAcceptedEvent = { type: 'call.rejected' };
      // @ts-ignore
      handler(event);

      expect(call.leave).not.toHaveBeenCalled();
    });
  });

  describe(`call.ended`, () => {
    it(`will leave the call unless joined`, () => {
      const call = fakeCall();
      vi.spyOn(call, 'leave').mockImplementation(async () => {
        console.log(`TEST: leave() called`);
      });
      const handler = watchCallEnded(call);

      // @ts-ignore
      const event: CallEndedEvent = { type: 'call.ended' };
      // @ts-ignore
      handler(event);

      expect(call.leave).toHaveBeenCalled();
    });

    it(`will not leave the call if joined`, async () => {
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
      handler(event);

      expect(call.leave).not.toHaveBeenCalled();
    });
  });
});

const fakeCall = () => {
  const store = new StreamVideoWriteableStateStore();
  store.setConnectedUser({
    id: 'test-user-id',
  });
  const client = new StreamClient('api-key');
  return new Call({
    type: 'development',
    id: '12345',
    clientStore: store,
    streamClient: client,
    ringing: true,
  });
};
