import { beforeEach, describe, expect, it } from 'vitest';
import {
  hasPending,
  singleFlight,
  withCancellation,
  withoutConcurrency,
} from '../concurrency';

let log: string[] = [];

beforeEach(() => {
  log = [];
});

it('runs promises without concurrency', async () => {
  const tag = Symbol();
  const [run1, resolve1] = mockAsyncFn('promise1');
  const [run2, resolve2] = mockAsyncFn('promise2');
  const [run3, resolve3] = mockAsyncFn('promise3');

  const ready1 = withoutConcurrency(tag, run1);
  const ready2 = withoutConcurrency(tag, run2);
  const ready3 = withoutConcurrency(tag, run3);

  expect(log).toMatchObject(['promise1 start']);

  resolve1();
  await ready1;
  expect(log).toMatchObject([
    'promise1 start',
    'promise1 end',
    'promise2 start',
  ]);

  resolve2();
  await ready2;
  expect(log).toMatchObject([
    'promise1 start',
    'promise1 end',
    'promise2 start',
    'promise2 end',
    'promise3 start',
  ]);

  resolve3();
  await ready3;
  expect(log).toMatchObject([
    'promise1 start',
    'promise1 end',
    'promise2 start',
    'promise2 end',
    'promise3 start',
    'promise3 end',
  ]);
});

it('appends promises to a partially fulfulled queue', async () => {
  const tag = Symbol();
  const [run1, resolve1] = mockAsyncFn('promise1');
  const [run2, resolve2] = mockAsyncFn('promise2');
  const [run3, resolve3] = mockAsyncFn('promise3');

  const ready1 = withoutConcurrency(tag, run1);
  const ready2 = withoutConcurrency(tag, run2);

  expect(log).toMatchObject(['promise1 start']);

  resolve1();
  await ready1;
  expect(log).toMatchObject([
    'promise1 start',
    'promise1 end',
    'promise2 start',
  ]);

  const ready3 = withoutConcurrency(tag, run3);

  resolve2();
  await ready2;
  expect(log).toMatchObject([
    'promise1 start',
    'promise1 end',
    'promise2 start',
    'promise2 end',
    'promise3 start',
  ]);

  resolve3();
  await ready3;
  expect(log).toMatchObject([
    'promise1 start',
    'promise1 end',
    'promise2 start',
    'promise2 end',
    'promise3 start',
    'promise3 end',
  ]);
});

it('runs multiple queues in parallel', async () => {
  const tom = Symbol();
  const jerry = Symbol();

  const [runTom1, resolveTom1] = mockAsyncFn('tom1');
  const [runTom2, resolveTom2] = mockAsyncFn('tom2');
  const [runJerry1, resolveJerry1] = mockAsyncFn('jerry1');
  const [runJerry2, resolveJerry2] = mockAsyncFn('jerry2');

  const readyTom1 = withoutConcurrency(tom, runTom1);
  const readyTom2 = withoutConcurrency(tom, runTom2);
  const readyJerry1 = withoutConcurrency(jerry, runJerry1);
  const readyJerry2 = withoutConcurrency(jerry, runJerry2);

  expect(log).toMatchObject(['tom1 start', 'jerry1 start']);
  resolveTom1();
  await readyTom1;
  expect(log).toMatchObject([
    'tom1 start',
    'jerry1 start',
    'tom1 end',
    'tom2 start',
  ]);

  resolveJerry1();
  await readyJerry1;
  expect(log).toMatchObject([
    'tom1 start',
    'jerry1 start',
    'tom1 end',
    'tom2 start',
    'jerry1 end',
    'jerry2 start',
  ]);

  resolveTom2();
  await readyTom2;
  resolveJerry2();
  await readyJerry2;
  expect(log).toMatchObject([
    'tom1 start',
    'jerry1 start',
    'tom1 end',
    'tom2 start',
    'jerry1 end',
    'jerry2 start',
    'tom2 end',
    'jerry2 end',
  ]);
});

it('keeps track of pending promises', async () => {
  const tag = Symbol();
  const [run1, resolve1] = mockAsyncFn('promise1');
  const [run2, resolve2] = mockAsyncFn('promise2');

  expect(hasPending(tag)).toBeFalsy();

  const ready1 = withoutConcurrency(tag, run1);
  const ready2 = withoutConcurrency(tag, run2);

  expect(hasPending(tag)).toBeTruthy();

  resolve1();
  await ready1;
  expect(hasPending(tag)).toBeTruthy();

  resolve2();
  await ready2;
  expect(hasPending(tag)).toBeFalsy();
});

describe('single flight', () => {
  it('shares an in-flight promise for the wrapped function', async () => {
    const [run1, resolve1] = mockAsyncFn('promise1');
    const run = singleFlight(run1);

    const ready1 = run();
    const ready2 = run();

    expect(ready2).toBe(ready1);
    expect(log).toMatchObject(['promise1 start']);

    resolve1();
    await expect(Promise.all([ready1, ready2])).resolves.toEqual([
      undefined,
      undefined,
    ]);
    expect(log).toMatchObject(['promise1 start', 'promise1 end']);
  });

  it('allows a new execution after the in-flight promise settles', async () => {
    const [run1, resolve1] = mockAsyncFn('promise1');
    const run = singleFlight(run1);

    const ready1 = run();
    resolve1();
    await ready1;

    const ready2 = run();
    expect(ready2).not.toBe(ready1);

    resolve1();
    await ready2;
    expect(log).toMatchObject([
      'promise1 start',
      'promise1 end',
      'promise1 start',
      'promise1 end',
    ]);
  });

  it('does not share promises across different wrapped functions', async () => {
    const [runTom, resolveTom] = mockAsyncFn('tom');
    const [runJerry, resolveJerry] = mockAsyncFn('jerry');
    const tom = singleFlight(runTom);
    const jerry = singleFlight(runJerry);

    const readyTom = tom();
    const readyJerry = jerry();

    expect(readyJerry).not.toBe(readyTom);
    expect(log).toMatchObject(['tom start', 'jerry start']);

    resolveTom();
    resolveJerry();
    await Promise.all([readyTom, readyJerry]);
  });

  it('shares the first call arguments while a call is in flight', async () => {
    const run = singleFlight(async (value: string) => {
      log.push(`${value} start`);
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      log.push(`${value} end`);
      return value;
    });

    await expect(Promise.all([run('first'), run('second')])).resolves.toEqual([
      'first',
      'first',
    ]);
    expect(log).toMatchObject(['first start', 'first end']);
  });
});

describe('cancelation', () => {
  it('cancels promises mid-action', async () => {
    const tag = Symbol();
    const [run1, resolve1] = mockAsyncFn('promise1');
    const [run2, resolve2] = mockAsyncFn('promise2');

    const ready1 = withCancellation(tag, run1);

    expect(log).toMatchObject(['promise1 start']);

    const ready2 = withCancellation(tag, run2);

    expect(log).toMatchObject(['promise1 start', 'promise1 canceled']);

    resolve1();
    await ready1;
    resolve2();
    await ready2;
    expect(log).toMatchObject([
      'promise1 start',
      'promise1 canceled',
      'promise1 end',
      'promise2 start',
      'promise2 end',
    ]);
  });

  it('promises canceled before starting never run', async () => {
    const tag = Symbol();
    const [run1, resolve1] = mockAsyncFn('promise1');
    const [run2] = mockAsyncFn('promise2');
    const [run3, resolve3] = mockAsyncFn('promise3');

    const ready1 = withCancellation(tag, run1);
    withCancellation(tag, run2);
    const ready3 = withCancellation(tag, run3);

    expect(log).toMatchObject(['promise1 start', 'promise1 canceled']);

    resolve1();
    await ready1;
    resolve3();
    await ready3;
    expect(log).toMatchObject([
      'promise1 start',
      'promise1 canceled',
      'promise1 end',
      'promise3 start',
      'promise3 end',
    ]);
  });
});

/**
 * Creates a mock async function that can be imperatively controlled from outside.
 * It won't resolve until explicitly asked to.
 * @param name Human-readable name for logging purposes.
 * @returns A tuple: async function, and a callback to resolve it.
 */
function mockAsyncFn(name: string) {
  let resolve: (() => void) | undefined;
  let resolveOnRun = false;
  const logCanceled = () => {
    log.push(`${name} canceled`);
  };

  const run = (signal?: AbortSignal) => {
    if (signal) {
      signal.addEventListener('abort', logCanceled);
    }

    return new Promise<void>((res) => {
      resolve = res;
      log.push(`${name} start`);
      if (resolveOnRun) {
        resolve();
      }
    }).then(() => {
      log.push(`${name} end`);

      if (signal) {
        signal.removeEventListener('abort', logCanceled);
      }
    });
  };

  return [
    run,
    () => {
      // If the promise was not run, we don't have a resolver yet.
      // Instead, we set a flag that the promise should resolve as soon as possible.
      if (resolve) {
        resolve();
      } else {
        resolveOnRun = true;
      }
    },
  ] as const;
}
