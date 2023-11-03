import { Logger, LogLevel, logToConsole } from '@stream-io/video-react-sdk';
import * as Sentry from '@sentry/nextjs';

const logLevelMapping = new Map<LogLevel, Sentry.SeverityLevel>();
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

  if (
    message.startsWith('[sfu-client]') &&
    /audioLevelChanged|dominantSpeakerChanged/.test(message)
  ) {
    // reduce noise from audioLevelChanged and dominantSpeakerChanged events
    return;
  }

  // Call the SDK's default log method
  logToConsole(logLevel, message, ...args);
};
