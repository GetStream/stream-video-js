import { Error as SfuErrorEvent } from '../gen/video/sfu/event/events';
import {
  ErrorCode,
  WebsocketReconnectStrategy,
} from '../gen/video/sfu/models/models';

export class SfuJoinError extends Error {
  errorEvent: SfuErrorEvent;
  unrecoverable: boolean;

  constructor(event: SfuErrorEvent) {
    super(event.error?.message || 'Join Error');
    this.errorEvent = event;
    this.unrecoverable =
      event.reconnectStrategy === WebsocketReconnectStrategy.DISCONNECT;
  }

  static isJoinErrorCode(event: SfuErrorEvent): boolean {
    const code = event.error?.code;
    return (
      code === ErrorCode.SFU_FULL ||
      code === ErrorCode.SFU_SHUTTING_DOWN ||
      code === ErrorCode.CALL_PARTICIPANT_LIMIT_REACHED
    );
  }
}
