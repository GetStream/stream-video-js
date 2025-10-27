import { videoLoggerSystem } from '../logger';

export const ensureExhausted = (x: never, message: string) => {
  videoLoggerSystem.getLogger('helpers').warn(message, x);
};
