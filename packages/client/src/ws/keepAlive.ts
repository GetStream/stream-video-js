import type { StreamWSClient } from './types';

export interface KeepAlive {
  cancelPendingPing: () => void;
  schedulePing: () => void;
  setDataToExchange: (data: Uint8Array) => void;
}

export const keepAlive = (
  client: StreamWSClient,
  timeThreshold: number,
  defaultData: Uint8Array,
): KeepAlive => {
  let timeoutId: NodeJS.Timeout;
  let data = defaultData;
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

    setDataToExchange(newData: Uint8Array) {
      data = newData;
    },
  };
};
