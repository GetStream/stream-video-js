import { describe, expect, it, vi } from 'vitest';
import { CallingState, StreamVideoWriteableStateStore } from '../../store';
import { watchCallEnded, watchSfuCallEnded } from '../call';
import {
  CallEndedEvent,
  OwnCapability,
  RejectCallResponse,
} from '../../gen/coordinator';
import { Call } from '../../Call';
import { StreamClient } from '../../coordinator/connection/client';
import { ClientEventReporter } from '../../reporting';
import { SfuEvent } from '../../gen/video/sfu/event/events';
import { CallEndedReason } from '../../gen/video/sfu/models/models';

describe('Call lifecycle events', () => {
  describe(`call.ended`, () => {
    it(`will leave the call unless joined`, async () => {
      const call = fakeCall();
      vi.spyOn(call, 'leave').mockImplementation(async () => {
        console.log(`TEST: leave() called`);
      });
      const handler = watchCallEnded(call);

      // @ts-expect-error type issue
      const event: CallEndedEvent = { type: 'call.ended' };
      // @ts-expect-error type issue
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

      // @ts-expect-error type issue
      const event: CallEndedEvent = { type: 'call.ended' };
      // @ts-expect-error type issue
      await handler(event);

      expect(call.leave).toHaveBeenCalled();
    });

    it(`will not leave the call if idle`, async () => {
      const call = fakeCall({ ring: false });
      vi.spyOn(call, 'leave').mockImplementation(async () => {
        console.log(`TEST: leave() called`);
      });

      const handler = watchCallEnded(call);

      // @ts-expect-error type issue
      const event: CallEndedEvent = { type: 'call.ended' };
      // @ts-expect-error type issue
      await handler(event);

      expect(call.leave).not.toHaveBeenCalled();
    });
  });

  describe('callEnded (SFU)', () => {
    it('will leave the call if not already left', async () => {
      const call = fakeCall();
      vi.spyOn(call, 'leave').mockImplementation(async () => {
        console.log(`TEST: leave() called`);
      });

      watchSfuCallEnded(call);
      const event: SfuEvent = {
        eventPayload: {
          oneofKind: 'callEnded',
          callEnded: { reason: CallEndedReason.ENDED },
        },
      };
      // @ts-expect-error type issue
      call['dispatcher'].dispatch(event);

      expect(call.leave).toHaveBeenCalled();
      expect(call.state.endedAt).toBeDefined();
    });

    it('will not leave the call if already left', async () => {
      const call = fakeCall();
      call.state.setCallingState(CallingState.LEFT);
      vi.spyOn(call, 'leave').mockImplementation(async () => {
        console.log(`TEST: leave() called`);
      });

      watchSfuCallEnded(call);
      const event: SfuEvent = {
        eventPayload: {
          oneofKind: 'callEnded',
          callEnded: { reason: CallEndedReason.KICKED },
        },
      };
      // @ts-expect-error type issue
      call['dispatcher'].dispatch(event);

      expect(call.leave).not.toHaveBeenCalled();
    });

    it('will stay in backstage if live ended and has permission', async () => {
      const call = fakeCall();
      call.state.setBackstage(false);
      call.permissionsContext.setPermissions([OwnCapability.JOIN_BACKSTAGE]);
      vi.spyOn(call, 'leave').mockImplementation(async () => {
        console.log(`TEST: leave() called`);
      });

      watchSfuCallEnded(call);
      const event: SfuEvent = {
        eventPayload: {
          oneofKind: 'callEnded',
          callEnded: { reason: CallEndedReason.LIVE_ENDED },
        },
      };
      // @ts-expect-error type issue
      call['dispatcher'].dispatch(event);

      expect(call.leave).not.toHaveBeenCalled();
      expect(call.state.backstage).toBe(true);
    });
  });

  describe('call.leave', () => {
    it('should not call reject when leaving under specific conditions', async () => {
      const call = fakeCall();
      call.state.setCallingState(CallingState.JOINED);
      const rejectSpy = vi
        .spyOn(call, 'reject')
        .mockImplementation(async () => {
          console.log('TEST: reject() called');
          return {} as RejectCallResponse;
        });

      await call.leave({ reject: false });

      expect(rejectSpy).not.toHaveBeenCalled();
    });

    it('should call reject when leaving while ringing and reject is true', async () => {
      const call = fakeCall();
      call.state.setCallingState(CallingState.RINGING);
      const rejectSpy = vi
        .spyOn(call, 'reject')
        .mockImplementation(async () => {
          console.log('TEST: reject() called');
          return {} as RejectCallResponse;
        });

      await call.leave({ reject: true });

      expect(rejectSpy).toHaveBeenCalled();
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
    language: '',
  });
  const client = new StreamClient('api-key');
  return new Call({
    type: 'development',
    id: '12345',
    clientStore: store,
    streamClient: client,
    clientEventReporter: new ClientEventReporter({ streamClient: client }),
    ringing: ring,
  });
};
