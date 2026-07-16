/**
 * Receive-side smoothing for remote pen strokes. Because the outbound funnel is
 * throttled to ~1 send/sec, a remote pen batch carries ~1s of points at once.
 * Applying them instantly makes the stroke lurch forward each second; instead
 * we hold the full received path as a per-element "target" and reveal a growing
 * prefix of it into the store over ~0.9s via requestAnimationFrame, so the
 * stroke grows continuously. This hides the chunkiness but not the inherent
 * ~1s latency of the channel.
 *
 * Only pen ops are routed here. The caller applies everything else (line, rect,
 * text, remove, clear) directly, and calls cancel/cancelAll so a removed or
 * cleared element stops playing back.
 */
import type { SceneStore } from '../core/SceneStore';
import type { Op, Point } from '../core/model';
import { MIN_SEND_INTERVAL_MS } from './WhiteboardSender';

// Drain a backlog over ~85% of one send interval: fast enough to stay caught up
// between batches, leaving a small gap rather than running dry on a late batch.
const DRAIN_FRAMES = Math.max(
  6,
  Math.round((MIN_SEND_INTERVAL_MS * 0.85) / (1000 / 60)),
);
// Drop a caught-up entry after this much idle so target paths are not retained.
const IDLE_PRUNE_MS = 2500;

interface Entry {
  target: Point[];
  revealed: number;
  version: number;
  caughtUpSince: number | null;
}

export class PenPlayback {
  private store: SceneStore;
  private entries: Map<string, Entry> = new Map();
  private frame = 0;

  constructor(store: SceneStore) {
    this.store = store;
  }

  /** Route a remote pen op (caller guarantees its epoch matches the store). */
  ingest = (op: Op): void => {
    if (op.op === 'upsert') {
      const element = op.element;
      if (element.type !== 'pen') return;
      const existing = this.entries.get(element.id);
      if (existing) {
        existing.target = element.points.slice();
        existing.version = Math.max(existing.version, element.version);
        existing.caughtUpSince = null;
      } else {
        // Materialize the element (keeping any points it already has, e.g. from
        // a snapshot), then reveal the remaining points into it.
        const current = this.store.getDocument().elements[element.id];
        const startPoints =
          current && current.type === 'pen' ? current.points : [];
        this.store.apply({
          op: 'upsert',
          epoch: op.epoch,
          element: { ...element, points: startPoints.slice() },
        });
        this.entries.set(element.id, {
          target: element.points.slice(),
          revealed: startPoints.length,
          version: element.version,
          caughtUpSince: null,
        });
      }
    } else if (op.op === 'append') {
      let entry = this.entries.get(op.id);
      if (!entry) {
        // Entry was pruned (or we joined mid-stroke); rebuild from the store.
        const element = this.store.getDocument().elements[op.id];
        if (!element || element.type !== 'pen') return;
        entry = {
          target: element.points.slice(),
          revealed: element.points.length,
          version: op.version,
          caughtUpSince: null,
        };
        this.entries.set(op.id, entry);
      }
      entry.target = entry.target.concat(op.points);
      entry.version = Math.max(entry.version, op.version);
      entry.caughtUpSince = null;
    } else {
      return;
    }
    this.ensureRunning();
  };

  cancel = (id: string): void => {
    this.entries.delete(id);
  };

  cancelAll = (): void => {
    this.entries.clear();
  };

  dispose = (): void => {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.entries.clear();
  };

  private ensureRunning = (): void => {
    if (this.frame) return;
    this.frame = requestAnimationFrame(this.tick);
  };

  private tick = (): void => {
    this.frame = 0;
    const now = Date.now();
    let active = false;
    for (const [id, entry] of this.entries) {
      const backlog = entry.target.length - entry.revealed;
      if (backlog > 0) {
        const step = Math.max(2, Math.ceil(backlog / DRAIN_FRAMES));
        entry.revealed = Math.min(entry.target.length, entry.revealed + step);
        this.store.setPenPoints(
          id,
          entry.target.slice(0, entry.revealed),
          entry.version,
        );
        entry.caughtUpSince = null;
        active = true;
      } else if (entry.caughtUpSince === null) {
        entry.caughtUpSince = now;
        active = true;
      } else if (now - entry.caughtUpSince > IDLE_PRUNE_MS) {
        this.entries.delete(id);
      } else {
        active = true;
      }
    }
    if (active) this.frame = requestAnimationFrame(this.tick);
  };
}
