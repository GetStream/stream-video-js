import { useCallback, useSyncExternalStore } from 'react';
import type { Subscribable } from '@stream-io/video-client';

const noop = () => () => {};

/**
 * Utility hook which provides the current value of the given source.
 *
 * `source$` may be `undefined` - there is often no source to read when there is
 * no active call - in which case `defaultValue` is returned. That is preferable
 * to fabricating a constant source just to have something to subscribe to.
 *
 * @deprecated prefer the dedicated call state hooks, or `useCallStateSelector`
 * to read several values in a single subscription. This hook now takes a
 * `Subscribable` rather than an RxJS `Observable`.
 *
 * @param source$ the source to read data from, if there is one.
 * @param defaultValue returned when there is no source, or the source cannot be
 * read. Must be stable across renders.
 */
export function useObservableValue<T>(source$: Subscribable<T>): T;
export function useObservableValue<T>(
  source$: Subscribable<T> | undefined,
  defaultValue: T,
): T;
export function useObservableValue<T>(
  source$: Subscribable<T> | undefined,
  defaultValue?: T,
): T | undefined {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!source$) return noop();
      const subscription = source$.subscribe(onChange);
      return () => subscription.unsubscribe();
    },
    [source$],
  );

  const getSnapshot = useCallback(() => {
    if (!source$) return defaultValue;
    try {
      return source$.getValue();
    } catch (err) {
      if (typeof defaultValue === 'undefined') throw err;
      return defaultValue;
    }
  }, [source$, defaultValue]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
