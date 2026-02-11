import { Error as SfuErrorEvent } from '../gen/video/sfu/event/events';
import { WebsocketReconnectStrategy } from '../gen/video/sfu/models/models';

export class SfuJoinError extends Error {
  errorEvent: SfuErrorEvent;
  unrecoverable: boolean;

  constructor(event: SfuErrorEvent) {
    super(event.error?.message || 'Join Error');
    this.errorEvent = event;
    this.unrecoverable =
      event.reconnectStrategy === WebsocketReconnectStrategy.DISCONNECT;
  }
}
