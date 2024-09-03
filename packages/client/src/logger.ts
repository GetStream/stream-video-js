import { Logger, LogLevel } from './coordinator/connection/types';
import { isReactNative } from './helpers/platforms';

// log levels, sorted by verbosity
export const logLevels: Record<LogLevel, number> = Object.freeze({
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
});

let logger: Logger | undefined;
let level: LogLevel = 'info';

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

export const setLogger = (l: Logger, lvl?: LogLevel) => {
  logger = l;
  if (lvl) {
    setLogLevel(lvl);
  }
};

export const setLogLevel = (l: LogLevel) => {
  level = l;
};

export const getLogLevel = (): LogLevel => level;

export const getLogger = (withTags?: string[]) => {
  const loggerMethod = logger || logToConsole;
  const tags = (withTags || []).filter(Boolean).join(':');
  const result: Logger = (logLevel, message, ...args) => {
    if (logLevels[logLevel] >= logLevels[level]) {
      loggerMethod(logLevel, `[${tags}]: ${message}`, ...args);
    }
  };
  return result;
};
