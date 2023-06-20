import { LogLevel, Logger, logToConsole } from '@stream-io/video-react-sdk';
import * as Sentry from '@sentry/nextjs';

const logLevelMapping = new Map<LogLevel, Sentry.SeverityLevel>();
logLevelMapping.set('debug', 'debug');
logLevelMapping.set('info', 'info');
logLevelMapping.set('warn', 'warning');
logLevelMapping.set('error', 'error');

export const customSentryLogger: Logger = (
  logLevel: LogLevel,
  message: string,
  extraData?: any,
  tags?: string[],
) => {
  Sentry.captureMessage(message, {
    level: logLevelMapping.get(logLevel),
    extra: extraData,
  });

  // Call the SDK's default log method
  logToConsole(logLevel, message, extraData, tags);
};
