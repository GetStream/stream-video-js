import { describe, expect, it } from 'vitest';
import { enqueue } from '../e2ee-worker/queue';

describe('enqueue', () => {
  it('carries the task outcome back to its own caller', async () => {
    await expect(enqueue(async () => 42)).resolves.toBe(42);
    await expect(
      enqueue(async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
  });

  it('preserves task ordering', async () => {
    const order: number[] = [];
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        enqueue(async () => {
          await Promise.resolve();
          order.push(i);
        }),
      );
    }
    await Promise.all(promises);
    expect(order).toEqual([0, 1, 2, 3, 4]);
  });

  it('runs tasks serially, never overlapping a previous task still in flight', async () => {
    // Serialization, not just emission order: each task body yields several
    // microtasks while "active". If two ran concurrently, active would exceed 1.
    let active = 0;
    let maxActive = 0;
    const task = () =>
      enqueue(async () => {
        active++;
        maxActive = Math.max(maxActive, active);
        await Promise.resolve();
        await Promise.resolve();
        active--;
      });
    await Promise.all([task(), task(), task()]);
    expect(maxActive).toBe(1);
  });

  it('continues running later tasks after one rejects', async () => {
    const seen: string[] = [];
    const ok1 = enqueue(async () => {
      seen.push('a');
    });
    const bad = enqueue(async () => {
      seen.push('b');
      throw new Error('fail');
    });
    const ok2 = enqueue(async () => {
      seen.push('c');
    });
    await Promise.all([ok1, bad.catch(() => {}), ok2]);
    expect(seen).toEqual(['a', 'b', 'c']);
  });
});
