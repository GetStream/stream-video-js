import { CallState, StreamVideoWriteableStateStore } from '../store';
import { StreamVideoEvent } from '../coordinator/connection/types';

/**
 * Event handler that watched the delivery of CallAcceptedEvent
 * Updates the state store and notifies its subscribers that
 * the given user will be joining the call.
 */
export const watchCallAccepted = (store: StreamVideoWriteableStateStore) => {
  return function onCallAccepted(event: StreamVideoEvent) {
    if (event.type !== 'call.accepted') return;
    const { call_cid } = event;
    const acceptedIncomingCall = store.incomingCalls.find(
      (incomingCall) => incomingCall.cid === call_cid,
    );
    if (acceptedIncomingCall) {
      console.warn('Received CallAcceptedEvent for an incoming call');
      return;
    }

    const acceptedOutgoingCall = store.outgoingCalls.find(
      (outgoingCall) => outgoingCall.cid === call_cid,
    );
    const activeCall = store.activeCall;

    // FIXME OL: we should revisit this logic, it is hard to follow
    const acceptedActiveCall =
      activeCall?.cid !== undefined && activeCall.cid === call_cid
        ? activeCall
        : undefined;

    if (!acceptedOutgoingCall && !acceptedActiveCall) {
      console.warn(
        `CallAcceptedEvent received for a non-existent outgoing call (CID: ${call_cid}`,
      );
      return;
    }

    // once in active call, it is unnecessary to keep track of accepted call events
    if (call_cid === acceptedActiveCall?.cid) {
      return;
    }

    // do not set a new accepted call while in an active call? It would lead to joining a new active call.
    // todo: solve the situation of 2nd outgoing call being accepted in the UI SDK

    store.setAcceptedCall(event);
  };
};

/**
 * Event handler that watches delivery of CallRejected Websocket event.
 * Updates the state store and notifies its subscribers that
 * the given user will not be joining the call.
 */
export const watchCallRejected = (store: StreamVideoWriteableStateStore) => {
  return function onCallRejected(event: StreamVideoEvent) {
    if (event.type !== 'call.rejected') return;
    const { call_cid } = event;
    const rejectedIncomingCall = store.incomingCalls.find(
      (incomingCall) => incomingCall.cid === call_cid,
    );

    if (rejectedIncomingCall) {
      console.warn('Received CallRejectedEvent for an incoming call');
      return;
    }

    const rejectedOutgoingCall = store.outgoingCalls.find(
      (outgoingCall) => outgoingCall.cid === call_cid,
    );
    const activeCall = store.activeCall;
    const rejectedActiveCall =
      activeCall?.cid !== undefined && activeCall.cid === call_cid
        ? activeCall
        : undefined;

    if (!rejectedOutgoingCall && !rejectedActiveCall) {
      console.warn(
        `CallRejectedEvent received for a non-existent outgoing call (CID: ${call_cid}`,
      );
      return;
    }

    // FIXME: we should remove the call from pending once every callee has rejected, but for now we support only 1:1 ring calls
    store.setPendingCalls((pendingCalls) =>
      pendingCalls.filter((pendingCall) => pendingCall.cid !== call_cid),
    );
  };
};

/**
 * Event handler that watches the delivery of CallEndedEvent
 * Updates the state store and notifies its subscribers that
 * the call is now considered terminated.
 */
export const watchCallCancelled = (store: StreamVideoWriteableStateStore) => {
  return function onCallCancelled(event: StreamVideoEvent) {
    if (event.type !== 'call.ended') return;
    const { call_cid } = event;
    const cancelledIncomingCall = store.incomingCalls.find(
      (incomingCall) => incomingCall.cid === call_cid,
    );

    const activeCall = store.activeCall;
    const cancelledActiveCall =
      activeCall?.cid !== undefined && activeCall.cid === call_cid
        ? activeCall
        : undefined;

    if (!cancelledIncomingCall && !cancelledActiveCall) {
      console.warn(
        `CallEndedEvent received for a non-existent incoming call (CID: ${call_cid}`,
      );
      return;
    }

    store.setPendingCalls((pendingCalls) =>
      pendingCalls.filter((pendingCall) => pendingCall.cid !== call_cid),
    );
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
