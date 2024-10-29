import { getLogger } from '../logger';

export const ensureExhausted = (x: never, message: string) => {
  getLogger(['helpers'])('warn', message, x);
};
