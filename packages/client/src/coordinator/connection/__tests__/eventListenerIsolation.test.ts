import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StreamClient } from '../client';
import { StableWSConnection } from '../connection';
import { videoLoggerSystem } from '../../../logger';
import type { StreamVideoEvent } from '../types';

const event: StreamVideoEvent = { type: 'network.changed', online: true };

describe('event listener isolation', () => {
  let client: StreamClient;
  let sink: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sink = vi.fn();
    videoLoggerSystem.configureLoggers({
      coordinator: { sink, level: 'error' },
    });
    client = new StreamClient('key');
  });

  afterEach(() => {
    videoLoggerSystem.restoreDefaults();
    vi.restoreAllMocks();
  });

  const errorLogs = () =>
    sink.mock.calls.filter(([level]) => level === 'error');

  it('keeps dispatching after a listener throws', () => {
    const failure = new Error('listener blew up');
    const first = vi.fn(() => {
      throw failure;
    });
    const second = vi.fn();

    client.on('network.changed', first);
    client.on('network.changed', second);

    expect(() => client.dispatchEvent(event)).not.toThrow();
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('reports a synchronous throw through the logger', () => {
    const failure = new Error('listener blew up');
    client.on('network.changed', () => {
      throw failure;
    });

    client.dispatchEvent(event);

    expect(errorLogs()).toEqual([
      [
        'error',
        '[coordinator]: Unhandled error in event listener',
        failure,
        event,
      ],
    ]);
  });

  it('reports a rejection from an async listener', async () => {
    const failure = new Error('async listener blew up');
    client.on('network.changed', async () => {
      throw failure;
    });
    const next = vi.fn();
    client.on('network.changed', next);

    client.dispatchEvent(event);
    expect(next).toHaveBeenCalledTimes(1);
    expect(errorLogs()).toHaveLength(0);

    await vi.waitFor(() => expect(errorLogs()).toHaveLength(1));
    expect(errorLogs()[0]).toEqual([
      'error',
      '[coordinator]: Unhandled error in event listener',
      failure,
      event,
    ]);
  });

  it('isolates a faulty `all` listener from type specific listeners', () => {
    const all = vi.fn(() => {
      throw new Error('all listener blew up');
    });
    const typed = vi.fn();

    client.on('all', all);
    client.on('network.changed', typed);

    client.dispatchEvent(event);

    expect(all).toHaveBeenCalledTimes(1);
    expect(typed).toHaveBeenCalledTimes(1);
    expect(errorLogs()).toHaveLength(1);
  });

  it('schedules the connection check even when a listener throws', () => {
    const connection = new StableWSConnection(client);
    const scheduleConnectionCheck = vi
      .spyOn(connection, 'scheduleConnectionCheck')
      .mockImplementation(() => {});

    client.on('all', () => {
      throw new Error('listener blew up');
    });

    connection.onmessage(connection.wsID, {
      data: JSON.stringify({ type: 'custom' }),
    } as MessageEvent);

    expect(scheduleConnectionCheck).toHaveBeenCalledTimes(1);
  });
});
