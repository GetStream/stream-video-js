import type { Trace, TraceRecord } from './types';
import { PeerType, PerformanceStats } from '../../gen/video/sfu/models/models';

export type TraceSlice = {
  snapshot: TraceRecord[];
  encodeStats: PerformanceStats[] | undefined;
  decodeStats: PerformanceStats[] | undefined;
  rollback: () => void;
};

export class Tracer {
  private buffer: TraceRecord[] = [];
  private enabled = true;
  private readonly id: string | null;
  private readonly performanceStats = new Map<PeerType, PerformanceStats[]>();

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

  getPerformanceStats = (peerType: PeerType) => {
    return this.performanceStats.get(peerType);
  };

  setPerformanceStats = (peerType: PeerType, stats: PerformanceStats[]) => {
    this.performanceStats.set(peerType, stats);
  };

  take = (): TraceSlice => {
    const snapshot = this.buffer;
    this.buffer = [];
    return {
      snapshot,
      encodeStats: this.getPerformanceStats(PeerType.PUBLISHER_UNSPECIFIED),
      decodeStats: this.getPerformanceStats(PeerType.SUBSCRIBER),
      rollback: () => {
        this.buffer.unshift(...snapshot);
      },
    };
  };

  dispose = () => {
    this.buffer = [];
    this.performanceStats.clear();
  };
}
