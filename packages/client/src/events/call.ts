import {
  CallAccepted,
  CallCancelled,
  CallCreated,
  CallRejected,
} from '../gen/video/coordinator/event_v1/event';
import { StreamVideoWriteableStateStore } from '../store';
import { CallDropScheduler } from '../CallDropScheduler';
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
  callDropScheduler: CallDropScheduler,
  callConfig: CallConfig,
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

    const activeCall = store.getCurrentValue(store.activeCallSubject);

    if (
      callConfig.autoRejectWhenInCall &&
      activeCall &&
      activeCall.data.call?.callCid === call.callCid
    ) {
      callDropScheduler.scheduleReject(call.callCid, 500);
      // todo: should we record the automatic rejection in the store?
      return;
    }

    store.setCurrentValue(store.pendingCallsSubject, (pendingCalls) => [
      ...pendingCalls,
      event,
    ]);
    callDropScheduler.scheduleReject(
      call.callCid,
      callConfig.autoRejectTimeout,
    );
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
  callDropScheduler: CallDropScheduler,
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

    callDropScheduler.cancelDrop(call.callCid);
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
  callDropScheduler: CallDropScheduler,
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

    // currently not supporting automatic call drop for 1:M calls
    const wasLeftAlone =
      event.callDetails?.memberUserIds.length === 1 &&
      event.senderUserId === event.callDetails.memberUserIds[0];

    if (callConfig.leaveCallOnLeftAlone && wasLeftAlone) {
      callDropScheduler.cancelDrop(call.callCid);

      store.setCurrentValue(store.pendingCallsSubject, (pendingCalls) =>
        pendingCalls.filter(
          (pendingCalls) => pendingCalls.call?.callCid !== event.call?.callCid,
        ),
      );

      if (rejectedActiveCall) {
        rejectedActiveCall.leave();
      }
    }
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
  callDropScheduler: CallDropScheduler,
  callConfig: CallConfig,
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

    const cancelledOutgoingCall = store
      .getCurrentValue(store.outgoingCalls$)
      .find(
        (outgoingCall) =>
          call.callCid !== undefined &&
          outgoingCall.call?.callCid === call.callCid,
      );

    if (cancelledOutgoingCall) {
      console.warn(
        `Outgoing call cancelled by another user (userId: ${event.senderUserId})`,
      );
      return;
    }

    const cancelledIncomingCall = store
      .getCurrentValue(store.incomingCalls$)
      .find((incomingCall) => incomingCall.call?.callCid === call.callCid);

    const activeCall = store.getCurrentValue(store.activeCallSubject);
    const cancelledActiveCall =
      activeCall?.data.call?.callCid !== undefined &&
      activeCall.data.call.callCid === call.callCid
        ? activeCall
        : undefined;

    if (!cancelledIncomingCall && !cancelledActiveCall) {
      console.warn(
        `CallCancelled event received for a non-existent incoming call (CID: ${call.callCid}`,
      );
      return;
    }

    callDropScheduler.cancelDrop(call.callCid);

    store.setCurrentValue(store.pendingCallsSubject, (pendingCalls) =>
      pendingCalls.filter(
        (pendingCalls) => pendingCalls.call?.callCid !== event.call?.callCid,
      ),
    );

    // currently not supporting automatic call drop for 1:M calls
    const wasLeftAlone =
      event.callDetails?.memberUserIds.length === 1 &&
      event.senderUserId === event.callDetails.memberUserIds[0];
    if (
      callConfig.leaveCallOnLeftAlone &&
      wasLeftAlone &&
      cancelledActiveCall
    ) {
      cancelledActiveCall.leave();
    }
  });
};
