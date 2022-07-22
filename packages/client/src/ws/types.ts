import { WebsocketEvent } from '../gen/video_events/events';

export type StreamEventListener = (eventMessage: WebsocketEvent) => void;

export interface StreamWSClient {
  sendMessage: (data: Uint8Array) => void;
  on: (event: string, fn: StreamEventListener) => () => void;
  off: (event: string, fn: StreamEventListener) => void;
  disconnect: () => void;
}
