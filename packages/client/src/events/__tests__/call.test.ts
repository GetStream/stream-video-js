import { describe, expect, it, vi } from 'vitest';
import { CallingState, StreamVideoWriteableStateStore } from '../../store';
import {
  watchCallAccepted,
  watchCallEnded,
  watchCallRejected,
  watchSfuCallEnded,
} from '../call';
import {
  CallAcceptedEvent,
  CallEndedEvent,
  CallResponse,
  OwnCapability,
  RejectCallResponse,
} from '../../gen/coordinator';
import { Call } from '../../Call';
import { StreamClient } from '../../coordinator/connection/client';
import { SfuEvent } from '../../gen/video/sfu/event/events';
import { CallEndedReason } from '../../gen/video/sfu/models/models';

describe('Call ringing events', () => {
  describe(`call.accepted`, () => {
    it(`will ignore events from the current user`, async () => {
      const call = fakeCall();
      vi.spyOn(call, 'join');
      const handler = watchCallAccepted(call);
      const event: CallAcceptedEvent = {
        type: 'call.accepted',
        // @ts-expect-error incomplete data
        user: { id: 'test-user-id' },
      };
      await handler(event);

      expect(call.join).not.toHaveBeenCalled();
    });

    it(`will join the call for the caller if atleast one callee has accepted`, async () => {
      const call = fakeCall({ currentUserId: 'test-user' });
      vi.spyOn(call, 'join').mockImplementation(async () => {
        console.log(`TEST: join() called`);
      });
      const handler = watchCallAccepted(call);
      const event: CallAcceptedEvent = {
        type: 'call.accepted',
        // @ts-expect-error incomplete data
        user: { id: 'test-user-id-callee' },
        // @ts-expect-error incomplete data
        call: { created_by: { id: 'test-user' } },
      };
      await handler(event);

      expect(call.join).toHaveBeenCalled();
    });
  });

  it('will not join the call for the other callee automatically when someone accepts', async () => {
    const call = fakeCall({ currentUserId: 'test-user-id-callee-2' });
    vi.spyOn(call, 'join').mockImplementation(async () => {
      console.log(`TEST: join() called`);
    });
    const handler = watchCallAccepted(call);
    const event: CallAcceptedEvent = {
      type: 'call.accepted',
      // @ts-expect-error incomplete data
      user: { id: 'test-user-id-callee-1' },
      // @ts-expect-error incomplete data
      call: { created_by: { id: 'test-user-id-caller' } },
    };

    await handler(event);

    expect(call.join).not.toHaveBeenCalled();
  });

  describe(`call.rejected`, () => {
    it(`caller will leave the call if all callees have rejected`, async () => {
      const call = fakeCall({ currentUserId: 'm1' });
      call.state.updateFromCallResponse({
        ...fakeMetadata(),
        // @ts-expect-error type issue
        created_by: { id: 'm1' },
      });
      call.state.setMembers([
        // @ts-expect-error incomplete data
        { user_id: 'm1' },
        // @ts-expect-error incomplete data
        { user_id: 'm2' },
        // @ts-expect-error incomplete data
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
        // @ts-expect-error type issue
        user: {
          id: 'm2',
        },
        call: {
          // @ts-expect-error type issue
          created_by: {
            id: 'm1',
          },
          // @ts-expect-error type issue
          session: {
            rejected_by: {
              m2: new Date().toISOString(),
              m3: new Date().toISOString(),
            },
          },
        },
      });
      expect(call.leave).toHaveBeenCalledWith({
        reject: true,
        reason: 'cancel',
        message: 'ring: everyone rejected',
      });
    });

    it(`caller will not leave the call if only one callee rejects`, async () => {
      const call = fakeCall();
      call.state.updateFromCallResponse({
        ...fakeMetadata(),
        // @ts-expect-error type issue
        created_by: { id: 'm0' },
      });
      // @ts-expect-error incomplete data
      call.state.setMembers([{ user_id: 'm1' }, { user_id: 'm2' }]);
      vi.spyOn(call, 'leave').mockImplementation(async () => {
        console.log(`TEST: leave() called`);
      });
      const handler = watchCallRejected(call);

      // only one member rejects the call
      const event: CallAcceptedEvent = {
        type: 'call.rejected',
        // @ts-expect-error type issue
        user: {
          id: 'm2',
        },
        call: {
          // @ts-expect-error type issue
          created_by: {
            id: 'm0',
          },
          // @ts-expect-error type issue
          session: {
            rejected_by: {
              m2: new Date().toISOString(),
            },
          },
        },
      };
      await handler(event);

      expect(call.leave).not.toHaveBeenCalled();
    });

    it('callee will leave the call if caller rejects', async () => {
      const call = fakeCall({ currentUserId: 'm1' });
      call.state.updateFromCallResponse({
        ...fakeMetadata(),
        // @ts-expect-error type issue
        created_by: { id: 'm0' },
      });
      // @ts-expect-error incomplete data
      call.state.setMembers([{ user_id: 'm1' }, { user_id: 'm2' }]);
      vi.spyOn(call, 'leave').mockImplementation(async () => {
        console.log(`TEST: leave() called`);
      });
      const handler = watchCallRejected(call);

      // only one member rejects the call
      const event: CallAcceptedEvent = {
        type: 'call.rejected',
        // @ts-expect-error type issue
        user: {
          id: 'm0',
        },
        call: {
          // @ts-expect-error type issue
          created_by: {
            id: 'm0',
          },
          // @ts-expect-error type issue
          session: {
            rejected_by: {
              m0: new Date().toISOString(),
            },
          },
        },
      };
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
    ringing: ring,
  });
};

const fakeMetadata = (): CallResponse => {
  return {
    id: '12345',
    type: 'development',
    cid: 'development:12345',

    // @ts-expect-error type issue
    created_by: {
      id: 'test-user-id',
    },
    own_capabilities: [],
    blocked_user_ids: [],

    settings: {
      ring: {
        auto_cancel_timeout_ms: 30000,
        incoming_call_timeout_ms: 30000,
        missed_call_timeout_ms: 30000,
      },
      // @ts-expect-error type issue
      screensharing: {
        target_resolution: undefined,
      },
    },
  };
};
