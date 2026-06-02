import { describe, expect, it, vi } from 'vitest';
import { BehaviorSubject, Subject, throwError } from 'rxjs';
import { promiseWithResolvers } from '../../helpers/promise';
import {
  createSafeAsyncSubscription,
  createSubscription,
  getCurrentValue,
  setCurrentValue,
  setCurrentValueAsync,
  updateValue,
} from '../rxUtils';

describe('getCurrentValue', () => {
  it('returns the current value of a BehaviorSubject', () => {
    const subject = new BehaviorSubject(42);
    expect(getCurrentValue(subject)).toBe(42);
  });

  it('reflects subsequent emissions', () => {
    const subject = new BehaviorSubject('a');
    subject.next('b');
    expect(getCurrentValue(subject)).toBe('b');
  });

  it('rethrows errors emitted by the observable', () => {
    const err = new Error('observable failed');
    expect(() => getCurrentValue(throwError(() => err))).toThrow(err);
  });
});

describe('setCurrentValue', () => {
  it('sets a plain value and returns it', () => {
    const subject = new BehaviorSubject(1);
    const result = setCurrentValue(subject, 5);
    expect(result).toBe(5);
    expect(subject.getValue()).toBe(5);
  });

  it('applies a function patch using the current value', () => {
    const subject = new BehaviorSubject(10);
    const result = setCurrentValue(subject, (n) => n * 2);
    expect(result).toBe(20);
    expect(subject.getValue()).toBe(20);
  });

  it('emits the new value to subscribers', () => {
    const subject = new BehaviorSubject(0);
    const seen: number[] = [];
    const sub = subject.subscribe((v) => seen.push(v));
    setCurrentValue(subject, 1);
    setCurrentValue(subject, (n) => n + 1);
    sub.unsubscribe();
    expect(seen).toEqual([0, 1, 2]);
  });
});

describe('setCurrentValueAsync', () => {
  it('passes the current value to the update fn and emits the resolved value', async () => {
    const subject = new BehaviorSubject(1);
    const update = vi.fn(async (n: number) => n + 1);

    const result = await setCurrentValueAsync(subject, update);

    expect(update).toHaveBeenCalledWith(1);
    expect(result).toBe(2);
    expect(subject.getValue()).toBe(2);
  });

  it('serializes concurrent calls on the same subject so each sees the previous result', async () => {
    const subject = new BehaviorSubject(0);
    const observed: number[] = [];

    const append = (delay: number) =>
      setCurrentValueAsync(subject, async (n) => {
        observed.push(n);
        await new Promise((r) => setTimeout(r, delay));
        return n + 1;
      });

    const [a, b, c] = await Promise.all([append(10), append(0), append(0)]);

    expect(observed).toEqual([0, 1, 2]);
    expect([a, b, c]).toEqual([1, 2, 3]);
    expect(subject.getValue()).toBe(3);
  });

  it('does not block updates on a different subject', async () => {
    const a = new BehaviorSubject('a-0');
    const b = new BehaviorSubject('b-0');

    const gate = promiseWithResolvers();

    const aPending = setCurrentValueAsync(a, async (v) => {
      await gate.promise;
      return `${v}-done`;
    });
    const bDone = await setCurrentValueAsync(b, async (v) => `${v}-done`);

    expect(bDone).toBe('b-0-done');
    expect(b.getValue()).toBe('b-0-done');

    gate.resolve();
    await expect(aPending).resolves.toBe('a-0-done');
    expect(a.getValue()).toBe('a-0-done');
  });

  it('propagates rejections without emitting and keeps the prior value', async () => {
    const subject = new BehaviorSubject(7);
    const emitted: number[] = [];
    const sub = subject.subscribe((v) => emitted.push(v));

    const boom = new Error('boom');
    await expect(
      setCurrentValueAsync(subject, async () => {
        throw boom;
      }),
    ).rejects.toBe(boom);

    expect(subject.getValue()).toBe(7);
    // Only the initial replay from the BehaviorSubject, no second emission.
    expect(emitted).toEqual([7]);
    sub.unsubscribe();
  });

  it('continues to process queued updates after a rejection', async () => {
    const subject = new BehaviorSubject(0);

    const failing = setCurrentValueAsync(subject, async () => {
      throw new Error('nope');
    });
    const succeeding = setCurrentValueAsync(subject, async (n) => n + 5);

    await expect(failing).rejects.toThrow('nope');
    await expect(succeeding).resolves.toBe(5);
    expect(subject.getValue()).toBe(5);
  });
});

describe('updateValue', () => {
  it('returns the previous and new values', () => {
    const subject = new BehaviorSubject(1);
    const { lastValue, value } = updateValue(subject, 2);
    expect(lastValue).toBe(1);
    expect(value).toBe(2);
    expect(subject.getValue()).toBe(2);
  });

  it('rollback restores the previous value', () => {
    const subject = new BehaviorSubject({ count: 3 });
    const prior = subject.getValue();

    const { rollback } = updateValue(subject, { count: 99 });
    expect(subject.getValue()).toEqual({ count: 99 });

    rollback();
    expect(subject.getValue()).toBe(prior);
  });

  it('accepts a function patch', () => {
    const subject = new BehaviorSubject(10);
    const { value } = updateValue(subject, (n) => n + 5);
    expect(value).toBe(15);
    expect(subject.getValue()).toBe(15);
  });
});

describe('createSubscription', () => {
  it('invokes the handler with every emitted value', () => {
    const subject = new Subject<number>();
    const handler = vi.fn();
    const unsubscribe = createSubscription(subject, handler);

    subject.next(1);
    subject.next(2);
    unsubscribe();

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenNthCalledWith(1, 1);
    expect(handler).toHaveBeenNthCalledWith(2, 2);
  });

  it('stops receiving values after unsubscribe is called', () => {
    const subject = new Subject<number>();
    const handler = vi.fn();
    const unsubscribe = createSubscription(subject, handler);

    subject.next(1);
    unsubscribe();
    subject.next(2);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(1);
  });

  it('routes errors to the provided onError handler', () => {
    const err = new Error('observable failed');
    const onError = vi.fn();
    createSubscription(
      throwError(() => err),
      vi.fn(),
      onError,
    );
    expect(onError).toHaveBeenCalledWith(err);
  });

  it('swallows errors via the default onError when none is provided', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(() =>
      createSubscription(
        throwError(() => new Error('boom')),
        vi.fn(),
      ),
    ).not.toThrow();
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });
});

describe('createSafeAsyncSubscription', () => {
  it('runs the async handler for each emission', async () => {
    const subject = new Subject<number>();
    const handler = vi.fn(async () => {});
    const unsubscribe = createSafeAsyncSubscription(subject, handler);

    subject.next(1);
    subject.next(2);
    await new Promise((r) => setTimeout(r, 0));

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenNthCalledWith(1, 1);
    expect(handler).toHaveBeenNthCalledWith(2, 2);
    unsubscribe();
  });

  it('serializes handlers so a slow one blocks the next', async () => {
    const subject = new Subject<number>();
    const events: string[] = [];
    const gate = promiseWithResolvers();

    const unsubscribe = createSafeAsyncSubscription(subject, async (v) => {
      events.push(`start:${v}`);
      if (v === 1) await gate.promise;
      events.push(`end:${v}`);
    });

    subject.next(1);
    subject.next(2);
    await new Promise((r) => setTimeout(r, 0));

    // Second handler hasn't started yet because the first is still in-flight.
    expect(events).toEqual(['start:1']);

    gate.resolve();
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));

    expect(events).toEqual(['start:1', 'end:1', 'start:2', 'end:2']);
    unsubscribe();
  });

  it('stops invoking the handler after unsubscribe', async () => {
    const subject = new Subject<number>();
    const handler = vi.fn(async () => {});
    const unsubscribe = createSafeAsyncSubscription(subject, handler);

    subject.next(1);
    unsubscribe();
    subject.next(2);
    await new Promise((r) => setTimeout(r, 0));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(1);
  });
});
