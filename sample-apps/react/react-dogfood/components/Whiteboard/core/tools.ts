/**
 * Input controller: turns pointer down/move/up (in world coordinates) into
 * ops for the active tool and owns the in-progress element. Pure logic with no
 * React or canvas dependency; the canvas converts screen pointer coordinates to
 * world coordinates before calling in, and wires `emit` to both the local store
 * (optimistic apply) and the outbound sync funnel.
 *
 * Text is click-to-place: the controller asks the host to open a DOM overlay at
 * the click point and the committed `TextElement` is emitted separately via
 * `commitText`, since a canvas cannot capture text natively.
 */
import type {
  LineElement,
  Op,
  PenElement,
  Point,
  RectElement,
  TextElement,
  Tool,
  WhiteboardElement,
} from './model';

/** Mints owner-scoped element ids and monotonic op versions for one session. */
export class Sequencer {
  private sessionId: string;
  private idCounter = 0;
  private versionCounter = 0;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  nextId = (): string => `${this.sessionId}-${this.idCounter++}`;

  nextVersion = (): number => ++this.versionCounter;
}

export interface ToolStyle {
  color: string;
  width: number;
}

export interface ToolHost {
  sequencer: Sequencer;
  /** Current clear epoch from the store, stamped onto every op. */
  getEpoch: () => number;
  /** Active stroke style, captured at pointer-down so mid-stroke changes do not apply. */
  getStyle: () => ToolStyle;
  /** Apply locally (optimistic) and enqueue for sending. */
  emit: (op: Op) => void;
  /** Open the text-entry overlay at a world point (Text tool). */
  onTextRequested: (at: Point) => void;
  /** Ids of elements under a world point, used by the eraser (Eraser tool). */
  findElementsAt: (at: Point) => string[];
}

/** Default text size in world units. */
export const DEFAULT_FONT_SIZE = 20;

/** Pen points closer than this (world units) than the previous one are dropped. */
const MIN_PEN_POINT_DISTANCE = 1.5;

const clonePoint = (p: Point): Point => ({ x: p.x, y: p.y });

export class ToolController {
  private host: ToolHost;
  activeTool: Tool = 'pen';

  private drawing = false;
  private current: WhiteboardElement | null = null;
  private penPoints: Point[] = [];
  private rectAnchor: Point | null = null;
  private erasedThisStroke: Set<string> = new Set();

  constructor(host: ToolHost) {
    this.host = host;
  }

  setTool = (tool: Tool): void => {
    this.cancel();
    this.activeTool = tool;
  };

  /** True while a drag-based stroke/shape is in progress. */
  isDrawing = (): boolean => this.drawing;

  onPointerDown = (at: Point): void => {
    if (this.activeTool === 'pan') return; // canvas handles panning
    if (this.activeTool === 'eraser') {
      this.drawing = true;
      this.erasedThisStroke = new Set();
      this.eraseAt(at);
      return;
    }
    if (this.activeTool === 'text') {
      this.host.onTextRequested(at);
      return;
    }
    const style = this.host.getStyle();
    const id = this.host.sequencer.nextId();
    const version = this.host.sequencer.nextVersion();
    const base = {
      id,
      version,
      strokeColor: style.color,
      strokeWidth: style.width,
    };

    switch (this.activeTool) {
      case 'pen': {
        this.penPoints = [clonePoint(at)];
        const element: PenElement = {
          ...base,
          type: 'pen',
          points: [clonePoint(at)],
        };
        this.current = element;
        break;
      }
      case 'line': {
        const element: LineElement = {
          ...base,
          type: 'line',
          a: clonePoint(at),
          b: clonePoint(at),
        };
        this.current = element;
        break;
      }
      case 'rect': {
        this.rectAnchor = clonePoint(at);
        const element: RectElement = {
          ...base,
          type: 'rect',
          x: at.x,
          y: at.y,
          w: 0,
          h: 0,
        };
        this.current = element;
        break;
      }
    }

    this.drawing = true;
    if (this.current) {
      this.host.emit({
        op: 'upsert',
        epoch: this.host.getEpoch(),
        element: this.current,
      });
    }
  };

  onPointerMove = (at: Point): void => {
    if (this.activeTool === 'eraser') {
      if (this.drawing) this.eraseAt(at);
      return;
    }
    const current = this.current;
    if (!this.drawing || !current) return;

    switch (current.type) {
      case 'pen': {
        const last = this.penPoints[this.penPoints.length - 1];
        const dx = at.x - last.x;
        const dy = at.y - last.y;
        const minSq = MIN_PEN_POINT_DISTANCE * MIN_PEN_POINT_DISTANCE;
        if (dx * dx + dy * dy < minSq) return;
        const point = clonePoint(at);
        this.penPoints.push(point);
        this.host.emit({
          op: 'append',
          epoch: this.host.getEpoch(),
          id: current.id,
          points: [point],
          version: this.host.sequencer.nextVersion(),
        });
        return;
      }
      case 'line': {
        const next: LineElement = {
          ...current,
          b: clonePoint(at),
          version: this.host.sequencer.nextVersion(),
        };
        this.current = next;
        this.host.emit({
          op: 'upsert',
          epoch: this.host.getEpoch(),
          element: next,
        });
        return;
      }
      case 'rect': {
        const anchor = this.rectAnchor!;
        const next: RectElement = {
          ...current,
          x: anchor.x,
          y: anchor.y,
          w: at.x - anchor.x,
          h: at.y - anchor.y,
          version: this.host.sequencer.nextVersion(),
        };
        this.current = next;
        this.host.emit({
          op: 'upsert',
          epoch: this.host.getEpoch(),
          element: next,
        });
        return;
      }
    }
  };

  onPointerUp = (at: Point): void => {
    if (this.activeTool === 'eraser') {
      this.cancel();
      return;
    }
    if (!this.drawing || !this.current) {
      this.cancel();
      return;
    }
    // Fold the final position in, then emit an authoritative full upsert that
    // heals any dropped intermediate ops via last-write-wins.
    this.onPointerMove(at);
    const current = this.current;
    let final: WhiteboardElement;
    if (current.type === 'pen') {
      final = {
        ...current,
        points: this.penPoints.map(clonePoint),
        version: this.host.sequencer.nextVersion(),
      };
    } else {
      final = { ...current, version: this.host.sequencer.nextVersion() };
    }
    this.host.emit({
      op: 'upsert',
      epoch: this.host.getEpoch(),
      element: final,
    });
    this.cancel();
  };

  /** Remove every element under the point that has not yet been erased this stroke. */
  private eraseAt = (at: Point): void => {
    const ids = this.host.findElementsAt(at);
    for (const id of ids) {
      if (this.erasedThisStroke.has(id)) continue;
      this.erasedThisStroke.add(id);
      this.host.emit({
        op: 'remove',
        epoch: this.host.getEpoch(),
        id,
        version: this.host.sequencer.nextVersion(),
      });
    }
  };

  /** Commit a text element from the overlay (blur / Enter). */
  commitText = (at: Point, text: string): void => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const style = this.host.getStyle();
    const element: TextElement = {
      id: this.host.sequencer.nextId(),
      version: this.host.sequencer.nextVersion(),
      strokeColor: style.color,
      strokeWidth: style.width,
      type: 'text',
      x: at.x,
      y: at.y,
      text: trimmed,
      fontSize: DEFAULT_FONT_SIZE,
    };
    this.host.emit({ op: 'upsert', epoch: this.host.getEpoch(), element });
  };

  /** Abandon any in-progress drag without emitting a final op. */
  cancel = (): void => {
    this.drawing = false;
    this.current = null;
    this.penPoints = [];
    this.rectAnchor = null;
    this.erasedThisStroke.clear();
  };
}
