import { StreamVideoWriteableStateStore } from '../store';
import {
  CallAccepted,
  CallCancelled,
  CallCreated,
  CallRejected,
} from '../gen/coordinator';

/**
 * Event handler that watches the delivery of CallCreated Websocket event
 * Updates the state store and notifies its subscribers that
 * a new pending call has been initiated.
 */
export const watchCallCreated = (store: StreamVideoWriteableStateStore) => {
  return function onCallCreated(event: CallCreated) {
    const { call } = event;
    if (!call) {
      console.warn("Can't find call in CallCreated event");
      return;
    }

    const currentUser = store.getCurrentValue(store.connectedUserSubject);

    if (currentUser?.id === call.created_by.id) {
      console.warn('Received CallCreated event sent by the current user');
      return;
    }

    // FIXME OL: update store values
    // store.setCurrentValue(store.pendingCallsSubject, (pendingCalls) => [
    //   ...pendingCalls,
    //   { call: event.call, details: event.callDetails, users: envelopes.users },
    // ]);
  };
};

/**
 * Event handler that watched the delivery of CallAccepted Websocket event
 * Updates the state store and notifies its subscribers that
 * the given user will be joining the call.
 */
export const watchCallAccepted = (store: StreamVideoWriteableStateStore) => {
  return function onCallAccepted(event: CallAccepted) {
    const { call_cid } = event;
    if (!call_cid) {
      console.warn("Can't find call in CallAccepted event");
      return;
    }

    const acceptedIncomingCall = store
      .getCurrentValue(store.incomingCalls$)
      .find((incomingCall) => incomingCall.call?.callCid === call_cid);

    if (acceptedIncomingCall) {
      console.warn('Received CallAccepted event for an incoming call');
      return;
    }

    const acceptedOutgoingCall = store
      .getCurrentValue(store.outgoingCalls$)
      .find((outgoingCall) => outgoingCall.call?.callCid === call_cid);
    const activeCall = store.getCurrentValue(store.activeCallSubject);
    const acceptedActiveCall =
      activeCall?.data.call?.callCid !== undefined &&
      activeCall.data.call.callCid === call_cid
        ? activeCall
        : undefined;

    if (!acceptedOutgoingCall && !acceptedActiveCall) {
      console.warn(
        `CallAccepted event received for a non-existent outgoing call (CID: ${call_cid}`,
      );
      return;
    }

    // once in active call, it is unnecessary to keep track of accepted call events
    if (call_cid === acceptedActiveCall?.data.call?.callCid) {
      return;
    }

    // FIXME OL: update store values
    // store.setCurrentValue(store.acceptedCallSubject, event);
  };
};

/**
 * Event handler that watches delivery of CallRejected Websocket event.
 * Updates the state store and notifies its subscribers that
 * the given user will not be joining the call.
 */
export const watchCallRejected = (store: StreamVideoWriteableStateStore) => {
  return function onCallRejected(event: CallRejected) {
    const { call_cid } = event;
    if (!call_cid) {
      console.warn("Can't find call in CallRejected event");
      return;
    }

    const rejectedIncomingCall = store
      .getCurrentValue(store.incomingCalls$)
      .find((incomingCall) => incomingCall.call?.callCid === call_cid);

    if (rejectedIncomingCall) {
      console.warn('Received CallRejected event for an incoming call');
      return;
    }

    const rejectedOutgoingCall = store
      .getCurrentValue(store.outgoingCalls$)
      .find((outgoingCall) => outgoingCall.call?.callCid === call_cid);
    const activeCall = store.getCurrentValue(store.activeCallSubject);
    const rejectedActiveCall =
      activeCall?.data.call?.callCid !== undefined &&
      activeCall.data.call.callCid === call_cid
        ? activeCall
        : undefined;

    if (!rejectedOutgoingCall && !rejectedActiveCall) {
      console.warn(
        `CallRejected event received for a non-existent outgoing call (CID: ${call_cid}`,
      );
      return;
    }

    // FIXME OL: update store values
    // currently not supporting automatic call drop for 1:M calls
    // const wasLeftAlone =
    //   event.callDetails?.memberUserIds.length === 1 &&
    //   event.senderUserId === event.callDetails.memberUserIds[0];
    //
    // if (wasLeftAlone) {
    //   store.setCurrentValue(store.pendingCallsSubject, (pendingCalls) =>
    //     pendingCalls.filter(
    //       (pendingCalls) => pendingCalls.call?.callCid !== event.call?.callCid,
    //     ),
    //   );
    // }
  };
};

/**
 * Event handler that watches the delivery of CallCancelled Websocket event
 * Updates the state store and notifies its subscribers that
 * the call is now considered terminated.
 */
export const watchCallCancelled = (store: StreamVideoWriteableStateStore) => {
  return function onCallCancelled(event: CallCancelled) {
    const { call_cid } = event;
    if (!call_cid) {
      console.log("Can't find call in CallCancelled event");
      return;
    }

    const cancelledIncomingCall = store
      .getCurrentValue(store.incomingCalls$)
      .find((incomingCall) => incomingCall.call?.callCid === call_cid);

    const activeCall = store.getCurrentValue(store.activeCallSubject);
    const cancelledActiveCall =
      activeCall?.data.call?.callCid !== undefined &&
      activeCall.data.call.callCid === call_cid
        ? activeCall
        : undefined;

    if (!cancelledIncomingCall && !cancelledActiveCall) {
      console.warn(
        `CallCancelled event received for a non-existent incoming call (CID: ${call_cid}`,
      );
      return;
    }

    store.setCurrentValue(store.pendingCallsSubject, (pendingCalls) =>
      pendingCalls.filter(
        (pendingCalls) => pendingCalls.call?.callCid !== call_cid,
      ),
    );
  };
};
