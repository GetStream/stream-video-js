import {
  CallAccepted,
  CallCancelled,
  CallCreated,
  CallRejected,
} from '../gen/video/coordinator/event_v1/event';
import { StreamVideoWriteableStateStore } from '../stateStore';
import { StreamVideoClient } from '../StreamVideoClient';

export const watchCallCreatedEvent = (
  client: StreamVideoClient,
  store: StreamVideoWriteableStateStore,
) => {
  return client.on('callCreated', (event: CallCreated) => {
    const { call } = event;
    if (!call) {
      console.warn("Can't find call in CallCreated event");
      return;
    } else {
      const currentIncomingRingCalls = store.getCurrentValue(
        store.incomingRingCallsSubject,
      );
      store.setCurrentValue(store.activeRingCallSubject, undefined);
      store.setCurrentValue(store.rejectedRingCallSubject, undefined);
      store.setCurrentValue(store.incomingRingCallsSubject, [
        ...currentIncomingRingCalls,
        call,
      ]);
    }
  });
};

export const watchCallAcceptedEvent = (
  client: StreamVideoClient,
  store: StreamVideoWriteableStateStore,
) => {
  return client.on('callAccepted', (event: CallAccepted) => {
    const { call } = event;
    if (!call) {
      console.warn("Can't find call in CallAccepted event");
      return;
    } else {
      const currentIncomingRingCalls = store.getCurrentValue(
        store.incomingRingCallsSubject,
      );
      store.setCurrentValue(store.activeRingCallSubject, call);
      store.setCurrentValue(
        store.incomingRingCallsSubject,
        currentIncomingRingCalls.filter(
          (currentIncomingRingCall) =>
            currentIncomingRingCall.callCid !== call.callCid,
        ),
      );
      store.setCurrentValue(store.rejectedRingCallSubject, undefined);
    }
  });
};

export const watchCallRejectedEvent = (
  client: StreamVideoClient,
  store: StreamVideoWriteableStateStore,
) => {
  return client.on('callRejected', (event: CallRejected) => {
    const { call } = event;
    if (!call) {
      console.warn("Can't find call in CallRejected event");
      return;
    } else {
      const currentIncomingRingCalls = store.getCurrentValue(
        store.incomingRingCallsSubject,
      );
      store.setCurrentValue(store.rejectedRingCallSubject, call);
      store.setCurrentValue(
        store.incomingRingCallsSubject,
        currentIncomingRingCalls.filter(
          (incomingRingCall) => incomingRingCall.callCid !== call.callCid,
        ),
      );
      store.setCurrentValue(store.activeRingCallSubject, undefined);
    }
  });
};

export const watchCallCancelledEvent = (
  client: StreamVideoClient,
  store: StreamVideoWriteableStateStore,
) => {
  return client.on('callCancelled', (event: CallCancelled) => {
    const { call } = event;
    if (!call) {
      console.log("Can't find call in CallCancelled event");
      return;
    } else {
      store.setCurrentValue(store.activeRingCallSubject, undefined);
      store.setCurrentValue(store.rejectedRingCallSubject, call);
    }
  });
};
