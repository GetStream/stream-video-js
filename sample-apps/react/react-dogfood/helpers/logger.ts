import { Logger, LogLevel, logToConsole } from '@stream-io/video-react-sdk';
import * as Sentry from '@sentry/nextjs';

const logLevelMapping = new Map<LogLevel, Sentry.SeverityLevel>();
logLevelMapping.set('trace', 'debug');
logLevelMapping.set('debug', 'debug');
logLevelMapping.set('info', 'info');
logLevelMapping.set('warn', 'warning');
logLevelMapping.set('error', 'error');

export const customSentryLogger =
  (opts: { enableVerboseLogging?: boolean } = {}): Logger =>
  (logLevel: LogLevel, message: string, ...args: unknown[]) => {
    if (logLevel === 'error') {
      Sentry.captureEvent({
        level: logLevelMapping.get(logLevel),
        message,
      });
    }

    const { enableVerboseLogging = false } = opts;
    if (
      !enableVerboseLogging &&
      message.startsWith('[Dispatcher]') &&
      /audioLevelChanged|dominantSpeakerChanged/.test(message)
    ) {
      // reduce noise from audioLevelChanged and dominantSpeakerChanged events
      return;
    }

    // Call the SDK's default log method
    logToConsole(logLevel, message, ...args);
  };
