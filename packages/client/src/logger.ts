import { LogLevel, Logger } from './coordinator/connection/types';

let logger: Logger | undefined;

export const logToConsole: Logger = (
  logLevel: LogLevel,
  message: string,
  extraData?: Record<string, unknown>,
  tags?: string[],
) => {
  let logMethod;
  if (logLevel === 'error') {
    logMethod = console.error;
  } else if (logLevel === 'warn') {
    logMethod = console.warn;
  } else {
    logMethod = console.log;
  }

  logMethod(
    logLevel,
    `${tags?.join(':')} - ${message}`,
    extraData ? extraData : '',
  );
};

export const setLogger = (l: Logger) => {
  logger = l;
};

export const getLogger = (withTags?: string[]) => {
  const loggerMethod = logger || (() => {});
  const result: Logger = (
    logLevel: LogLevel,
    messeage: string,
    extraData?: Record<string, unknown>,
    tags?: string[],
  ) => {
    loggerMethod(logLevel, messeage, extraData, [
      ...(tags || []),
      ...(withTags || []),
    ]);
  };
  return result;
};
