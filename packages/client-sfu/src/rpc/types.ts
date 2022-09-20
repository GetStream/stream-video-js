export type LogLevel = 'info' | 'error' | 'warn';

export type Logger = (
  logLevel: LogLevel,
  message: string,
  extraData?: Record<string, unknown>,
) => void;
