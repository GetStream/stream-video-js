export type EventListener = (event: MessageEvent) => void;

export interface StreamWSClient {
  sendMessage: (data: Uint8Array) => void;
  on: (event: string, fn: EventListener) => () => void;
  off: (event: string, fn: EventListener) => void;
  disconnect: () => void;
}
