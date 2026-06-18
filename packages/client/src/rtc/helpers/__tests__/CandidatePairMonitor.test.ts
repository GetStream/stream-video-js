import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CandidatePairMonitor, FLAP_HORIZON_MS } from '../CandidatePairMonitor';

// A pair on interface `net`; the local candidate carries `network-id ${net}`
// so the monitor keys it by interface. `seq` varies the exact candidate string
// while keeping the same interface key (a cosmetic refresh).
const pair = (net: string, seq = 0): RTCIceCandidatePair =>
  ({
    local: {
      candidate: `candidate:f${net} 1 udp ${1000 + seq} 1.1.1.${net} ${5000 + seq} typ srflx network-id ${net}`,
    },
    remote: { candidate: `candidate:r 1 udp 100 2.2.2.2 5000 typ host` },
  }) as unknown as RTCIceCandidatePair;

/**
 * Minimal in-memory stand-in for `RTCIceTransport`. `emit` flips the selected
 * pair and synchronously notifies the registered listener, mirroring the browser.
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
    });
    monitor.start();
  };

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
    start(pair('1'));
    expect(transport.addEventListener).toHaveBeenCalledWith(
      'selectedcandidatepairchange',
      expect.any(Function),
    );
    expect(onMigration).not.toHaveBeenCalled();
  });

  it('reports a genuine migration to a new interface when healthy', () => {
    start(pair('1'));
    transport.emit(pair('2'));
    expect(onMigration).toHaveBeenCalledTimes(1);
  });

  it('ignores a cosmetic candidate refresh on the same interface', () => {
    start(pair('1'));
    transport.emit(pair('1', 7)); // same network-id, different srflx
    expect(onMigration).not.toHaveBeenCalled();
  });

  it('ignores a null selected pair', () => {
    start(pair('1'));
    transport.emit(null);
    expect(onMigration).not.toHaveBeenCalled();
  });

  it('suppresses a flap back to a recent path (ping-pong)', () => {
    start(pair('1'));
    transport.emit(pair('2')); // 1 -> 2: genuine, fires
    transport.emit(pair('1')); // 2 -> 1: return to recent path -> ignored
    transport.emit(pair('2')); // 1 -> 2: still recent -> ignored
    expect(onMigration).toHaveBeenCalledTimes(1);
  });

  it('handles a 3-way path set, suppressing only returns', () => {
    start(pair('1'));
    transport.emit(pair('2')); // novel -> fire
    transport.emit(pair('3')); // novel -> fire
    transport.emit(pair('1')); // return -> ignored
    expect(onMigration).toHaveBeenCalledTimes(2);
  });

  it('fires again for a path that aged out of the flap horizon', () => {
    start(pair('1'));
    transport.emit(pair('2')); // 1 -> 2 fires; 1 and 2 are now recent
    expect(onMigration).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(FLAP_HORIZON_MS + 10); // 1 ages out
    transport.emit(pair('1')); // 2 -> 1: 1 is novel again -> fires
    expect(onMigration).toHaveBeenCalledTimes(2);
  });

  it('defers a change while ICE is not healthy', () => {
    start(pair('1'));
    stable = false;
    transport.emit(pair('2')); // not healthy -> connection machinery owns it
    expect(onMigration).not.toHaveBeenCalled();
    stable = true;
    transport.emit(pair('3')); // healthy again -> fires
    expect(onMigration).toHaveBeenCalledTimes(1);
  });

  it('removes the listener on stop and ignores later changes', () => {
    start(pair('1'));
    monitor!.stop();
    expect(transport.removeEventListener).toHaveBeenCalledWith(
      'selectedcandidatepairchange',
      expect.any(Function),
    );
    transport.emit(pair('2'));
    expect(onMigration).not.toHaveBeenCalled();
  });

  it('is idempotent on stop', () => {
    start(pair('1'));
    monitor!.stop();
    expect(() => monitor!.stop()).not.toThrow();
  });
});
