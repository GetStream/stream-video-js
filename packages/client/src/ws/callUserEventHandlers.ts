import {
  watchCallAcceptedEvent,
  watchCallCancelledEvent,
  watchCallCreatedEvent,
  watchCallRejectedEvent,
} from '../events/callUserEvents';
import { StreamVideoWriteableStateStore } from '../store';
import { StreamVideoClient } from '../StreamVideoClient';

export const registerWSEventHandlers = (
  client: StreamVideoClient,
  store: StreamVideoWriteableStateStore,
) => {
  watchCallAcceptedEvent(client, store);
  watchCallCreatedEvent(client, store);
  watchCallRejectedEvent(client, store);
  watchCallCancelledEvent(client, store);
};
