import * as scopedLogger from '@stream-io/logger';
import { Logger, LogLevel } from './coordinator/connection/types';
import { isReactNative } from './helpers/platforms';
import { ConfigureLoggersOptions } from '@stream-io/logger';

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
  loggersConfig?: ConfigureLoggersOptions<string>,
) => {
  scopedLogger.configureLoggers<string>({
    default: { sink: logger, level: level },
    ...loggersConfig,
  });
};

/**
 * @internal
 */
export const getLogger = scopedLogger.getLogger<string>;

export type ScopedLogger = scopedLogger.Logger<string>;

export const configureLoggers = scopedLogger.configureLoggers<string>;

export type { LogLevel as ScopedLogLevel, Sink } from '@stream-io/logger';
export { LogLevelEnum, restoreDefaults } from '@stream-io/logger';
