import type { Trace, TraceRecord } from './types';

export class Tracer {
  private buffer: TraceRecord[] = [];

  trace: Trace = (method, id, data) => {
    this.buffer.push([method, id, data, Date.now()]);
  };

  take = () => {
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
