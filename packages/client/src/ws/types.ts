export type StreamEventListener<T> = (eventMessage: T) => void;

export interface StreamWSClient {
  sendMessage: (data: Uint8Array) => void;
  on: <T>(event: string, fn: StreamEventListener<T>) => () => void;
  off: <T>(event: string, fn: StreamEventListener<T>) => void;
  disconnect: () => void;
}
