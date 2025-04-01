import type { RTCStatsDataType, Trace } from './types';

export class TraceBuffer {
  private buffer: [
    method: string,
    id: string | null,
    payload: RTCStatsDataType,
    timestamp: number,
  ][] = [];

  trace: Trace = (method, id, data) => {
    this.buffer.push([method, id, data, Date.now()]);
  };

  getAndFlush = () => {
    const buffer = this.buffer;
    this.buffer = [];
    return buffer;
  };

  dispose = () => {
    this.buffer = [];
  };
}
