/**
 * Draws a whiteboard document onto a 2D canvas through a viewport transform.
 * Side-effecting but deterministic given (document, viewport, canvas size).
 *
 * Repaints are dirty-driven: a frame is scheduled via requestAnimationFrame
 * only when the store or viewport changes, never as a perpetual loop. Drawing
 * is viewport-culled so only elements whose bounds intersect the visible world
 * are painted, and the backing store is sized to devicePixelRatio for crisp
 * hi-DPI output. The board surface is a fixed light color regardless of the
 * app theme so strokes read well.
 */
import {
  boundsIntersect,
  type Bounds,
  elementBounds,
  elementLeadingPoint,
  type WhiteboardDocument,
  type WhiteboardElement,
} from './model';
import { visibleWorldBounds, type Viewport, worldToScreen } from './viewport';

const SURFACE_COLOR = '#f7f7f4';
const TEXT_FONT_FAMILY =
  "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private getDocument: () => WhiteboardDocument;
  private getViewport: () => Viewport;
  private getLabels?: () => Map<string, string>;
  private frame = 0;
  private dpr = 1;

  constructor(
    canvas: HTMLCanvasElement,
    getDocument: () => WhiteboardDocument,
    getViewport: () => Viewport,
    getLabels?: () => Map<string, string>,
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Whiteboard: 2D canvas context unavailable');
    this.ctx = ctx;
    this.getDocument = getDocument;
    this.getViewport = getViewport;
    this.getLabels = getLabels;
  }

  /**
   * Size the backing store to the element's CSS box times devicePixelRatio,
   * then repaint. Call from a ResizeObserver and on DPI changes.
   */
  resize = (): void => {
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(this.canvas.clientWidth * dpr));
    const height = Math.max(1, Math.round(this.canvas.clientHeight * dpr));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.dpr = dpr;
    this.paint();
  };

  /** Schedule exactly one repaint on the next animation frame. */
  requestPaint = (): void => {
    if (this.frame) return;
    this.frame = requestAnimationFrame(this.onFrame);
  };

  dispose = (): void => {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
  };

  private onFrame = (): void => {
    this.frame = 0;
    this.paint();
  };

  private paint = (): void => {
    const { ctx, dpr } = this;
    const deviceW = this.canvas.width;
    const deviceH = this.canvas.height;
    const cssW = deviceW / dpr;
    const cssH = deviceH / dpr;
    const vp = this.getViewport();
    const doc = this.getDocument();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = SURFACE_COLOR;
    ctx.fillRect(0, 0, deviceW, deviceH);

    // world -> device: device = dpr * zoom * (world - pan)
    const scale = dpr * vp.zoom;
    ctx.setTransform(scale, 0, 0, scale, -vp.panX * scale, -vp.panY * scale);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.textBaseline = 'top';

    const visible = visibleWorldBounds(vp, cssW, cssH);
    const { elements } = doc;
    for (const id in elements) {
      const element = elements[id];
      if (!boundsIntersect(elementBounds(element), visible)) continue;
      this.drawElement(element);
    }

    this.drawLabels(vp, doc, visible, cssW, cssH);
  };

  // Name tags for elements a remote peer is actively drawing. Drawn in CSS
  // pixel space so they stay a constant size, and anchored at each element's
  // leading point so the tag follows the pen tip as the stroke animates in.
  private drawLabels = (
    vp: Viewport,
    doc: WhiteboardDocument,
    visible: Bounds,
    cssW: number,
    cssH: number,
  ): void => {
    if (!this.getLabels) return;
    const labels = this.getLabels();
    if (labels.size === 0) return;

    const { ctx, dpr } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = `600 12px ${TEXT_FONT_FAMILY}`;
    ctx.textBaseline = 'alphabetic';
    const padX = 6;
    const height = 18;
    const offset = 10;

    for (const [id, name] of labels) {
      const element = doc.elements[id];
      if (!element) continue;
      if (!boundsIntersect(elementBounds(element), visible)) continue;
      const tip = worldToScreen(vp, elementLeadingPoint(element));
      const width = ctx.measureText(name).width + padX * 2;
      // float up-and-right of the tip, clamped to stay on screen
      let x = tip.x + offset;
      let top = tip.y - offset - height;
      x = Math.max(2, Math.min(x, cssW - width - 2));
      if (top < 2) top = Math.min(tip.y + offset, cssH - height - 2);
      ctx.fillStyle = 'rgba(40, 40, 40, 0.92)';
      ctx.fillRect(x, top, width, height);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(name, x + padX, top + height - 5);
    }
  };

  private drawElement = (element: WhiteboardElement): void => {
    const { ctx } = this;
    ctx.strokeStyle = element.strokeColor;
    ctx.fillStyle = element.strokeColor;
    ctx.lineWidth = element.strokeWidth;

    switch (element.type) {
      case 'pen': {
        const { points } = element;
        if (points.length === 0) return;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        if (points.length === 1) {
          // a single tap: draw a dot so it is still visible
          ctx.lineTo(points[0].x + 0.01, points[0].y);
        } else {
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }
        }
        ctx.stroke();
        return;
      }
      case 'line': {
        ctx.beginPath();
        ctx.moveTo(element.a.x, element.a.y);
        ctx.lineTo(element.b.x, element.b.y);
        ctx.stroke();
        return;
      }
      case 'rect': {
        ctx.strokeRect(element.x, element.y, element.w, element.h);
        return;
      }
      case 'text': {
        ctx.font = `${element.fontSize}px ${TEXT_FONT_FAMILY}`;
        ctx.fillText(element.text, element.x, element.y);
        return;
      }
    }
  };
}
