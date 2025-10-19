import { getLogger } from '@stream-io/logger';

export const ensureExhausted = (x: never, message: string) => {
  getLogger('helpers').warn(message, x);
};
