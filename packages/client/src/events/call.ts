import {
  CallAccepted,
  CallCancelled,
  CallCreated,
  CallRejected,
} from '../gen/video/coordinator/event_v1/event';
import { StreamVideoWriteableStateStore } from '../stateStore';
import { StreamEventListener } from '../ws';
import { CallConfig } from '../config/types';

/**
 * Event handler that watches the delivery of CallCreated Websocket event
 * Updates the state store and notifies its subscribers that
 * a new pending call has been initiated.
 */
export const watchCallCreated = (
  on: <T>(event: string, fn: StreamEventListener<T>) => void,
  store: StreamVideoWriteableStateStore,
) => {
  on('callCreated', (event: CallCreated) => {
    const { call } = event;
    if (!call) {
      console.warn("Can't find call in CallCreated event");
      return;
    }

    const currentUser = store.getCurrentValue(store.connectedUserSubject);

    if (currentUser?.id === call.createdByUserId) {
      console.warn('Received CallCreated event sent by the current user');
      return;
    }

    store.setCurrentValue(store.pendingCallsSubject, (pendingCalls) => [
      ...pendingCalls,
      event,
    ]);
  });
};

/**
 * Event handler that watched the delivery of CallAccepted Websocket event
 * Updates the state store and notifies its subscribers that
 * the given user will be joining the call.
 */
export const watchCallAccepted = (
  on: <T>(event: string, fn: StreamEventListener<T>) => void,
  store: StreamVideoWriteableStateStore,
  clearCallCancellation: () => void,
) => {
  on('callAccepted', (event: CallAccepted) => {
    const { call } = event;
    if (!call) {
      console.warn("Can't find call in CallAccepted event");
      return;
    }

    // todo: verify that CallAccepted event is sent only to the creator of the call
    const currentUser = store.getCurrentValue(store.connectedUserSubject);

    if (currentUser?.id === event.senderUserId) {
      console.warn('Received CallAccepted event sent by the current user');
      return;
    }

    const rejectedIncomingCall = store
      .getCurrentValue(store.incomingCalls$)
      .find((incomingCall) => incomingCall.call?.callCid === call.callCid);

    if (rejectedIncomingCall) {
      console.warn('Received CallAccepted event for an incoming call');
      return;
    }

    const acceptedOutgoingCall = store
      .getCurrentValue(store.outgoingCalls$)
      .find(
        (outgoingCall) =>
          call.callCid !== undefined &&
          outgoingCall.call?.callCid === call.callCid,
      );
    const activeCall = store.getCurrentValue(store.activeCallSubject);
    const acceptedActiveCall =
      activeCall?.data.call?.callCid !== undefined &&
      activeCall.data.call.callCid === call.callCid
        ? activeCall
        : undefined;

    if (!acceptedOutgoingCall && !acceptedActiveCall) {
      console.warn(
        `CallAccepted event received for a non-existent outgoing call (CID: ${call.callCid}`,
      );
      return;
    }

    clearCallCancellation();
    store.setCurrentValue(store.acceptedCallSubject, event);
  });
};

/**
 * Event handler that watches delivery of CallRejected Websocket event.
 * Updates the state store and notifies its subscribers that
 * the given user will not be joining the call.
 */
export const watchCallRejected = (
  on: <T>(event: string, fn: StreamEventListener<T>) => void,
  store: StreamVideoWriteableStateStore,
  clearCallCancellation: () => void,
  callConfig: CallConfig,
) => {
  on('callRejected', (event: CallRejected) => {
    const { call } = event;
    if (!call) {
      console.warn("Can't find call in CallRejected event");
      return;
    }

    const currentUser = store.getCurrentValue(store.connectedUserSubject);
    if (currentUser?.id === event.senderUserId) {
      console.warn('Received CallRejected event sent by the current user');
      return;
    }

    const rejectedIncomingCall = store
      .getCurrentValue(store.incomingCalls$)
      .find((incomingCall) => incomingCall.call?.callCid === call.callCid);

    if (rejectedIncomingCall) {
      console.warn('Received CallRejected event for an incoming call');
      return;
    }

    const rejectedOutgoingCall = store
      .getCurrentValue(store.outgoingCalls$)
      .find(
        (outgoingCall) =>
          call.callCid !== undefined &&
          outgoingCall.call?.callCid === call.callCid,
      );
    const activeCall = store.getCurrentValue(store.activeCallSubject);
    const rejectedActiveCall =
      activeCall?.data.call?.callCid !== undefined &&
      activeCall.data.call.callCid === call.callCid
        ? activeCall
        : undefined;

    if (!rejectedOutgoingCall && !rejectedActiveCall) {
      console.warn(
        `CallRejected event received for a non-existent outgoing call (CID: ${call.callCid}`,
      );
      return;
    }

    // todo: clear call cancellation only if leaveCallOnLeftAlone enabled and really left alone
    const wasLeftAlone = undefined;
    if (callConfig.leaveCallOnLeftAlone && wasLeftAlone) {
      clearCallCancellation();
    }

    // currently not supporting automatic call drop for 1:M calls
    const memberUserIds = event.callDetails?.memberUserIds || [];
    if (memberUserIds.length > 1) {
      return;
    }

    store.setCurrentValue(store.pendingCallsSubject, (pendingCalls) =>
      pendingCalls.filter(
        (pendingCalls) => pendingCalls.call?.callCid !== event.call?.callCid,
      ),
    );
  });
};

/**
 * Event handler that watches the delivery of CallCancelled Websocket event
 * Updates the state store and notifies its subscribers that
 * the call is now considered terminated.
 */
export const watchCallCancelled = (
  on: <T>(event: string, fn: StreamEventListener<T>) => void,
  store: StreamVideoWriteableStateStore,
) => {
  on('callCancelled', (event: CallCancelled) => {
    const { call } = event;
    if (!call) {
      console.log("Can't find call in CallCancelled event");
      return;
    }

    const currentUser = store.getCurrentValue(store.connectedUserSubject);

    if (currentUser?.id === event.senderUserId) {
      console.warn('Received CallCancelled event sent by the current user');
      return;
    }

    store.setCurrentValue(store.pendingCallsSubject, (pendingCalls) =>
      pendingCalls.filter(
        (pendingCall) => pendingCall.call?.callCid !== event.call?.callCid,
      ),
    );
  });
};
