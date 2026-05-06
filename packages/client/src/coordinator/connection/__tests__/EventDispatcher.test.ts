import { describe, expect, it, vi } from 'vitest';
import { EventDispatcher } from '../internal/EventDispatcher';
import { createFakeLogger } from './helpers/fakeLogger';
import type { StreamVideoEvent } from '../types';

const networkChanged = (online: boolean): StreamVideoEvent => ({
  type: 'network.changed',
  online,
});

const connectionChanged = (online: boolean): StreamVideoEvent => ({
  type: 'connection.changed',
  online,
});

describe('EventDispatcher', () => {
  it('on() and off() round-trip correctly', () => {
    const logger = createFakeLogger();
    const dispatcher = new EventDispatcher({ logger });
    const cb = vi.fn();
    const off = dispatcher.on('network.changed', cb);
    dispatcher.dispatch(networkChanged(true));
    expect(cb).toHaveBeenCalledTimes(1);
    off();
    dispatcher.dispatch(networkChanged(false));
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('off() with the same callback stops further deliveries', () => {
    const dispatcher = new EventDispatcher({ logger: createFakeLogger() });
    const cb = vi.fn();
    dispatcher.on('network.changed', cb);
    dispatcher.off('network.changed', cb);
    dispatcher.dispatch(networkChanged(true));
    expect(cb).not.toHaveBeenCalled();
  });

  it('dispatch invokes "all" listeners before type-specific listeners (in subscription order)', () => {
    const dispatcher = new EventDispatcher({ logger: createFakeLogger() });
    const order: string[] = [];
    dispatcher.on('all', () => order.push('all-1'));
    dispatcher.on('network.changed', () => order.push('typed-1'));
    dispatcher.on('all', () => order.push('all-2'));
    dispatcher.on('network.changed', () => order.push('typed-2'));
    dispatcher.dispatch(networkChanged(true));
    expect(order).toEqual(['all-1', 'all-2', 'typed-1', 'typed-2']);
  });

  it('a throwing listener is logged at error level and does not break delivery (F2)', () => {
    const logger = createFakeLogger();
    const dispatcher = new EventDispatcher({ logger });
    const after = vi.fn();
    dispatcher.on('network.changed', () => {
      throw new Error('boom');
    });
    dispatcher.on('network.changed', after);

    expect(() => dispatcher.dispatch(networkChanged(true))).not.toThrow();
    expect(after).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalled();
  });

  it('a throwing "all" listener does not stop "all" or typed deliveries', () => {
    const logger = createFakeLogger();
    const dispatcher = new EventDispatcher({ logger });
    const allAfter = vi.fn();
    const typed = vi.fn();
    dispatcher.on('all', () => {
      throw new Error('boom');
    });
    dispatcher.on('all', allAfter);
    dispatcher.on('network.changed', typed);

    dispatcher.dispatch(networkChanged(true));

    expect(allAfter).toHaveBeenCalledTimes(1);
    expect(typed).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalled();
  });

  it('clear() removes all listeners', () => {
    const dispatcher = new EventDispatcher({ logger: createFakeLogger() });
    const cb = vi.fn();
    dispatcher.on('all', cb);
    dispatcher.on('connection.changed', cb);
    dispatcher.clear();
    dispatcher.dispatch(connectionChanged(true));
    expect(cb).not.toHaveBeenCalled();
  });

  it('subscribers added after the first dispatch are appended (regression)', () => {
    const dispatcher = new EventDispatcher({ logger: createFakeLogger() });
    const order: string[] = [];
    dispatcher.on('network.changed', () => order.push('first'));
    dispatcher.dispatch(networkChanged(true));
    dispatcher.on('network.changed', () => order.push('second'));
    dispatcher.dispatch(networkChanged(false));
    expect(order).toEqual(['first', 'first', 'second']);
  });

  it('snapshotting the listener list before iteration: removing a listener during dispatch still calls peers', () => {
    const dispatcher = new EventDispatcher({ logger: createFakeLogger() });
    const peer = vi.fn();
    let off: () => void = () => {};
    dispatcher.on('network.changed', () => {
      // self-unsubscribe during dispatch
      off();
    });
    off = dispatcher.on('network.changed', peer);
    dispatcher.dispatch(networkChanged(true));
    expect(peer).toHaveBeenCalledTimes(1);
  });
});
