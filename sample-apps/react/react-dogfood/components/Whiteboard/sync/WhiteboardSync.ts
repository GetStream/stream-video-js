/**
 * Bridges the SceneStore to the Stream custom-event channel. It applies inbound
 * ops, dedupes echoes, owns the synced open flag, answers late joiners, and
 * periodically reconciles. All outbound traffic goes through WhiteboardSender;
 * this class never calls call.sendCustomEvent directly.
 *
 * Convergence rests on last-write-wins by version plus the clear epoch
 * (SceneStore.apply). Snapshots are therefore always *merged*, not replaced:
 * each element is applied as an upsert, so a snapshot can heal an established
 * client (fills gaps, never drops its newer strokes) and bootstrap a late
 * joiner (who starts empty) with the same code path. Because order does not
 * matter under LWW, live ops applied while a snapshot is in transit converge
 * with it regardless of arrival order, so no separate op buffering is needed.
 */
import type {
  Call,
  CustomVideoEvent,
  Logger,
} from '@stream-io/video-react-sdk';
import type { SceneStore } from '../core/SceneStore';
import type { Op, WhiteboardDocument } from '../core/model';
import {
  chunk,
  deserialize,
  reassemble,
  serialize,
} from '../core/serialization';
import { parseWhiteboardEvent, type SnapshotEvent } from './events';
import { PenPlayback } from './PenPlayback';
import { WhiteboardSender } from './WhiteboardSender';

const RECONCILE_INTERVAL_MS = 10_000;
const SNAPSHOT_TIMEOUT_MS = 3_000;
const RESPONSE_SLOT_MS = 150;
const MAX_SNAPSHOT_RETRIES = 2;
// How long a remote drawer's name stays attached to an element after their
// last op for it. Refreshes on every op, so it shows while drawing and fades
// shortly after they stop.
const PRESENCE_TTL_MS = 2_000;

export interface SessionActor {
  name: string;
}

export type OpenListener = (open: boolean, actor?: SessionActor) => void;

interface SnapshotAssembly {
  snapshotId: string;
  n: number;
  open: boolean;
  parts: Map<number, string>;
  timer: ReturnType<typeof setTimeout>;
}

export class WhiteboardSync {
  private call: Call;
  private sessionId: string;
  private store: SceneStore;
  private logger: Logger;
  private sender: WhiteboardSender;
  private playback: PenPlayback;

  private open = false;
  private openListeners: Set<OpenListener> = new Set();
  private unsubscribeCustom: (() => void) | null = null;

  private reconcileTimer: ReturnType<typeof setInterval> | null = null;
  private lastSnapshotRevision = -1;

  private assembly: SnapshotAssembly | null = null;
  private awaitingSnapshot = false;
  private awaitTimer: ReturnType<typeof setTimeout> | null = null;
  private snapshotRetries = 0;

  private pendingResponse: {
    timer: ReturnType<typeof setTimeout>;
    snapshotId: string;
  } | null = null;
  private snapshotCounter = 0;

  // elementId -> { drawer name, last-activity timestamp } for remote drawings.
  private presence: Map<string, { name: string; ts: number }> = new Map();
  private presenceTimer: ReturnType<typeof setTimeout> | null = null;
  private presenceListeners: Set<() => void> = new Set();

  constructor(
    call: Call,
    sessionId: string,
    store: SceneStore,
    logger: Logger,
  ) {
    this.call = call;
    this.sessionId = sessionId;
    this.store = store;
    this.logger = logger;
    this.sender = new WhiteboardSender(call, sessionId, logger);
    this.playback = new PenPlayback(store);
  }

  start = (): void => {
    if (this.unsubscribeCustom) return;
    this.unsubscribeCustom = this.call.on('custom', this.onCustomEvent);
    this.requestState();
  };

  dispose = (): void => {
    this.unsubscribeCustom?.();
    this.unsubscribeCustom = null;
    this.stopReconcile();
    this.clearAwaitTimer();
    if (this.assembly) clearTimeout(this.assembly.timer);
    this.assembly = null;
    if (this.pendingResponse) clearTimeout(this.pendingResponse.timer);
    this.pendingResponse = null;
    if (this.presenceTimer) clearTimeout(this.presenceTimer);
    this.presenceTimer = null;
    this.presence.clear();
    this.presenceListeners.clear();
    this.playback.dispose();
    this.sender.dispose();
    this.openListeners.clear();
  };

  isOpen = (): boolean => this.open;

  /** Open/close the shared board for everyone (local action). */
  setOpen = (next: boolean): void => this.setOpenLocal(next);

  subscribeOpen = (listener: OpenListener): (() => void) => {
    this.openListeners.add(listener);
    return () => {
      this.openListeners.delete(listener);
    };
  };

  /** Notified when remote drawing presence changes (for live name labels). */
  subscribePresence = (listener: () => void): (() => void) => {
    this.presenceListeners.add(listener);
    return () => {
      this.presenceListeners.delete(listener);
    };
  };

  /** elementId -> drawer name for elements a remote peer is actively drawing. */
  getActiveDrawers = (): Map<string, string> => {
    const cutoff = Date.now() - PRESENCE_TTL_MS;
    const active = new Map<string, string>();
    for (const [id, entry] of this.presence) {
      if (entry.ts < cutoff) this.presence.delete(id);
      else active.set(id, entry.name);
    }
    return active;
  };

  /** Apply a local op optimistically and enqueue it for sending. */
  applyLocalOp = (op: Op): void => {
    this.store.apply(op);
    this.sender.enqueueOp(op);
  };

  /** Re-request state after a reconnect to catch up events missed offline. */
  onReconnected = (): void => {
    this.requestState();
  };

  private setOpenLocal = (next: boolean): void => {
    if (this.open === next) return;
    this.applyOpen(next);
    this.sender.enqueue({ type: 'whiteboard.session', open: next }, 'urgent');
  };

  private applyOpen = (next: boolean, actor?: SessionActor): void => {
    if (this.open === next) return;
    this.open = next;
    if (next) this.startReconcile();
    else this.stopReconcile();
    for (const listener of this.openListeners) listener(next, actor);
  };

  private notifyPresence = (): void => {
    for (const listener of this.presenceListeners) listener();
  };

  // One repaint shortly after the last activity so an expired label is cleared
  // (live updates while drawing already ride the store-change repaint).
  private schedulePresenceExpiry = (): void => {
    if (this.presenceTimer) clearTimeout(this.presenceTimer);
    this.presenceTimer = setTimeout(() => {
      this.presenceTimer = null;
      this.notifyPresence();
    }, PRESENCE_TTL_MS + 100);
  };

  private onCustomEvent = (event: CustomVideoEvent): void => {
    if (event.type !== 'custom') return;
    const parsed = parseWhiteboardEvent(
      event.custom as Record<string, unknown>,
    );
    if (!parsed) return;
    if (parsed.sid === this.sessionId) return; // echo dedupe (echo-agnostic)

    switch (parsed.type) {
      case 'whiteboard.session': {
        const name = event.user?.name || event.user?.id || 'Someone';
        this.applyOpen(parsed.open, { name });
        return;
      }
      case 'whiteboard.ops': {
        const name = event.user?.name || event.user?.id || 'Someone';
        for (const op of parsed.ops) {
          if (op.op === 'upsert' || op.op === 'append') {
            const id = op.op === 'upsert' ? op.element.id : op.id;
            this.presence.set(id, { name, ts: Date.now() });
          }
          this.applyInbound(op);
        }
        this.schedulePresenceExpiry();
        this.notifyPresence();
        return;
      }
      case 'whiteboard.request-state':
        this.scheduleSnapshotResponse();
        return;
      case 'whiteboard.snapshot':
        this.handleSnapshot(parsed);
        return;
    }
  };

  // Pen ops are smoothed via PenPlayback; everything else applies immediately.
  // remove/clear cancel any in-flight playback for the affected element(s).
  private applyInbound = (op: Op): void => {
    if (op.op === 'clear') {
      this.playback.cancelAll();
      this.store.apply(op);
      return;
    }
    if (op.op === 'remove') {
      this.playback.cancel(op.id);
      this.store.apply(op);
      return;
    }
    const isPen = op.op === 'append' || op.element.type === 'pen';
    if (!isPen) {
      this.store.apply(op);
      return;
    }
    // Smooth only when the epoch matches; otherwise let the store resolve the
    // clear epoch (drop a stale op / wipe on a missed clear) and reset playback.
    if (op.epoch === this.store.getEpoch()) {
      this.playback.ingest(op);
    } else {
      this.playback.cancelAll();
      this.store.apply(op);
    }
  };

  // ---- late joiner: requesting and receiving snapshots ---------------------

  private requestState = (): void => {
    if (this.peerCount() === 0) return;
    this.awaitingSnapshot = true;
    this.sender.enqueue({ type: 'whiteboard.request-state' }, 'bulk');
    this.resetAwaitTimer();
  };

  private resetAwaitTimer = (): void => {
    this.clearAwaitTimer();
    this.awaitTimer = setTimeout(this.onAwaitTimeout, SNAPSHOT_TIMEOUT_MS);
  };

  private clearAwaitTimer = (): void => {
    if (this.awaitTimer) clearTimeout(this.awaitTimer);
    this.awaitTimer = null;
  };

  private onAwaitTimeout = (): void => {
    this.awaitTimer = null;
    if (this.assembly) {
      clearTimeout(this.assembly.timer);
      this.assembly = null;
    }
    if (this.snapshotRetries < MAX_SNAPSHOT_RETRIES && this.peerCount() > 0) {
      this.snapshotRetries++;
      this.requestState();
    } else {
      this.awaitingSnapshot = false;
      this.snapshotRetries = 0;
    }
  };

  private handleSnapshot = (event: SnapshotEvent): void => {
    // Another peer is responding; drop our own pending response if any.
    if (this.pendingResponse) {
      clearTimeout(this.pendingResponse.timer);
      this.pendingResponse = null;
    }

    let assembly = this.assembly;
    if (!assembly || assembly.snapshotId !== event.snapshotId) {
      if (assembly) clearTimeout(assembly.timer);
      assembly = {
        snapshotId: event.snapshotId,
        n: event.n,
        open: event.open,
        parts: new Map(),
        timer: setTimeout(this.onAssemblyTimeout, SNAPSHOT_TIMEOUT_MS),
      };
      this.assembly = assembly;
    }
    assembly.parts.set(event.i, event.data);
    assembly.open = event.open;

    if (assembly.parts.size < assembly.n) return;
    clearTimeout(assembly.timer);
    this.assembly = null;
    this.completeSnapshot(assembly);
  };

  private onAssemblyTimeout = (): void => {
    this.assembly = null;
  };

  private completeSnapshot = (assembly: SnapshotAssembly): void => {
    const ordered: string[] = [];
    for (let i = 0; i < assembly.n; i++) {
      const part = assembly.parts.get(i);
      if (part === undefined) return; // incomplete; await timer will re-request
      ordered.push(part);
    }
    const doc = deserialize(reassemble(ordered));
    if (!doc) return;
    this.mergeSnapshot(doc);
    if (this.awaitingSnapshot) {
      this.applyOpen(assembly.open);
      this.awaitingSnapshot = false;
      this.snapshotRetries = 0;
      this.clearAwaitTimer();
    }
  };

  private mergeSnapshot = (doc: WhiteboardDocument): void => {
    // Adopt a newer clear epoch even when the snapshot is empty.
    if (doc.epoch > this.store.getEpoch()) {
      this.store.apply({ op: 'clear', epoch: doc.epoch });
    }
    for (const id in doc.elements) {
      this.store.apply({
        op: 'upsert',
        epoch: doc.epoch,
        element: doc.elements[id],
      });
    }
  };

  // ---- snapshot responder election -----------------------------------------

  private scheduleSnapshotResponse = (): void => {
    if (!this.holdsState() || this.pendingResponse) return;
    const snapshotId = `${this.sessionId}-snap-${this.snapshotCounter++}`;
    const timer = setTimeout(() => {
      this.pendingResponse = null;
      this.broadcastSnapshot(snapshotId);
    }, this.responseSlotDelay());
    this.pendingResponse = { timer, snapshotId };
  };

  private broadcastSnapshot = (snapshotId: string): void => {
    const data = serialize(this.store.getDocument());
    const chunks = chunk(data);
    const n = chunks.length;
    for (let i = 0; i < n; i++) {
      this.sender.enqueue(
        {
          type: 'whiteboard.snapshot',
          snapshotId,
          i,
          n,
          data: chunks[i],
          open: this.open,
        },
        'bulk',
      );
    }
    this.lastSnapshotRevision = this.store.getRevision();
  };

  private holdsState = (): boolean => this.open || !this.store.isEmpty();

  // ---- periodic reconciliation ---------------------------------------------

  private startReconcile = (): void => {
    if (this.reconcileTimer) return;
    this.reconcileTimer = setInterval(
      this.tickReconcile,
      RECONCILE_INTERVAL_MS,
    );
  };

  private stopReconcile = (): void => {
    if (this.reconcileTimer) clearInterval(this.reconcileTimer);
    this.reconcileTimer = null;
  };

  private tickReconcile = (): void => {
    if (!this.open || !this.isReconcileOwner()) return;
    if (this.store.getRevision() === this.lastSnapshotRevision) return;
    this.broadcastSnapshot(`${this.sessionId}-recon-${this.snapshotCounter++}`);
  };

  // ---- participant helpers --------------------------------------------------

  private participantSessionIds = (): string[] => {
    try {
      return this.call.state.participants
        .map((p) => p.sessionId)
        .filter((id): id is string => !!id);
    } catch (err) {
      this.logger('warn', 'whiteboard: unable to read participants', err);
      return [this.sessionId];
    }
  };

  private peerCount = (): number =>
    this.participantSessionIds().filter((id) => id !== this.sessionId).length;

  private isReconcileOwner = (): boolean => {
    const ids = this.participantSessionIds();
    if (ids.length === 0) return true;
    let smallest = ids[0];
    for (const id of ids) if (id < smallest) smallest = id;
    return smallest === this.sessionId;
  };

  private responseSlotDelay = (): number => {
    const ids = this.participantSessionIds().slice().sort();
    const index = ids.indexOf(this.sessionId);
    return (index < 0 ? ids.length : index) * RESPONSE_SLOT_MS;
  };
}
