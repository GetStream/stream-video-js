import type { StreamWSClient } from './types';

export interface KeepAlive {
  cancelPendingPing: () => void;
  schedulePing: () => void;
  setPayload: (payload: Uint8Array) => void;
}

export const keepAlive = (
  client: StreamWSClient,
  timeThreshold: number,
): KeepAlive => {
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
