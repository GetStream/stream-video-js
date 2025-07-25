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
  private keys?: Map<TraceKey, boolean>;

  constructor(id: string | null) {
    this.id = id;
  }

  setEnabled = (enabled: boolean) => {
    if (this.enabled === enabled) return;
    this.enabled = enabled;
    this.buffer = [];
  };

  trace: Trace = (tag, data) => {
    if (!this.enabled) return;
    this.buffer.push([tag, this.id, data, Date.now()]);
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
      },
    };
  };

  dispose = () => {
    this.buffer = [];
    this.keys?.clear();
  };
}
