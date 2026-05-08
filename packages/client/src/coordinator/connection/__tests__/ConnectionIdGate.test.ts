import { describe, expect, it } from 'vitest';
import { ConnectionIdGate } from '../internal/ConnectionIdGate';

describe('ConnectionIdGate', () => {
  it('await() before arm() throws', () => {
    const gate = new ConnectionIdGate();
    expect(() => gate.await()).toThrow(/not armed/);
  });

  it('arm() is idempotent while pending; second await() returns the same promise', () => {
    const gate = new ConnectionIdGate();
    gate.arm();
    const first = gate.await();
    gate.arm();
    const second = gate.await();
    expect(first).toBe(second);
  });

  it('resolve(id) settles all pending awaiters with id', async () => {
    const gate = new ConnectionIdGate();
    gate.arm();
    const a = gate.await();
    const b = gate.await();
    gate.resolve('conn-id');
    await expect(a).resolves.toBe('conn-id');
    await expect(b).resolves.toBe('conn-id');
  });

  it('reject(err) settles all pending awaiters with the error', async () => {
    const gate = new ConnectionIdGate();
    gate.arm();
    const a = gate.await();
    const err = new Error('boom');
    gate.reject(err);
    await expect(a).rejects.toThrow('boom');
  });

  it('reset() discards the gate; subsequent await() throws until next arm()', async () => {
    const gate = new ConnectionIdGate();
    gate.arm();
    const inflight = gate.await();
    gate.resolve('conn-id');
    await inflight; // drain
    gate.reset();
    expect(() => gate.await()).toThrow(/not armed/);
    gate.arm();
    expect(gate.isPending()).toBe(true);
  });

  it('resolve()/reject() after settlement is a no-op', async () => {
    const gate = new ConnectionIdGate();
    gate.arm();
    const inflight = gate.await();
    gate.resolve('first');
    gate.resolve('second');
    gate.reject(new Error('ignored'));
    await expect(inflight).resolves.toBe('first');
  });

  it('isPending / isSettled reflect state correctly across the lifecycle', () => {
    const gate = new ConnectionIdGate();
    expect(gate.isPending()).toBe(false);
    expect(gate.isSettled()).toBe(false);
    gate.arm();
    expect(gate.isPending()).toBe(true);
    expect(gate.isSettled()).toBe(false);
    gate.resolve('id');
    expect(gate.isPending()).toBe(false);
    expect(gate.isSettled()).toBe(true);
    gate.reset();
    expect(gate.isPending()).toBe(false);
    expect(gate.isSettled()).toBe(false);
  });

  it('F1: rejects in-flight awaiter BEFORE subsequent arm() rotates state', async () => {
    const gate = new ConnectionIdGate();
    gate.arm();
    const awaiter = gate.await(); // captures P1
    gate.reject(new Error('boom')); // settles P1
    gate.arm(); // P1 already settled, so this rotates to fresh P2
    const newAwaiter = gate.await();
    await expect(awaiter).rejects.toThrow('boom');
    expect(awaiter).not.toBe(newAwaiter);
  });

  it('arm() after settlement rotates to a fresh pending promise', async () => {
    const gate = new ConnectionIdGate();
    gate.arm();
    gate.resolve('id-1');
    gate.arm();
    expect(gate.isPending()).toBe(true);
    const fresh = gate.await();
    let resolved = false;
    fresh.then(() => {
      resolved = true;
    });
    // Give microtasks a tick
    await Promise.resolve();
    expect(resolved).toBe(false);
    gate.resolve('id-2');
    await expect(fresh).resolves.toBe('id-2');
  });
});
