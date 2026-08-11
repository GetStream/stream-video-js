/**
 * Owns the whiteboard document and applies ops with last-write-wins
 * reconciliation. Pure logic: no React, no SDK. The same `apply` path serves
 * both local optimistic ops and inbound remote ops, so convergence rules live
 * in exactly one place.
 *
 * Element ids are owner-scoped (`${sessionId}-${counter}`), so a given element
 * has a single writer and `version` is a per-element total order: no
 * cross-writer ties can occur, which keeps LWW trivial (strict-greater wins,
 * equal is a duplicate and ignored).
 */
import {
  createEmptyDocument,
  type Op,
  type Point,
  type WhiteboardDocument,
  type WhiteboardElement,
} from './model';

type Listener = () => void;

export class SceneStore {
  private doc: WhiteboardDocument = createEmptyDocument();
  private listeners: Set<Listener> = new Set();
  /** Bumped on every effective change so consumers can detect staleness. */
  private revision = 0;

  /** The live document. Read imperatively by the renderer; do not mutate. */
  getDocument = (): WhiteboardDocument => this.doc;

  getEpoch = (): number => this.doc.epoch;

  getRevision = (): number => this.revision;

  isEmpty = (): boolean => Object.keys(this.doc.elements).length === 0;

  /** Subscribe to change notifications; returns an unsubscribe function. */
  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /**
   * Set a pen element's revealed points directly, for receive-side smooth
   * playback (display-only catch-up). Bypasses LWW because it never decreases
   * information: the caller owns the full target path and reveals a growing
   * prefix of it. No-op if the element is missing or not a pen.
   */
  setPenPoints = (id: string, points: Point[], version: number): void => {
    const element = this.doc.elements[id];
    if (!element || element.type !== 'pen') return;
    // Never regress: a snapshot/merge may have already revealed more points.
    if (points.length < element.points.length) return;
    element.points = points;
    element.version = version;
    this.changed();
  };

  /**
   * Apply an op with LWW + clear-epoch semantics. Returns true when the
   * document actually changed (callers can skip a repaint otherwise).
   */
  apply = (op: Op): boolean => {
    if (op.op === 'clear') {
      // Only a strictly newer epoch wipes, so concurrent clears converge
      // without oscillation and a stale duplicate clear is a no-op.
      if (op.epoch <= this.doc.epoch) return false;
      this.doc = { epoch: op.epoch, elements: {} };
      this.changed();
      return true;
    }

    // An op stamped with an older epoch predates a clear we have already seen.
    if (op.epoch < this.doc.epoch) return false;
    // A newer epoch means a clear we missed; adopt it and wipe before applying.
    if (op.epoch > this.doc.epoch) {
      this.doc = { epoch: op.epoch, elements: {} };
    }

    switch (op.op) {
      case 'upsert':
        return this.applyUpsert(op.element);
      case 'append':
        return this.applyAppend(op.id, op.points, op.version);
      case 'remove':
        return this.applyRemove(op.id, op.version);
    }
  };

  /** Replace the whole document (snapshot load / late-joiner catch-up). */
  replaceDocument = (doc: WhiteboardDocument): void => {
    this.doc = { epoch: doc.epoch, elements: { ...doc.elements } };
    this.changed();
  };

  private applyUpsert = (element: WhiteboardElement): boolean => {
    const existing = this.doc.elements[element.id];
    if (existing && existing.version >= element.version) return false;
    this.doc.elements[element.id] = element;
    this.changed();
    return true;
  };

  private applyAppend = (
    id: string,
    points: Point[],
    version: number,
  ): boolean => {
    const existing = this.doc.elements[id];
    // Live-preview only: if the creating upsert was dropped we ignore the
    // append; the final upsert (full path) heals it.
    if (!existing || existing.type !== 'pen') return false;
    if (version <= existing.version) return false;
    existing.points = existing.points.concat(points);
    existing.version = version;
    this.changed();
    return true;
  };

  private applyRemove = (id: string, version: number): boolean => {
    const existing = this.doc.elements[id];
    if (!existing) return false;
    if (version < existing.version) return false;
    delete this.doc.elements[id];
    this.changed();
    return true;
  };

  private changed = (): void => {
    this.revision++;
    for (const listener of this.listeners) listener();
  };
}
