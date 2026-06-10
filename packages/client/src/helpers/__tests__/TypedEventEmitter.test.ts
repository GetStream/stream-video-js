import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TypedEventEmitter } from '../TypedEventEmitter';

type TestEvents = {
  hello: string;
  ping: { n: number };
  empty: undefined;
};

describe('TypedEventEmitter', () => {
  let emitter: TypedEventEmitter<TestEvents>;

  beforeEach(() => {
    emitter = new TypedEventEmitter<TestEvents>();
  });

  it('invokes listeners registered with on()', () => {
    const listener = vi.fn();
    emitter.on('hello', listener);
    emitter.emit('hello', 'world');
    expect(listener).toHaveBeenCalledWith('world');
  });

  it('returns an unsubscribe function from on()', () => {
    const listener = vi.fn();
    const unsubscribe = emitter.on('hello', listener);
    unsubscribe();
    emitter.emit('hello', 'world');
    expect(listener).not.toHaveBeenCalled();
  });

  it('removes listeners via off()', () => {
    const listener = vi.fn();
    emitter.on('hello', listener);
    emitter.off('hello', listener);
    emitter.emit('hello', 'world');
    expect(listener).not.toHaveBeenCalled();
  });

  it('supports multiple listeners for the same event', () => {
    const a = vi.fn();
    const b = vi.fn();
    emitter.on('ping', a);
    emitter.on('ping', b);
    emitter.emit('ping', { n: 1 });
    expect(a).toHaveBeenCalledWith({ n: 1 });
    expect(b).toHaveBeenCalledWith({ n: 1 });
  });

  it('deduplicates identical listener references', () => {
    const listener = vi.fn();
    emitter.on('hello', listener);
    emitter.on('hello', listener);
    emitter.emit('hello', 'once');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('fires once() listeners exactly once', () => {
    const listener = vi.fn();
    emitter.once('ping', listener);
    emitter.emit('ping', { n: 1 });
    emitter.emit('ping', { n: 2 });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ n: 1 });
  });

  it('allows canceling a once() subscription before it fires', () => {
    const listener = vi.fn();
    const unsubscribe = emitter.once('ping', listener);
    unsubscribe();
    emitter.emit('ping', { n: 1 });
    expect(listener).not.toHaveBeenCalled();
  });

  it('removes a once() listener via off(originalFn) before it fires', () => {
    // once() stores an internal wrapper, but the documented unsubscribe path
    // off(name, handler) takes the original handler - it must still cancel.
    const listener = vi.fn();
    emitter.once('ping', listener);
    emitter.off('ping', listener);
    emitter.emit('ping', { n: 1 });
    expect(listener).not.toHaveBeenCalled();
  });

  it('delivers events to onAny() listeners with (event, payload)', () => {
    const any = vi.fn();
    emitter.onAny(any);
    emitter.emit('hello', 'world');
    emitter.emit('ping', { n: 2 });
    expect(any).toHaveBeenNthCalledWith(1, 'hello', 'world');
    expect(any).toHaveBeenNthCalledWith(2, 'ping', { n: 2 });
  });

  it('unsubscribes onAny() listeners via returned fn', () => {
    const any = vi.fn();
    const unsubscribe = emitter.onAny(any);
    unsubscribe();
    emitter.emit('hello', 'world');
    expect(any).not.toHaveBeenCalled();
  });

  it('isolates a throwing listener from subsequent listeners', () => {
    const bad = vi.fn(() => {
      throw new Error('boom');
    });
    const good = vi.fn();
    emitter.on('hello', bad);
    emitter.on('hello', good);
    expect(() => emitter.emit('hello', 'world')).not.toThrow();
    expect(bad).toHaveBeenCalled();
    expect(good).toHaveBeenCalledWith('world');
  });

  it('isolates a rejecting async listener', async () => {
    const rejected = vi.fn(async () => {
      throw new Error('async boom');
    });
    const good = vi.fn();
    emitter.on('hello', rejected);
    emitter.on('hello', good);
    expect(() => emitter.emit('hello', 'world')).not.toThrow();
    expect(good).toHaveBeenCalled();
    // allow microtask to settle; rejection should have been swallowed by the emitter
    await Promise.resolve();
  });

  it('is safe to call off() from within a listener (current emit still fires siblings)', () => {
    const sibling = vi.fn();
    const self = vi.fn(() => {
      emitter.off('hello', self);
    });
    emitter.on('hello', self);
    emitter.on('hello', sibling);
    emitter.emit('hello', 'world');
    expect(self).toHaveBeenCalledTimes(1);
    expect(sibling).toHaveBeenCalledTimes(1);
    // second emit should not invoke self again
    emitter.emit('hello', 'again');
    expect(self).toHaveBeenCalledTimes(1);
    expect(sibling).toHaveBeenCalledTimes(2);
  });

  it('is safe to add a listener from within a listener (added listener does not fire in current emit)', () => {
    const later = vi.fn();
    emitter.on('hello', () => {
      emitter.on('hello', later);
    });
    emitter.emit('hello', 'first');
    expect(later).not.toHaveBeenCalled();
    emitter.emit('hello', 'second');
    expect(later).toHaveBeenCalledWith('second');
  });

  it('removeAllListeners() clears every subscription when called without args', () => {
    const a = vi.fn();
    const b = vi.fn();
    const any = vi.fn();
    emitter.on('hello', a);
    emitter.on('ping', b);
    emitter.onAny(any);
    emitter.removeAllListeners();
    emitter.emit('hello', 'world');
    emitter.emit('ping', { n: 1 });
    expect(a).not.toHaveBeenCalled();
    expect(b).not.toHaveBeenCalled();
    expect(any).not.toHaveBeenCalled();
  });

  it('removeAllListeners(event) clears only that event and keeps onAny', () => {
    const a = vi.fn();
    const b = vi.fn();
    const any = vi.fn();
    emitter.on('hello', a);
    emitter.on('ping', b);
    emitter.onAny(any);
    emitter.removeAllListeners('hello');
    emitter.emit('hello', 'world');
    emitter.emit('ping', { n: 1 });
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledWith({ n: 1 });
    expect(any).toHaveBeenCalledTimes(2);
  });
});
