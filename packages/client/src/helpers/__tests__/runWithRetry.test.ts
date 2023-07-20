import { describe, expect, test, vi } from 'vitest';
import { RetryError, runWithRetry } from '../runWithRetry';
import { BehaviorSubject } from 'rxjs';

class APIError extends Error {
  public code: number;
  constructor({ code, message }: { code: number; message: string }) {
    super(message);
    this.code = code;
  }
}

// returns a mock function which fails pre-defined number of times
// after it runs out of "error attempts", it keeps resolving with what
// is being passed to it wrapped in an object with key "data"
const generateTestFunction = (errorOutTimes: number, timeout = 0) =>
  vi.fn().mockImplementation((data: any) => {
    return new Promise<{ data: any }>((resolve, reject) => {
      setTimeout(() => {
        if (errorOutTimes > 0) {
          --errorOutTimes;
          return reject(
            new APIError({
              code: 400 + errorOutTimes + 1,
              message: `Error ${400 + errorOutTimes + 1}`,
            }),
          );
        }

        return resolve({ data });
      }, timeout);
    });
  });

describe('runWithRetry', () => {
  test('run 2 times (1 retry) and reject due to retry attempt limit (2 fails)', async () => {
    const fn = generateTestFunction(2);

    const dataString = 'data';

    const promise = runWithRetry(fn, {
      retryAttempts: 1,
    })(dataString);

    await expect(promise).rejects.toThrowError(RetryError);
    await expect(promise).rejects.toThrow('Reached maximum amount of retries');
    expect(fn).toHaveBeenCalledWith(dataString);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('run 2 times (1 retry) and resolve (1 fail)', async () => {
    const fn = generateTestFunction(1);

    const dataString = 'data';

    const promise = runWithRetry(fn, {
      retryAttempts: 1,
    })(dataString);

    await expect(promise).resolves.toEqual({ data: dataString });
    expect(fn).toHaveBeenCalledWith(dataString);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('run 3 times (2 retries) and reject on isRetryable fail (returns false)', async () => {
    const fn = generateTestFunction(3);

    const dataString = 'data';

    const promise = runWithRetry(fn, {
      retryAttempts: 2,
      isRetryable: (error) => {
        return [403, 402].includes((error as APIError).code);
      },
    })(dataString);

    await expect(promise).rejects.toThrowError(APIError);
    await expect(promise).rejects.toThrow('Error 401');
    expect(fn).toHaveBeenCalledWith(dataString);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  test('run once (1 retry) and reject due value change', async () => {
    const fn = generateTestFunction(2, 200);

    const initialState = [1];
    const subject = new BehaviorSubject(initialState);

    setTimeout(() => {
      const currentValue = subject.getValue();
      subject.next([...currentValue, 2]);
    }, 100);

    const promise = runWithRetry(fn, {
      retryAttempts: 1,
      didValueChange: (data) => data !== subject.getValue(),
    })(subject.getValue());

    await expect(promise).rejects.toThrowError(RetryError);
    await expect(promise).rejects.toThrow(
      'Value changed, retry handler aborted',
    );
    expect(fn).toHaveBeenCalledWith(initialState);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('run 4 times (3 retries) and check delayBetweenRetries functionality', async () => {
    const fn = generateTestFunction(3);
    const delayFn = vi.fn().mockImplementation((t) => t * 100);

    const dataString = 'data';

    const promise = runWithRetry(fn, {
      retryAttempts: 3,
      delayBetweenRetries: delayFn,
    })(dataString);

    await expect(promise).resolves.toEqual({ data: dataString });
    expect(delayFn).toHaveBeenCalledTimes(2);
    expect(delayFn).toHaveBeenLastCalledWith(1);
    expect(fn).toHaveBeenCalledWith(dataString);
    expect(fn).toHaveBeenCalledTimes(4);
  });
});
