import type { Trace, TraceRecord } from './types';
import { DecodeStats, EncodeStats } from '../../gen/video/sfu/models/models';

export type TraceSlice = {
  snapshot: TraceRecord[];
  encodeStats: EncodeStats[] | undefined;
  decodeStats: DecodeStats[] | undefined;
  rollback: () => void;
};

export class Tracer {
  private buffer: TraceRecord[] = [];
  private enabled = true;
  private readonly id: string | null;

  private encodeStats: EncodeStats[] | undefined;
  private decodeStats: DecodeStats[] | undefined;

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

  setEncodeStats = (encodeStats: EncodeStats[]) => {
    if (!this.enabled) return;
    this.encodeStats = encodeStats;
  };

  setDecodeStats = (decodeStats: DecodeStats[]) => {
    if (!this.enabled) return;
    this.decodeStats = decodeStats;
  };

  take = (): TraceSlice => {
    const snapshot = this.buffer;
    this.buffer = [];
    return {
      snapshot,
      encodeStats: this.encodeStats,
      decodeStats: this.decodeStats,
      rollback: () => {
        this.buffer.unshift(...snapshot);
      },
    };
  };

  dispose = () => {
    this.buffer = [];
    this.encodeStats = undefined;
    this.decodeStats = undefined;
  };
}
