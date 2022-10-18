import type {KeepAlive} from './keepAlive';
import type {WebsocketEvent} from '../../gen/video/coordinator/client_v1_rpc/websocket';

export type WrappedEvent = WebsocketEvent['event'];
export type Envelopes = Omit<WebsocketEvent, 'event'>;

export type StreamEventListener<T = WrappedEvent> = (
  eventMessage: T,
  envelopes?: Envelopes,
) => void;

export interface StreamWSClient {
  sendMessage: (data: Uint8Array) => void;
  on: <T>(event: string, fn: StreamEventListener<T>) => () => void;
  off: <T>(event: string, fn: StreamEventListener<T>) => void;
  disconnect: () => void;

  keepAlive: KeepAlive;
}
