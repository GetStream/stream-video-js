import { LogLevel, Logger, logToConsole } from '@stream-io/video-client';
import * as Sentry from '@sentry/react-native';

const logLevelMapping = new Map<LogLevel, Sentry.Event['level']>();
logLevelMapping.set('trace', 'debug');
logLevelMapping.set('debug', 'debug');
logLevelMapping.set('info', 'info');
logLevelMapping.set('warn', 'warning');
logLevelMapping.set('error', 'error');

export const customSentryLogger: Logger = (
  logLevel: LogLevel,
  message: string,
  ...args: unknown[]
) => {
  if (logLevel === 'warn' || logLevel === 'error') {
    Sentry.captureEvent({
      level: logLevelMapping.get(logLevel),
    });
  }

  // Call the SDK's default log method
  if (logLevel === 'error') {
    // We do not log anything else other than error to console
    // as warning logs clutter the screen in react-native
    // and the client JS has a lot of warning logs
    logToConsole(logLevel, message, ...args);
  }
};
