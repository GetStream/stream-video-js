import { describe, expect, it, vi } from 'vitest';
import { StateStore } from '@stream-io/state-store';
import { createSubscribable, field, firstValue, select } from '../subscribable';

type Shape = {
  count: number;
  name: string;
  items: string[];
};

const makeStore = (overrides: Partial<Shape> = {}) =>
  new StateStore<Shape>({ count: 0, name: 'a', items: [], ...overrides });

describe('createSubscribable', () => {
  it('replays the current value on subscribe', () => {
    const s = createSubscribable(
      () => 42,
      () => () => {},
    );
    const seen: number[] = [];
    s.subscribe((v) => seen.push(v));
    expect(seen).toEqual([42]);
  });

  it('supports both the callback and observer-object forms', () => {
    const store = makeStore();
    const count$ = field(store, 'count');

    const viaCallback: number[] = [];
    const viaObserver: number[] = [];
    count$.subscribe((v) => viaCallback.push(v));
    count$.subscribe({ next: (v) => viaObserver.push(v) });

    store.partialNext({ count: 1 });

    expect(viaCallback).toEqual([0, 1]);
    expect(viaObserver).toEqual([0, 1]);
  });

  it('returns a subscription that is both callable and has unsubscribe()', () => {
    const store = makeStore();
    const count$ = field(store, 'count');

    const a: number[] = [];
    const b: number[] = [];
    const subA = count$.subscribe((v) => a.push(v));
    const subB = count$.subscribe((v) => b.push(v));

    subA(); // callable form
    subB.unsubscribe(); // rxjs-shaped form
    store.partialNext({ count: 1 });

    expect(a).toEqual([0]);
    expect(b).toEqual([0]);
  });

  it('is idempotent on repeated unsubscribe', () => {
    const teardown = vi.fn();
    const s = createSubscribable(
      () => 1,
      () => teardown,
    );
    const sub = s.subscribe(() => {});
    sub.unsubscribe();
    sub.unsubscribe();
    sub();
    expect(teardown).toHaveBeenCalledTimes(1);
  });

  it('tracks whether it is observed, and tears down on the last unsubscribe', () => {
    const teardown = vi.fn();
    const onSubscribe = vi.fn(() => teardown);
    const s = createSubscribable(() => 1, onSubscribe);

    expect(s.observed).toBe(false);
    const one = s.subscribe(() => {});
    const two = s.subscribe(() => {});
    expect(s.observed).toBe(true);
    expect(onSubscribe).toHaveBeenCalledTimes(1);

    one.unsubscribe();
    expect(s.observed).toBe(true);
    expect(teardown).not.toHaveBeenCalled();

    two.unsubscribe();
    expect(s.observed).toBe(false);
    expect(teardown).toHaveBeenCalledTimes(1);
  });

  it('survives a subscriber unsubscribing during emission', () => {
    const store = makeStore();
    const count$ = field(store, 'count');
    const seen: number[] = [];

    const sub = count$.subscribe((v) => {
      seen.push(v);
      if (v === 1) sub.unsubscribe();
    });
    count$.subscribe(() => {});

    store.partialNext({ count: 1 });
    store.partialNext({ count: 2 });

    expect(seen).toEqual([0, 1]);
  });
});

describe('field', () => {
  it('emits only when its own key changes', () => {
    const store = makeStore();
    const seen: number[] = [];
    field(store, 'count').subscribe((v) => seen.push(v));

    store.partialNext({ name: 'b' }); // unrelated key
    store.partialNext({ count: 1 });
    store.partialNext({ count: 1 }); // same value
    store.partialNext({ count: 2 });

    expect(seen).toEqual([0, 1, 2]);
  });

  it('reads through to the store for getValue()', () => {
    const store = makeStore();
    const count$ = field(store, 'count');
    expect(count$.getValue()).toBe(0);
    store.partialNext({ count: 7 });
    expect(count$.getValue()).toBe(7);
  });

  it('deduplicates by identity, so a stable array reference does not re-emit', () => {
    const items = ['a'];
    const store = makeStore({ items });
    const seen: string[][] = [];
    field(store, 'items').subscribe((v) => seen.push(v));

    store.partialNext({ items }); // same reference
    expect(seen).toHaveLength(1);

    store.partialNext({ items: ['a'] }); // equal contents, new reference
    expect(seen).toHaveLength(2);
  });
});

describe('select', () => {
  it('emits only when the derived value changes', () => {
    const store = makeStore();
    const seen: boolean[] = [];
    select(store, (s) => s.count > 1).subscribe((v) => seen.push(v));

    store.partialNext({ count: 1 }); // still false
    store.partialNext({ count: 2 }); // -> true
    store.partialNext({ count: 3 }); // still true

    expect(seen).toEqual([false, true]);
  });

  it('honours a custom comparator', () => {
    const store = makeStore({ items: ['a'] });
    const seen: string[][] = [];
    const sameContents = (a: string[], b: string[]) =>
      a.length === b.length && a.every((x, i) => x === b[i]);

    select(store, (s) => [...s.items], sameContents).subscribe((v) =>
      seen.push(v),
    );

    store.partialNext({ items: ['a'] }); // equal contents
    expect(seen).toHaveLength(1);

    store.partialNext({ items: ['b'] });
    expect(seen).toHaveLength(2);
  });
});

describe('firstValue', () => {
  it('resolves from the replayed current value without waiting', async () => {
    const store = makeStore({ count: 5 });
    await expect(firstValue(field(store, 'count'))).resolves.toBe(5);
  });

  it('waits for the first value matching the predicate', async () => {
    const store = makeStore();
    const count$ = field(store, 'count');
    const promise = firstValue(count$, (v) => v >= 2);

    store.partialNext({ count: 1 });
    store.partialNext({ count: 2 });
    store.partialNext({ count: 3 });

    await expect(promise).resolves.toBe(2);
  });

  it('unsubscribes once settled', async () => {
    const store = makeStore();
    const count$ = field(store, 'count');
    await firstValue(count$);
    expect(count$.observed).toBe(false);
  });

  it('skips an undefined initial value by default', async () => {
    const store = new StateStore<{ v: string | undefined }>({ v: undefined });
    const v$ = field(store, 'v');
    const promise = firstValue(v$);
    store.partialNext({ v: 'ready' });
    await expect(promise).resolves.toBe('ready');
  });
});

describe('stable snapshots', () => {
  // React's useSyncExternalStore compares snapshots by identity and re-renders
  // forever if a derived source allocates on every read.
  it('select() returns the same reference while the store is unchanged', () => {
    const store = makeStore();
    const derived = select(store, (s) => ({ doubled: s.count * 2 }));

    expect(derived.getValue()).toBe(derived.getValue());

    const before = derived.getValue();
    store.partialNext({ name: 'b' }); // unrelated key
    expect(derived.getValue()).toBe(before);

    store.partialNext({ count: 1 });
    expect(derived.getValue()).not.toBe(before);
  });
});
