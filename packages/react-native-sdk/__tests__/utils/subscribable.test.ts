import { StateStore, field } from '@stream-io/video-client';
import {
  subscribeDebounced,
  subscribeOnce,
} from '../../src/utils/internal/subscribable';

const makeStore = () => new StateStore<{ count: number }>({ count: 0 });

describe('subscribeDebounced', () => {
  it('passes on a value only once the source goes quiet', async () => {
    const store = makeStore();
    const seen: number[] = [];
    subscribeDebounced(field(store, 'count'), 10, (v) => seen.push(v));

    store.partialNext({ count: 1 });
    store.partialNext({ count: 2 });
    expect(seen).toEqual([]);

    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(seen).toEqual([2]);
  });

  it('cancels a pending value on unsubscribe', async () => {
    const store = makeStore();
    const seen: number[] = [];
    const sub = subscribeDebounced(field(store, 'count'), 10, (v) =>
      seen.push(v),
    );

    store.partialNext({ count: 1 });
    sub.unsubscribe();

    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(seen).toEqual([]);
  });
});

describe('subscribeOnce', () => {
  it('fires for the first match then stops observing', () => {
    const store = makeStore();
    const count$ = field(store, 'count');
    const seen: number[] = [];

    subscribeOnce(
      count$,
      (v) => v >= 2,
      (v) => seen.push(v),
    );

    store.partialNext({ count: 1 });
    store.partialNext({ count: 2 });
    store.partialNext({ count: 3 });

    expect(seen).toEqual([2]);
    expect(count$.observed).toBe(false);
  });

  it('fires synchronously when the current value already matches', () => {
    const store = new StateStore<{ count: number }>({ count: 5 });
    const count$ = field(store, 'count');
    const seen: number[] = [];

    const sub = subscribeOnce(
      count$,
      (v) => v >= 2,
      (v) => seen.push(v),
    );
    sub.unsubscribe(); // safe after the handler already ran

    expect(seen).toEqual([5]);
    expect(count$.observed).toBe(false);
  });

  it('can be cancelled before a match arrives', () => {
    const store = makeStore();
    const count$ = field(store, 'count');
    const handler = jest.fn();

    subscribeOnce(count$, (v) => v >= 2, handler).unsubscribe();
    store.partialNext({ count: 3 });

    expect(handler).not.toHaveBeenCalled();
  });
});
