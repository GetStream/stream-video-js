/**
 * Per-client viewport transform. Zoom and pan are purely local: only world
 * coordinates ever sync, so a phone and a 4K monitor see the same world
 * through different windows with no stretching. Pure math, no side effects.
 *
 *   screen = (world - pan) * zoom
 *   world  = screen / zoom + pan
 *
 * (panX, panY) is the world coordinate shown at the canvas top-left; zoom is
 * world-units per screen pixel scale.
 */
import type { Bounds, Point } from './model';

export interface Viewport {
  zoom: number;
  panX: number;
  panY: number;
}

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 8;

export const createViewport = (): Viewport => ({ zoom: 1, panX: 0, panY: 0 });

export const clampZoom = (zoom: number): number =>
  Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

export const screenToWorld = (vp: Viewport, screen: Point): Point => ({
  x: screen.x / vp.zoom + vp.panX,
  y: screen.y / vp.zoom + vp.panY,
});

export const worldToScreen = (vp: Viewport, world: Point): Point => ({
  x: (world.x - vp.panX) * vp.zoom,
  y: (world.y - vp.panY) * vp.zoom,
});

/**
 * Zoom by a multiplicative `factor` while keeping the world point under
 * `anchor` (screen pixels) pinned in place. Returns the same instance when the
 * zoom is already clamped at a limit so callers can skip no-op repaints.
 */
export const zoomAt = (
  vp: Viewport,
  anchor: Point,
  factor: number,
): Viewport => {
  const zoom = clampZoom(vp.zoom * factor);
  if (zoom === vp.zoom) return vp;
  const worldUnderAnchor = screenToWorld(vp, anchor);
  return {
    zoom,
    panX: worldUnderAnchor.x - anchor.x / zoom,
    panY: worldUnderAnchor.y - anchor.y / zoom,
  };
};

/** Translate the viewport by a screen-space delta (wheel scroll / drag pan). */
export const panBy = (
  vp: Viewport,
  dxScreen: number,
  dyScreen: number,
): Viewport => ({
  zoom: vp.zoom,
  panX: vp.panX + dxScreen / vp.zoom,
  panY: vp.panY + dyScreen / vp.zoom,
});

/** Reset to world origin at 100%. */
export const resetViewport = (): Viewport => createViewport();

/**
 * Viewport that frames `bounds` inside a canvas of the given CSS size, with a
 * fractional `padding` margin. Drives fit-to-content on open / late-join and
 * the toolbar Fit action.
 */
export const fitToBounds = (
  bounds: Bounds,
  viewW: number,
  viewH: number,
  padding = 0.1,
): Viewport => {
  const bw = Math.max(1, bounds.maxX - bounds.minX);
  const bh = Math.max(1, bounds.maxY - bounds.minY);
  const scale = Math.min(viewW / bw, viewH / bh) * (1 - padding);
  const zoom = clampZoom(scale);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  return {
    zoom,
    panX: centerX - viewW / 2 / zoom,
    panY: centerY - viewH / 2 / zoom,
  };
};

/**
 * Viewport that centers `bounds` in a canvas of the given CSS size at a fixed
 * zoom (default 100%), without scaling to fit. Used for the open / late-join
 * start position so the board always opens at 100% but still lands on content.
 */
export const centerOnBounds = (
  bounds: Bounds,
  viewW: number,
  viewH: number,
  zoom = 1,
): Viewport => {
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  return {
    zoom,
    panX: centerX - viewW / 2 / zoom,
    panY: centerY - viewH / 2 / zoom,
  };
};

/** World-space rectangle currently visible; used for renderer culling. */
export const visibleWorldBounds = (
  vp: Viewport,
  viewW: number,
  viewH: number,
): Bounds => {
  const topLeft = screenToWorld(vp, { x: 0, y: 0 });
  const bottomRight = screenToWorld(vp, { x: viewW, y: viewH });
  return {
    minX: topLeft.x,
    minY: topLeft.y,
    maxX: bottomRight.x,
    maxY: bottomRight.y,
  };
};

/**
 * Recompute pan so the world point at the old canvas center stays centered
 * after a resize / DPI change, leaving zoom untouched. Because only the
 * transform changes, drawings never distort: resize changes how much of the
 * world is visible, not its proportions.
 */
export const recenterAfterResize = (
  vp: Viewport,
  oldW: number,
  oldH: number,
  newW: number,
  newH: number,
): Viewport => {
  const center = screenToWorld(vp, { x: oldW / 2, y: oldH / 2 });
  return {
    zoom: vp.zoom,
    panX: center.x - newW / 2 / vp.zoom,
    panY: center.y - newH / 2 / vp.zoom,
  };
};
