import { videoLoggerSystem } from '../logger';

export const ensureExhausted = (x: never, message?: string) => {
  if (message) {
    videoLoggerSystem.getLogger('helpers').warn(message, x);
  }
};
