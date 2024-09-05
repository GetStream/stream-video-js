import { CallingState } from '../store';
import { Call } from '../Call';
import type { CallAcceptedEvent, CallRejectedEvent } from '../gen/coordinator';
import { CallEnded } from '../gen/video/sfu/event/events';
import { CallEndedReason } from '../gen/video/sfu/models/models';

/**
 * Event handler that watched the delivery of `call.accepted`.
 * Once the event is received, the call is joined.
 */
export const watchCallAccepted = (call: Call) => {
  return async function onCallAccepted(event: CallAcceptedEvent) {
    // We want to discard the event if it's from the current user
    if (event.user.id === call.currentUserId) return;
    const { state } = call;
    if (
      event.call.created_by.id === call.currentUserId &&
      state.callingState === CallingState.RINGING
    ) {
      await call.join();
    }
  };
};

/**
 * Event handler that watches delivery of `call.rejected` Websocket event.
 * Once the event is received, the call is left.
 */
export const watchCallRejected = (call: Call) => {
  return async function onCallRejected(event: CallRejectedEvent) {
    // We want to discard the event if it's from the current user
    if (event.user.id === call.currentUserId) return;
    const { call: eventCall } = event;
    const { session: callSession } = eventCall;

    if (!callSession) {
      call.logger(
        'warn',
        'No call session provided. Ignoring call.rejected event.',
        event,
      );
      return;
    }

    const rejectedBy = callSession.rejected_by;
    const { members, callingState } = call.state;
    if (callingState !== CallingState.RINGING) {
      call.logger(
        'info',
        'Call is not in ringing mode (it is either accepted or rejected already). Ignoring call.rejected event.',
        event,
      );
      return;
    }
    if (call.isCreatedByMe) {
      const everyoneElseRejected = members
        .filter((m) => m.user_id !== call.currentUserId)
        .every((m) => rejectedBy[m.user_id]);
      if (everyoneElseRejected) {
        call.logger('info', 'everyone rejected, leaving the call');
        await call.leave({ reason: 'ring: everyone rejected' });
      }
    } else {
      if (rejectedBy[eventCall.created_by.id]) {
        call.logger('info', 'call creator rejected, leaving call');
        await call.leave({ reason: 'ring: creator rejected' });
      }
    }
  };
};

/**
 * Event handler that watches the delivery of `call.ended` Websocket event.
 */
export const watchCallEnded = (call: Call) => {
  return function onCallEnded() {
    const { callingState } = call.state;
    if (
      callingState === CallingState.RINGING ||
      callingState === CallingState.JOINED ||
      callingState === CallingState.JOINING
    ) {
      call.leave({ reason: 'call.ended event received' }).catch((err) => {
        call.logger('error', 'Failed to leave call after call.ended ', err);
      });
    }
  };
};

/**
 * Watches for `callEnded` events.
 */
export const watchSfuCallEnded = (call: Call) => {
  return call.on('callEnded', async (e: CallEnded) => {
    if (call.state.callingState === CallingState.LEFT) return;
    try {
      // `call.ended` event arrived after the call is already left
      // and all event handlers are detached. We need to manually
      // update the call state to reflect the call has ended.
      call.state.setEndedAt(new Date());
      const reason = CallEndedReason[e.reason];
      await call.leave({ reason: `callEnded received: ${reason}` });
    } catch (err) {
      call.logger(
        'error',
        'Failed to leave call after being ended by the SFU',
        err,
      );
    }
  });
};
