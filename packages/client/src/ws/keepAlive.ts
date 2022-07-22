import type { StreamWSClient } from './types';

export const keepAlive = (
  client: StreamWSClient,
  timeThreshold: number,
  defaultData: Uint8Array,
) => {
  let timeoutId: NodeJS.Timeout;
  return {
    schedulePing: (data: Uint8Array = defaultData) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        client.sendMessage(data);
      }, timeThreshold);
    },
    cancelPendingPing: () => {
      clearTimeout(timeoutId);
    },
  };
};
