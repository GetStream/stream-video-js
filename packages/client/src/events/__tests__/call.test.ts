import { describe, expect, it, vi } from 'vitest';
import {
  CallingState,
  CallState,
  StreamVideoWriteableStateStore,
} from '../../store';
import { watchCallEnded, watchCallUpdated } from '../call';
import { CallEndedEvent, CallUpdatedEvent } from '../../gen/coordinator';
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
      await handler(event);

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
