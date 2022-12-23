import type { WebsocketEvent } from '../gen/video/coordinator/client_v1_rpc/websocket';

export type WrappedEvent = WebsocketEvent['event'];
export type Envelopes = Omit<WebsocketEvent, 'event'>;

export type StreamEventListener<T = WrappedEvent> = (
  eventMessage: T,
  envelopes?: Envelopes,
) => void;
