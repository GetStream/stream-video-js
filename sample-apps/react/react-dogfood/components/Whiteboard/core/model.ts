/**
 * Pure data model for the collaborative whiteboard.
 *
 * Geometry is stored in an infinite "world coordinate" space. Each client
 * renders the world through its own local viewport transform, so a drawing
 * looks geometrically identical on every device regardless of screen size.
 * See viewport.ts for the transform. This module has no React and no SDK
 * dependency on purpose: it is the lowest layer everything else builds on.
 */

/** A point in world coordinates. */
export interface Point {
  x: number;
  y: number;
}

/** Axis-aligned bounding box in world coordinates. */
export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * The tools available in v1. `eraser` removes whole elements it touches; `pan`
 * drags the viewport instead of drawing (handled by the canvas, not the
 * controller).
 */
export type Tool = 'pen' | 'line' | 'rect' | 'text' | 'eraser' | 'pan';

/** Fields shared by every element. */
export interface BaseElement {
  id: string;
  /** Monotonic per-sender counter used for last-write-wins reconciliation. */
  version: number;
  strokeColor: string;
  strokeWidth: number;
}

export interface PenElement extends BaseElement {
  type: 'pen';
  /** Freehand path in world coords, appended while the stroke is in progress. */
  points: Point[];
}

export interface LineElement extends BaseElement {
  type: 'line';
  a: Point;
  b: Point;
}

export interface RectElement extends BaseElement {
  type: 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
}

export type WhiteboardElement =
  | PenElement
  | LineElement
  | RectElement
  | TextElement;

export interface WhiteboardDocument {
  /**
   * Monotonically increasing clear epoch. A `clear` bumps it; ops stamped with
   * an older epoch are dropped on receipt so a stroke in flight during a clear
   * cannot resurrect a wiped board.
   */
  epoch: number;
  elements: Record<string, WhiteboardElement>;
}

export const createEmptyDocument = (): WhiteboardDocument => ({
  epoch: 0,
  elements: {},
});

/**
 * The mutation vocabulary applied to a document, locally (optimistic) and from
 * remote peers. Every op carries the `epoch` it was created under so a stroke
 * in flight during a `clear` is dropped on receipt instead of resurrecting a
 * wiped board.
 *
 * - `upsert`  creates or replaces an element (pen create + final, line/rect
 *             draft + final, text commit); `element.version` is the LWW key.
 * - `append`  adds points to an existing pen element during a live stroke; the
 *             final `upsert` carries the complete path and heals dropped
 *             appends, so appends are best-effort live preview only.
 * - `remove`  deletes one element (reserved: not surfaced in the v1 UI, which
 *             only offers clear-all).
 * - `clear`   wipes the board and bumps the epoch.
 */
export type Op =
  | { op: 'upsert'; epoch: number; element: WhiteboardElement }
  | {
      op: 'append';
      epoch: number;
      id: string;
      points: Point[];
      version: number;
    }
  | { op: 'remove'; epoch: number; id: string; version: number }
  | { op: 'clear'; epoch: number };

/**
 * Rough per-character width factor used to estimate text bounds without a
 * canvas context. Generous on purpose: over-estimating only widens culling and
 * fit-to-content framing, which is harmless.
 */
const TEXT_WIDTH_FACTOR = 0.6;
const TEXT_HEIGHT_FACTOR = 1.2;

/** World-space bounding box of a single element, padded by half the stroke. */
export const elementBounds = (element: WhiteboardElement): Bounds => {
  const pad = element.strokeWidth / 2;
  let minX: number;
  let minY: number;
  let maxX: number;
  let maxY: number;

  switch (element.type) {
    case 'pen': {
      const { points } = element;
      if (points.length === 0) {
        return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
      }
      minX = maxX = points[0].x;
      minY = maxY = points[0].y;
      for (const p of points) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
      break;
    }
    case 'line': {
      minX = Math.min(element.a.x, element.b.x);
      maxX = Math.max(element.a.x, element.b.x);
      minY = Math.min(element.a.y, element.b.y);
      maxY = Math.max(element.a.y, element.b.y);
      break;
    }
    case 'rect': {
      minX = Math.min(element.x, element.x + element.w);
      maxX = Math.max(element.x, element.x + element.w);
      minY = Math.min(element.y, element.y + element.h);
      maxY = Math.max(element.y, element.y + element.h);
      break;
    }
    case 'text': {
      const width = element.text.length * element.fontSize * TEXT_WIDTH_FACTOR;
      const height = element.fontSize * TEXT_HEIGHT_FACTOR;
      minX = element.x;
      minY = element.y;
      maxX = element.x + width;
      maxY = element.y + height;
      break;
    }
  }

  return {
    minX: minX - pad,
    minY: minY - pad,
    maxX: maxX + pad,
    maxY: maxY + pad,
  };
};

/**
 * The "leading" world point of an element - where a drawer's name tag should
 * sit. For a pen it is the last (most recently revealed) point, so the tag
 * follows the pen tip as a stroke animates in; for other shapes it is the
 * end/anchor being dragged.
 */
export const elementLeadingPoint = (element: WhiteboardElement): Point => {
  switch (element.type) {
    case 'pen':
      return element.points.length > 0
        ? element.points[element.points.length - 1]
        : { x: 0, y: 0 };
    case 'line':
      return element.b;
    case 'rect':
      return { x: element.x + element.w, y: element.y + element.h };
    case 'text':
      return { x: element.x, y: element.y };
  }
};

/** World-space bounding box of the whole document, or null when empty. */
export const documentBounds = (doc: WhiteboardDocument): Bounds | null => {
  let result: Bounds | null = null;
  for (const id in doc.elements) {
    const b = elementBounds(doc.elements[id]);
    if (!result) {
      result = { ...b };
    } else {
      if (b.minX < result.minX) result.minX = b.minX;
      if (b.minY < result.minY) result.minY = b.minY;
      if (b.maxX > result.maxX) result.maxX = b.maxX;
      if (b.maxY > result.maxY) result.maxY = b.maxY;
    }
  }
  return result;
};

/** True when the two world-space boxes overlap (used for viewport culling). */
export const boundsIntersect = (a: Bounds, b: Bounds): boolean =>
  a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;

/** Shortest distance from point p to the segment a-b, in world units. */
const distanceToSegment = (p: Point, a: Point, b: Point): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
};

/**
 * True when world point p is within `tolerance` of the element. Used by the
 * eraser: strokes/lines hit-test against the actual path; rectangles and text
 * hit-test against their (padded) bounding box so dragging anywhere over them
 * erases.
 */
export const hitTestElement = (
  element: WhiteboardElement,
  p: Point,
  tolerance: number,
): boolean => {
  switch (element.type) {
    case 'pen': {
      const reach = tolerance + element.strokeWidth / 2;
      const { points } = element;
      if (points.length === 0) return false;
      if (points.length === 1) {
        return Math.hypot(p.x - points[0].x, p.y - points[0].y) <= reach;
      }
      for (let i = 1; i < points.length; i++) {
        if (distanceToSegment(p, points[i - 1], points[i]) <= reach) {
          return true;
        }
      }
      return false;
    }
    case 'line':
      return (
        distanceToSegment(p, element.a, element.b) <=
        tolerance + element.strokeWidth / 2
      );
    case 'rect':
    case 'text': {
      const b = elementBounds(element);
      return (
        p.x >= b.minX - tolerance &&
        p.x <= b.maxX + tolerance &&
        p.y >= b.minY - tolerance &&
        p.y <= b.maxY + tolerance
      );
    }
  }
};
