/**
 * Wire protocol for the whiteboard custom-event channel. Every event lives
 * under `event.custom` with the envelope { type: 'whiteboard.<kind>', v, sid }.
 *
 * Inbound events come from other clients, so everything is shape-validated and
 * anything malformed or unknown is silently ignored (no warn-spam): the host
 * owns diagnostics, not us.
 */
import type { Op, Point, WhiteboardElement } from '../core/model';

export const WHITEBOARD_PROTOCOL_VERSION = 1;

export const WHITEBOARD_EVENT_PREFIX = 'whiteboard.';

interface BaseEnvelope {
  v: number;
  sid: string;
}

export interface SessionEvent extends BaseEnvelope {
  type: 'whiteboard.session';
  open: boolean;
}

export interface OpsEvent extends BaseEnvelope {
  type: 'whiteboard.ops';
  ops: Op[];
}

export interface RequestStateEvent extends BaseEnvelope {
  type: 'whiteboard.request-state';
}

export interface SnapshotEvent extends BaseEnvelope {
  type: 'whiteboard.snapshot';
  snapshotId: string;
  /** Chunk index (0-based). */
  i: number;
  /** Total chunk count. */
  n: number;
  /** One chunk of JSON.stringify(document). */
  data: string;
  open: boolean;
}

export type WhiteboardEvent =
  | SessionEvent
  | OpsEvent
  | RequestStateEvent
  | SnapshotEvent;

/** Outbound event minus the envelope fields the sender stamps (v, sid). */
export type OutboundEvent =
  | { type: 'whiteboard.session'; open: boolean }
  | { type: 'whiteboard.request-state' }
  | {
      type: 'whiteboard.snapshot';
      snapshotId: string;
      i: number;
      n: number;
      data: string;
      open: boolean;
    };

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isString = (value: unknown): value is string => typeof value === 'string';

const isPoint = (value: unknown): value is Point => {
  if (!value || typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;
  return isFiniteNumber(p.x) && isFiniteNumber(p.y);
};

const isPointArray = (value: unknown): value is Point[] =>
  Array.isArray(value) && value.every(isPoint);

const isElement = (value: unknown): value is WhiteboardElement => {
  if (!value || typeof value !== 'object') return false;
  const e = value as Record<string, unknown>;
  if (!isString(e.id) || !isFiniteNumber(e.version)) return false;
  if (!isString(e.strokeColor) || !isFiniteNumber(e.strokeWidth)) return false;
  switch (e.type) {
    case 'pen':
      return isPointArray(e.points);
    case 'line':
      return isPoint(e.a) && isPoint(e.b);
    case 'rect':
      return (
        isFiniteNumber(e.x) &&
        isFiniteNumber(e.y) &&
        isFiniteNumber(e.w) &&
        isFiniteNumber(e.h)
      );
    case 'text':
      return (
        isFiniteNumber(e.x) &&
        isFiniteNumber(e.y) &&
        isString(e.text) &&
        isFiniteNumber(e.fontSize)
      );
    default:
      return false;
  }
};

const isOp = (value: unknown): value is Op => {
  if (!value || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  if (!isFiniteNumber(o.epoch)) return false;
  switch (o.op) {
    case 'upsert':
      return isElement(o.element);
    case 'append':
      return (
        isString(o.id) && isPointArray(o.points) && isFiniteNumber(o.version)
      );
    case 'remove':
      return isString(o.id) && isFiniteNumber(o.version);
    case 'clear':
      return true;
    default:
      return false;
  }
};

/**
 * Validate and narrow a raw `event.custom` payload to a WhiteboardEvent, or
 * return null when it is not a (well-formed) whiteboard event.
 */
export const parseWhiteboardEvent = (
  custom: Record<string, unknown> | null | undefined,
): WhiteboardEvent | null => {
  if (!custom || typeof custom !== 'object') return null;
  const { type, v, sid } = custom;
  if (!isString(type) || !type.startsWith(WHITEBOARD_EVENT_PREFIX)) return null;
  if (!isFiniteNumber(v) || v !== WHITEBOARD_PROTOCOL_VERSION) return null;
  if (!isString(sid)) return null;

  switch (type) {
    case 'whiteboard.session':
      return typeof custom.open === 'boolean'
        ? { type, v, sid, open: custom.open }
        : null;
    case 'whiteboard.ops':
      return Array.isArray(custom.ops) && custom.ops.every(isOp)
        ? { type, v, sid, ops: custom.ops as Op[] }
        : null;
    case 'whiteboard.request-state':
      return { type, v, sid };
    case 'whiteboard.snapshot':
      return isString(custom.snapshotId) &&
        isFiniteNumber(custom.i) &&
        isFiniteNumber(custom.n) &&
        isString(custom.data) &&
        typeof custom.open === 'boolean'
        ? {
            type,
            v,
            sid,
            snapshotId: custom.snapshotId,
            i: custom.i,
            n: custom.n,
            data: custom.data,
            open: custom.open,
          }
        : null;
    default:
      return null;
  }
};
