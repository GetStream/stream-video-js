import { StreamWebSocketClient } from './StreamWebSocketClient';

export const keepAlive = (
  client: StreamWebSocketClient,
  timeThreshold: number,
) => {
  let timeoutId: NodeJS.Timeout;
  let data: Uint8Array;
  return {
    schedulePing: () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        client.sendMessage(data);
      }, timeThreshold);
    },

    cancelPendingPing: () => {
      clearTimeout(timeoutId);
    },

    setPayload(payload: Uint8Array) {
      data = payload;
    },
  };
};

export type KeepAlive = ReturnType<typeof keepAlive>;
