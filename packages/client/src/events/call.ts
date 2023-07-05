import { CallingState, CallState } from '../store';
import { StreamVideoEvent } from '../coordinator/connection/types';
import { Call } from '../Call';

/**
 * Event handler that watched the delivery of `call.accepted`.
 * Once the event is received, the call is joined.
 */
export const watchCallAccepted = (call: Call) => {
  return async function onCallAccepted(event: StreamVideoEvent) {
    if (
      event.type !== 'call.accepted' ||
      // We want to discard the event if it's from the current user
      event.user.id === call.currentUserId
    ) {
      return;
    }
    const { state } = call;
    if (state.callingState === CallingState.RINGING) {
      await call.join();
    }
  };
};

/**
 * Event handler that watches delivery of `call.rejected` Websocket event.
 * Once the event is received, the call is left.
 */
export const watchCallRejected = (call: Call) => {
  return async function onCallRejected(event: StreamVideoEvent) {
    if (event.type !== 'call.rejected') return;
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
        'warn',
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
        await call.leave();
      }
    } else {
      if (rejectedBy[eventCall.created_by.id]) {
        call.logger('info', 'call creator rejected, leaving call');
        await call.leave();
      }
    }
  };
};

/**
 * Event handler that watches the delivery of `call.ended` Websocket event.
 */
export const watchCallEnded = (call: Call) => {
  return async function onCallCancelled(event: StreamVideoEvent) {
    if (event.type !== 'call.ended') return;
    if (
      call.state.callingState === CallingState.RINGING ||
      call.state.callingState === CallingState.JOINED ||
      call.state.callingState === CallingState.JOINING
    ) {
      await call.leave();
    }
  };
};

/**
 * An event handler which listens to `call.updated` events
 * and updates the given call state accordingly.
 */
export const watchCallUpdated = (state: CallState) => {
  return function onCallUpdated(event: StreamVideoEvent) {
    if (event.type !== 'call.updated') return;
    state.setMetadata(event.call);
  };
};
