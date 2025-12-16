import * as scopedLogger from '@stream-io/logger';
import { isReactNative } from './helpers/platforms';
import type { Logger } from './coordinator/connection/types';

export const logToConsole: Logger = (logLevel, message, ...args) => {
  let logMethod;
  switch (logLevel) {
    case 'error':
      if (isReactNative()) {
        message = `ERROR: ${message}`;
        logMethod = console.info;
        break;
      }
      logMethod = console.error;
      break;
    case 'warn':
      if (isReactNative()) {
        message = `WARN: ${message}`;
        logMethod = console.info;
        break;
      }
      logMethod = console.warn;
      break;
    case 'info':
      logMethod = console.info;
      break;
    case 'trace':
      logMethod = console.trace;
      break;
    default:
      logMethod = console.log;
      break;
  }

  logMethod(message, ...args);
};

/**
 * @internal
 */
export type ScopedLogger = scopedLogger.Logger;

export { LogLevelEnum } from '@stream-io/logger';
export type { LogLevel, Sink } from '@stream-io/logger';

export const videoLoggerSystem = scopedLogger.createLoggerSystem();
