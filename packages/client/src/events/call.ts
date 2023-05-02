import { CallingState, CallState } from '../store';
import { StreamVideoEvent } from '../coordinator/connection/types';
import { Call } from '../Call';

/**
 * Event handler that watched the delivery of `call.accepted`.
 * Once the event is received, the call is joined.
 */
export const watchCallAccepted = (call: Call) => {
  return async function onCallAccepted(event: StreamVideoEvent) {
    if (event.type !== 'call.accepted') return;
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
  let totalRejections = 0;
  return async function onCallRejected(event: StreamVideoEvent) {
    if (event.type !== 'call.rejected') return;
    totalRejections++;
    const { state } = call;
    if (totalRejections >= state.members.length) {
      await call.leave();
    }
  };
};

/**
 * Event handler that watches the delivery of `call.ended` Websocket event.
 */
export const watchCallEnded = (call: Call) => {
  return async function onCallCancelled(event: StreamVideoEvent) {
    if (event.type !== 'call.ended') return;
    if (call.state.callingState === CallingState.RINGING) {
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
