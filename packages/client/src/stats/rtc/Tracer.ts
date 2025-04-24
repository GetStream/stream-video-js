import type { Trace, TraceRecord } from './types';

export type TraceSlice = {
  snapshot: TraceRecord[];
  rollback: () => void;
};

export class Tracer {
  private buffer: TraceRecord[] = [];
  private enabled = true;
  private readonly id: string | null;

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
  };
}
