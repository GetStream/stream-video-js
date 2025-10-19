import * as scopedLogger from '@stream-io/logger';
import { Logger } from './coordinator/connection/types';
import { isReactNative } from './helpers/platforms';
import type { ConfigureLoggersOptions, LogLevel } from '@stream-io/logger';

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

export const setLogger = (
  logger: Logger,
  level: LogLevel,
  loggersConfig?: ConfigureLoggersOptions,
) => {
  scopedLogger.configureLoggers<string>({
    default: { sink: logger, level: 'error' },
    ...loggersConfig,
  });
};

/**
 * @internal
 */
export type ScopedLogger = scopedLogger.Logger;

export type { LogLevel, Sink } from '@stream-io/logger';
export {
  LogLevelEnum,
  restoreDefaults,
  configureLoggers,
} from '@stream-io/logger';
