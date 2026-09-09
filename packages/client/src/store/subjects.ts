import {
  BehaviorSubject,
  distinctUntilChanged,
  Observable,
  shareReplay,
} from 'rxjs';

/** Creates a BehaviorSubject seeded with the given value. */
export function subject<T>(initialValue: T): BehaviorSubject<T>;
/** Creates a BehaviorSubject which starts out holding `undefined`. */
export function subject<T>(): BehaviorSubject<T | undefined>;
export function subject<T>(initialValue?: T) {
  return new BehaviorSubject(initialValue);
}

/**
 * Creates an Observable from the given subject by piping it to the
 * `distinctUntilChanged()` operator.
 */
export const duc = <T>(
  source: BehaviorSubject<T>,
  comparator?: (a: T, b: T) => boolean,
): Observable<T> => source.pipe(distinctUntilChanged(comparator));

/**
 * Multicasts the given Observable, replaying the latest computed value to
 * every new subscriber instead of re-running the pipeline for each of them.
 */
export const shared = <T>(source: Observable<T>): Observable<T> =>
  source.pipe(shareReplay({ bufferSize: 1, refCount: true }));
