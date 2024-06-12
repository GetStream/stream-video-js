import { combineLatest, Observable, Subject } from 'rxjs';
import { withoutConcurrency } from '../helpers/concurrency';

type FunctionPatch<T> = (currentValue: T) => T;

/**
 * A value or a function which takes the current value and returns a new value.
 */
export type Patch<T> = T | FunctionPatch<T>;

/**
 * Checks if the provided update is a function patch.
 *
 * @param update the value to check.
 */
const isFunctionPatch = <T>(update: Patch<T>): update is FunctionPatch<T> =>
  typeof update === 'function';

/**
 * Gets the current value of an observable, or undefined if the observable has
 * not emitted a value yet.
 *
 * @param observable$ the observable to get the value from.
 */
export const getCurrentValue = <T>(observable$: Observable<T>) => {
  let value!: T;
  let err: Error | undefined = undefined;
  combineLatest([observable$])
    .subscribe({
      next: ([v]) => {
        value = v;
      },
      error: (e) => {
        err = e;
      },
    })
    .unsubscribe();

  if (err) throw err;
  return value;
};

/**
 * Updates the value of the provided Subject.
 * An `update` can either be a new value or a function which takes
 * the current value and returns a new value.
 *
 * @param subject the subject to update.
 * @param update the update to apply to the subject.
 * @return the updated value.
 */
export const setCurrentValue = <T>(subject: Subject<T>, update: Patch<T>) => {
  const next = isFunctionPatch(update)
    ? update(getCurrentValue(subject))
    : update;

  subject.next(next);
  return next;
};

/**
 * Creates a subscription and returns a function to unsubscribe.
 *
 * @param observable the observable to subscribe to.
 * @param handler the handler to call when the observable emits a value.
 */
export const createSubscription = <T>(
  observable: Observable<T>,
  handler: (value: T) => void,
) => {
  const subscription = observable.subscribe(handler);
  return () => {
    subscription.unsubscribe();
  };
};

/**
 * Creates a subscription and returns a function to unsubscribe. Makes sure that
 * only one async handler runs at the same time. If updates come in quicker than
 * it takes for the current handler to finish, other handlers will wait.
 *
 * @param observable the observable to subscribe to.
 * @param handler the async handler to call when the observable emits a value.
 */
export const createSafeAsyncSubscription = <T>(
  observable: Observable<T>,
  handler: (value: T) => Promise<void>,
) => {
  const tag = Symbol();
  const subscription = observable.subscribe((value) => {
    withoutConcurrency(tag, () => handler(value));
  });
  return () => {
    subscription.unsubscribe();
  };
};
