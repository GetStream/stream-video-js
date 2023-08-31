import { Observable, Subject } from 'rxjs';
import { take } from 'rxjs/operators';

/**
 * A value or a function which takes the current value and returns a new value.
 */
export type Patch<T> = T | ((currentValue: T) => T);

/**
 * Gets the current value of an observable, or undefined if the observable has
 * not emitted a value yet.
 *
 * @param observable$ the observable to get the value from.
 */
export const getCurrentValue = <T>(observable$: Observable<T>) => {
  let value!: T;
  let err: Error | undefined = undefined;
  observable$
    .pipe(take(1))
    .subscribe({
      next: (v) => {
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
export const setCurrentValue = <T>(
  subject: Subject<T>,
  update: Patch<T>,
): T => {
  const next: T =
    // TypeScript needs more context to infer the type of update
    typeof update === 'function' && update instanceof Function
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
