import type {
  RTCStatsDataType,
  Trace,
  TraceKey,
  TraceRecord,
  TraceSlice,
} from './types';

export class Tracer {
  private buffer: TraceRecord[] = [];
  private enabled = true;
  private readonly id: string | null;
  private readonly maxBuffer: number;
  private keys?: Map<TraceKey, boolean>;

  constructor(id: string | null, maxBuffer: number = 2500) {
    this.id = id;
    this.maxBuffer = maxBuffer;
  }

  /**
   * The id stamped onto every trace record produced by this tracer.
   */
  get traceId(): string | null {
    return this.id;
  }

  setEnabled = (enabled: boolean) => {
    if (this.enabled === enabled) return;
    this.enabled = enabled;
    this.buffer = [];
  };

  trace: Trace = (tag, data) => {
    if (!this.enabled) return;
    this.buffer.push([tag, this.id, data, Date.now()]);
    this.capBuffer();
  };

  traceOnce = (key: TraceKey, tag: string, data: RTCStatsDataType) => {
    if (this.keys?.has(key)) return;
    this.trace(tag, data);
    (this.keys ??= new Map()).set(key, true);
  };

  resetTrace = (key: TraceKey) => {
    this.keys?.delete(key);
  };

  take = (): TraceSlice => {
    const snapshot = this.buffer;
    this.buffer = [];
    return {
      snapshot,
      rollback: () => {
        this.buffer.unshift(...snapshot);
        this.capBuffer();
      },
    };
  };

  dispose = () => {
    this.buffer = [];
    this.keys?.clear();
  };

  /**
   * Bounds the buffer to `maxBuffer` records by dropping the oldest ones,
   * leaving a single `tracebufferoverflow` breadcrumb at the front so the
   * consumer knows records were dropped. Prevents unbounded growth (and the
   * eventual oversized, un-sendable payload) under sustained delivery failure.
   */
  private capBuffer = () => {
    const overflow = this.buffer.length - this.maxBuffer;
    if (overflow <= 0) return;
    this.buffer.splice(0, overflow);
    this.buffer[0] = [
      'tracebufferoverflow',
      this.id,
      { dropped: overflow },
      Date.now(),
    ];
  };
}
