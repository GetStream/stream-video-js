/**
 * The single rate-limited, coalescing funnel for all outbound whiteboard
 * events. `sendCustomEvent` is rate-limited per user, so no other code path
 * calls it directly: everything routes through here.
 *
 * - Element ops are buffered and coalesced (pen appends accumulate; repeated
 *   line/rect drafts collapse to the latest per id; a clear drops everything
 *   queued before it) into one `whiteboard.ops` batch flushed at most once per
 *   FLUSH_INTERVAL_MS.
 * - Discrete events (session toggle, state request, snapshot chunks) are paced
 *   through the same funnel so a snapshot is never bursted.
 * - On a send error (e.g. rate limit) it backs off exponentially and lets the
 *   next reconciliation snapshot heal any dropped ops.
 */
import type { Call, Logger } from '@stream-io/video-react-sdk';
import type { Op, Point } from '../core/model';
import { type OutboundEvent, WHITEBOARD_PROTOCOL_VERSION } from './events';

// sendCustomEvent is rate-limited per user (~60/min on the default tier). We
// send at most one event per MIN_SEND_INTERVAL_MS, coalescing everything drawn
// in between into a single batch. NOTE: 500ms == ~120/min, which exceeds the
// 60/min default - chosen for lower latency; if the backend limit is hit, the
// exponential backoff below absorbs it and the next snapshot heals any gap.
// Raise this toward ~1100ms to stay safely under 60/min.
export const MIN_SEND_INTERVAL_MS = 500;
const LEADING_DELAY_MS = 40;
const BASE_BACKOFF_MS = 2000;
const MAX_BACKOFF_MS = 15000;

type Dispatchable = OutboundEvent | { type: 'whiteboard.ops'; ops: Op[] };

export class WhiteboardSender {
  private call: Call;
  private sessionId: string;
  private logger: Logger;

  private pendingClear: Extract<Op, { op: 'clear' }> | null = null;
  private pendingById: Map<string, Op> = new Map();
  private urgent: OutboundEvent[] = [];
  private bulk: OutboundEvent[] = [];
  private preferBulk = false;

  private timer: ReturnType<typeof setTimeout> | null = null;
  private nextAllowedAt = 0;
  private backoffMs = 0;
  private disposed = false;

  constructor(call: Call, sessionId: string, logger: Logger) {
    this.call = call;
    this.sessionId = sessionId;
    this.logger = logger;
  }

  /** Buffer an element op for coalescing into the next `whiteboard.ops` batch. */
  enqueueOp = (op: Op): void => {
    if (this.disposed) return;
    if (op.op === 'clear') {
      this.pendingClear = op;
      this.pendingById.clear();
    } else {
      const id = op.op === 'upsert' ? op.element.id : op.id;
      this.pendingById.set(id, this.merge(this.pendingById.get(id), op));
    }
    this.scheduleFlush();
  };

  /** Queue a discrete event; `urgent` (session) jumps ahead of bulk/snapshot. */
  enqueue = (event: OutboundEvent, priority: 'urgent' | 'bulk'): void => {
    if (this.disposed) return;
    if (priority === 'urgent') this.urgent.push(event);
    else this.bulk.push(event);
    this.scheduleFlush();
  };

  dispose = (): void => {
    this.disposed = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.pendingById.clear();
    this.pendingClear = null;
    this.urgent = [];
    this.bulk = [];
  };

  private merge = (existing: Op | undefined, incoming: Op): Op => {
    if (incoming.op !== 'append') return incoming;
    if (existing?.op === 'upsert' && existing.element.type === 'pen') {
      const points = existing.element.points.concat(incoming.points);
      return {
        op: 'upsert',
        epoch: incoming.epoch,
        element: { ...existing.element, points, version: incoming.version },
      };
    }
    if (existing?.op === 'append') {
      const points: Point[] = existing.points.concat(incoming.points);
      return { ...existing, points, version: incoming.version };
    }
    return incoming;
  };

  private hasPendingWork = (): boolean =>
    this.urgent.length > 0 ||
    this.bulk.length > 0 ||
    this.pendingClear !== null ||
    this.pendingById.size > 0;

  private scheduleFlush = (): void => {
    if (this.disposed || this.timer) return;
    const delay = Math.max(LEADING_DELAY_MS, this.nextAllowedAt - Date.now());
    this.timer = setTimeout(this.flush, delay);
  };

  private flush = (): void => {
    this.timer = null;
    if (this.disposed) return;
    if (Date.now() < this.nextAllowedAt) {
      this.scheduleFlush();
      return;
    }
    const event = this.pickNext();
    if (event) this.dispatch(event);
    if (this.hasPendingWork()) this.scheduleFlush();
  };

  private pickNext = (): Dispatchable | null => {
    if (this.urgent.length) return this.urgent.shift()!;
    const hasOps = this.pendingClear !== null || this.pendingById.size > 0;
    const hasBulk = this.bulk.length > 0;
    if (hasOps && hasBulk) {
      this.preferBulk = !this.preferBulk;
      return this.preferBulk ? this.bulk.shift()! : this.buildOpsEvent();
    }
    if (hasOps) return this.buildOpsEvent();
    if (hasBulk) return this.bulk.shift()!;
    return null;
  };

  private buildOpsEvent = (): { type: 'whiteboard.ops'; ops: Op[] } => {
    const ops: Op[] = [];
    if (this.pendingClear) {
      ops.push(this.pendingClear);
      this.pendingClear = null;
    }
    for (const op of this.pendingById.values()) ops.push(op);
    this.pendingById.clear();
    return { type: 'whiteboard.ops', ops };
  };

  private dispatch = (event: Dispatchable): void => {
    // Reserve the next slot up front (the request goes out now), so spacing
    // holds regardless of how long the response takes.
    this.nextAllowedAt = Date.now() + MIN_SEND_INTERVAL_MS;
    const payload = {
      ...event,
      v: WHITEBOARD_PROTOCOL_VERSION,
      sid: this.sessionId,
    };
    this.call
      .sendCustomEvent(payload)
      .then(() => {
        this.backoffMs = 0;
      })
      .catch((err) => {
        this.logger('warn', 'whiteboard: custom event send failed', err);
        this.requeue(event);
        this.backoffMs = this.backoffMs
          ? Math.min(this.backoffMs * 2, MAX_BACKOFF_MS)
          : BASE_BACKOFF_MS;
        this.nextAllowedAt = Date.now() + this.backoffMs;
        this.scheduleFlush();
      });
  };

  // Element-op batches are not requeued: the periodic reconciliation snapshot
  // heals dropped ops. Discrete events are requeued so an open/close toggle or
  // a snapshot chunk is not silently lost on a transient failure.
  private requeue = (event: Dispatchable): void => {
    if (this.disposed) return;
    if (event.type === 'whiteboard.session') this.urgent.unshift(event);
    else if (event.type !== 'whiteboard.ops') this.bulk.unshift(event);
  };
}
