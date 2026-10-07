import { afterEach, describe, expect, it, vi } from 'vitest';
import { StreamVideoClient } from '../StreamVideoClient';
import { videoLoggerSystem } from '../logger';

describe('StreamVideoClient logging configuration', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults to the warn level', () => {
    new StreamVideoClient({ apiKey: 'api-key' });
    expect(videoLoggerSystem.getLogger('client').getLogLevel()).toBe('warn');
  });

  it('keeps the console sink when only the default level is overridden', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    new StreamVideoClient({
      apiKey: 'api-key',
      options: { logOptions: { default: { level: 'debug' } } },
    });
    const logger = videoLoggerSystem.getLogger('logging-test');
    expect(logger.getLogLevel()).toBe('debug');
    logger.debug('hello from test');
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('hello from test'),
    );
  });

  it('does not carry a custom sink over to a client that only sets a level', () => {
    const staleSink = vi.fn();
    new StreamVideoClient({
      apiKey: 'api-key',
      options: { logOptions: { default: { sink: staleSink, level: 'info' } } },
    });
    const logSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    new StreamVideoClient({
      apiKey: 'api-key',
      options: { logOptions: { default: { level: 'info' } } },
    });
    videoLoggerSystem.getLogger('logging-test').info('fresh client');
    expect(staleSink).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('fresh client'),
    );
  });

  it('uses a custom default sink from logOptions', () => {
    const sink = vi.fn();
    new StreamVideoClient({
      apiKey: 'api-key',
      options: { logOptions: { default: { sink, level: 'info' } } },
    });
    videoLoggerSystem.getLogger('logging-test').info('routed');
    expect(sink).toHaveBeenCalledWith(
      'info',
      expect.stringContaining('routed'),
    );
  });
});
