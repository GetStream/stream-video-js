import { StreamVideoWriteableStateStore } from '../store';
import { Call } from '../rtc/Call';
import { StreamClient } from '../coordinator/connection/client';
import { StreamVideoEvent } from '../coordinator/connection/types';

/**
 * Event handler that watches the delivery of CallCreated Websocket event
 * Updates the state store and notifies its subscribers that
 * a new pending call has been initiated.
 */
export const watchCallCreated = (
  store: StreamVideoWriteableStateStore,
  streamClient: StreamClient,
) => {
  return function onCallCreated(event: StreamVideoEvent) {
    if (event.type !== 'call.created') {
      return;
    }
    const { call, members } = event;
    if (!call) {
      console.warn("Can't find call in CallCreatedEvent");
      return;
    }

    const currentUser = store.connectedUser;
    if (currentUser?.id === call.created_by.id) {
      console.warn('Received CallCreatedEvent sent by the current user');
      return;
    }

    store.pendingCalls = [
      ...store.pendingCalls,
      new Call({
        streamClient,
        type: call.type,
        id: call.id,
        metadata: call,
        members,
        clientStore: store,
      }),
    ];
  };
};

/**
 * Event handler that watched the delivery of CallAcceptedEvent
 * Updates the state store and notifies its subscribers that
 * the given user will be joining the call.
 */
export const watchCallAccepted = (store: StreamVideoWriteableStateStore) => {
  return function onCallAccepted(event: StreamVideoEvent) {
    if (event.type !== 'call.accepted') {
      return;
    }
    const { call_cid } = event;
    if (!call_cid) {
      console.warn("Can't find call_cid in CallAcceptedEvent");
      return;
    }

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

    store.acceptedCall = event;
  };
};

/**
 * Event handler that watches delivery of CallRejected Websocket event.
 * Updates the state store and notifies its subscribers that
 * the given user will not be joining the call.
 */
export const watchCallRejected = (store: StreamVideoWriteableStateStore) => {
  return function onCallRejected(event: StreamVideoEvent) {
    if (event.type !== 'call.rejected') {
      return;
    }
    const { call_cid } = event;
    if (!call_cid) {
      console.warn("Can't find call_cid in CallRejectedEvent");
      return;
    }

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

    store.pendingCalls = store.pendingCalls.filter(
      (pendingCall) => pendingCall.cid !== call_cid,
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
    if (event.type !== 'call.ended') {
      return;
    }
    const { call_cid } = event;
    if (!call_cid) {
      console.log("Can't find call in CallEndedEvent");
      return;
    }

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

    store.pendingCalls = store.pendingCalls.filter(
      (pendingCall) => pendingCall.cid !== call_cid,
    );
  };
};
