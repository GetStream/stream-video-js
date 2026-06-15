import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CandidatePairMonitor } from '../CandidatePairMonitor';

const SETTLE = 100;

const pair = (local: string, remote: string): RTCIceCandidatePair =>
  ({
    local: { candidate: local },
    remote: { candidate: remote },
  }) as unknown as RTCIceCandidatePair;

/**
 * Minimal in-memory stand-in for `RTCIceTransport`. `emit` flips the selected
 * pair and synchronously notifies the registered `selectedcandidatepairchange`
 * listeners, mirroring what the browser does.
 */
class FakeIceTransport {
  private selected: RTCIceCandidatePair | null = null;
  private listeners = new Set<() => void>();

  getSelectedCandidatePair = vi.fn(() => this.selected);
  addEventListener = vi.fn((_type: string, cb: () => void) => {
    this.listeners.add(cb);
  });
  removeEventListener = vi.fn((_type: string, cb: () => void) => {
    this.listeners.delete(cb);
  });

  setSelected = (next: RTCIceCandidatePair | null) => {
    this.selected = next;
  };
  emit = (next: RTCIceCandidatePair | null) => {
    this.selected = next;
    this.listeners.forEach((cb) => cb());
  };
}

describe('CandidatePairMonitor', () => {
  let transport: FakeIceTransport;
  let stable: boolean;
  let onMigration: ReturnType<typeof vi.fn>;
  let monitor: CandidatePairMonitor | undefined;

  const start = (initial: RTCIceCandidatePair | null = null) => {
    transport.setSelected(initial);
    monitor = new CandidatePairMonitor({
      iceTransport: transport as unknown as RTCIceTransport,
      isStable: () => stable,
      onMigration,
      settleDelayMs: SETTLE,
    });
    monitor.start();
  };

  // advances past one settle window so the initial suppression lifts
  const reachSteadyState = () => vi.advanceTimersByTime(SETTLE);

  beforeEach(() => {
    vi.useFakeTimers();
    transport = new FakeIceTransport();
    stable = true;
    onMigration = vi.fn();
  });

  afterEach(() => {
    monitor?.stop();
    monitor = undefined;
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('registers a listener and does not migrate without a change', () => {
    start(pair('a', 'x'));
    expect(transport.addEventListener).toHaveBeenCalledWith(
      'selectedcandidatepairchange',
      expect.any(Function),
    );
    reachSteadyState();
    expect(onMigration).not.toHaveBeenCalled();
  });

  it('absorbs the initial-connect candidate churn', () => {
    stable = false;
    start(null);
    transport.emit(pair('a', 'x')); // first observation -> baseline
    transport.emit(pair('b', 'y')); // churn before stable -> absorbed
    stable = true;
    reachSteadyState();
    expect(onMigration).not.toHaveBeenCalled();
  });

  it('reports an organic migration when stable and not suppressed', () => {
    start(pair('a', 'x'));
    reachSteadyState();
    transport.emit(pair('b', 'y'));
    expect(onMigration).toHaveBeenCalledTimes(1);
  });

  it('ignores a change to an identical pair', () => {
    start(pair('a', 'x'));
    reachSteadyState();
    transport.emit(pair('a', 'x'));
    expect(onMigration).not.toHaveBeenCalled();
  });

  it('ignores a null selected pair', () => {
    start(pair('a', 'x'));
    reachSteadyState();
    transport.emit(null);
    expect(onMigration).not.toHaveBeenCalled();
  });

  it('suppresses pair changes during a restart window', () => {
    start(pair('a', 'x'));
    reachSteadyState();

    monitor!.suppress(); // restart begins
    transport.emit(pair('b', 'y')); // restart-induced -> absorbed
    vi.advanceTimersByTime(SETTLE / 2);
    transport.emit(pair('c', 'z')); // still within window -> absorbed
    expect(onMigration).not.toHaveBeenCalled();

    vi.advanceTimersByTime(SETTLE); // window elapses while stable
    transport.emit(pair('d', 'w')); // a later organic change fires
    expect(onMigration).toHaveBeenCalledTimes(1);
  });

  it('coalesces overlapping restarts', () => {
    start(pair('a', 'x'));
    reachSteadyState();

    monitor!.suppress();
    vi.advanceTimersByTime(SETTLE - 10);
    monitor!.suppress(); // resets the window; without coalescing it would lift in 10ms
    vi.advanceTimersByTime(SETTLE - 10);
    transport.emit(pair('b', 'y')); // would migrate if suppression had lifted
    expect(onMigration).not.toHaveBeenCalled();
  });

  it('defers a change observed while not stable', () => {
    start(pair('a', 'x'));
    reachSteadyState();

    stable = false;
    transport.emit(pair('b', 'y')); // not suppressed, not stable -> defer
    expect(onMigration).not.toHaveBeenCalled();

    stable = true;
    reachSteadyState(); // re-baselines, no migration for the deferred change
    expect(onMigration).not.toHaveBeenCalled();
  });

  it('cancels a pending settle window on stop', () => {
    start(pair('a', 'x'));
    monitor!.suppress();
    monitor!.stop();
    expect(transport.removeEventListener).toHaveBeenCalledWith(
      'selectedcandidatepairchange',
      expect.any(Function),
    );
    vi.advanceTimersByTime(SETTLE * 5);
    transport.emit(pair('b', 'y'));
    expect(onMigration).not.toHaveBeenCalled();
  });

  it('lifts suppression after the re-arm cap when never stable', () => {
    stable = false;
    start(pair('a', 'x'));
    vi.advanceTimersByTime(SETTLE * 12); // exceed the re-arm cap
    expect(vi.getTimerCount()).toBe(0);

    stable = true;
    transport.emit(pair('b', 'y'));
    expect(onMigration).toHaveBeenCalledTimes(1);
  });

  it('is idempotent on stop', () => {
    start(pair('a', 'x'));
    monitor!.stop();
    expect(() => monitor!.stop()).not.toThrow();
  });
});
