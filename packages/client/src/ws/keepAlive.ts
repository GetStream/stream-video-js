import { Healthcheck } from '../gen/video_events/events';
import type { StreamWSClient } from './types';

export const keepAlive = (client: StreamWSClient, timeThreshold: number) => {
  let timeoutId: NodeJS.Timeout;
  return function schedulePing() {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const healthCheck = Healthcheck.toBinary({
        userId: 'alice',
        clientId: 'alice-alice',
      });
      client.sendMessage(healthCheck);
    }, timeThreshold);
  };
};
