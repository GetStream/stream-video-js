/**
 * The drawing surface. Renders the document imperatively (Renderer + rAF) and
 * routes Pointer Events (mouse, touch, stylus) through the ToolController. Zoom
 * and pan are local to this client and never sync. A ResizeObserver keeps the
 * backing store at devicePixelRatio and re-centers the visible world on resize.
 */
import { type MutableRefObject, useEffect, useRef, useState } from 'react';

import {
  documentBounds,
  hitTestElement,
  type Point,
  type Tool,
} from './core/model';
import { Renderer } from './core/renderer';
import { ToolController } from './core/tools';
import {
  centerOnBounds,
  createViewport,
  fitToBounds,
  panBy,
  recenterAfterResize,
  screenToWorld,
  type Viewport,
  worldToScreen,
  zoomAt,
} from './core/viewport';
import type { WhiteboardApi } from './useWhiteboard';

const ZOOM_BUTTON_FACTOR = 1.25;
const WHEEL_ZOOM_SENSITIVITY = 0.002;
// Eraser hit radius in CSS pixels; converted to world units via the zoom.
const ERASER_RADIUS = 12;

export interface WhiteboardCanvasHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  fit: () => void;
}

interface WhiteboardCanvasProps {
  wb: WhiteboardApi;
  handleRef: MutableRefObject<WhiteboardCanvasHandle | null>;
  onZoomChange?: (zoom: number) => void;
}

interface TextOverlay {
  screenX: number;
  screenY: number;
  world: Point;
}

// Space is the pan modifier, but it must keep working as a space character in
// the text overlay and as the activator on focused buttons, so we ignore it
// when an interactive element has focus.
const isInteractiveTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'BUTTON' ||
    target.isContentEditable
  );
};

const isSpaceKey = (event: KeyboardEvent): boolean =>
  event.code === 'Space' || event.key === ' ';

const cursorForTool = (tool: Tool): string =>
  tool === 'pan' ? 'grab' : tool === 'eraser' ? 'cell' : 'crosshair';

export const WhiteboardCanvas = (props: WhiteboardCanvasProps) => {
  const { wb, handleRef, onZoomChange } = props;
  const { store, sync, sequencer, getStyle, activeTool } = wb;

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<Viewport>(createViewport());
  const rendererRef = useRef<Renderer | null>(null);
  const controllerRef = useRef<ToolController | null>(null);
  const spaceHeldRef = useRef(false);
  const interactedRef = useRef(false);
  const autoFittedRef = useRef(false);
  const lastSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  const [textOverlay, setTextOverlay] = useState<TextOverlay | null>(null);
  const textOverlayRef = useRef<TextOverlay | null>(null);
  textOverlayRef.current = textOverlay;
  const textValueRef = useRef('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus the text overlay on the next frame, after the click that opened it
  // has fully settled. Focusing during mount (autoFocus) races the click's
  // mousedown focus fix, which moves focus to <body> (the canvas is not
  // focusable) and blurs the box away before it ever paints.
  useEffect(() => {
    if (!textOverlay) return;
    const frame = requestAnimationFrame(() => textareaRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [textOverlay]);

  // Capture render-changing values in refs so the setup effect rebuilds the
  // renderer/controller only when the call-scoped instances change.
  const onZoomChangeRef = useRef(onZoomChange);
  onZoomChangeRef.current = onZoomChange;
  const activeToolRef = useRef(activeTool);
  activeToolRef.current = activeTool;

  // keep the controller's active tool in sync with the toolbar
  useEffect(() => {
    controllerRef.current?.setTool(activeTool);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = cursorForTool(activeTool);
    }
  }, [activeTool]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !store || !sync || !sequencer) return;

    const reportZoom = () =>
      onZoomChangeRef.current?.(viewportRef.current.zoom);

    const renderer = new Renderer(
      canvas,
      store.getDocument,
      () => viewportRef.current,
      sync.getActiveDrawers,
    );
    rendererRef.current = renderer;

    // Open / late-join start position: always 100% zoom, panned so existing
    // content is centered (or world origin when the board is empty).
    const startViewport = (force: boolean) => {
      const bounds = documentBounds(store.getDocument());
      if (bounds) {
        viewportRef.current = centerOnBounds(
          bounds,
          canvas.clientWidth,
          canvas.clientHeight,
        );
        autoFittedRef.current = true;
      } else if (force) {
        viewportRef.current = createViewport();
      }
      renderer.requestPaint();
      reportZoom();
    };

    // Fit-to-content (variable zoom) for the toolbar Fit button only.
    const fitToContent = () => {
      const bounds = documentBounds(store.getDocument());
      viewportRef.current = bounds
        ? fitToBounds(bounds, canvas.clientWidth, canvas.clientHeight)
        : createViewport();
      interactedRef.current = true;
      renderer.requestPaint();
      reportZoom();
    };

    const controller = new ToolController({
      sequencer,
      getEpoch: store.getEpoch,
      getStyle,
      emit: sync.applyLocalOp,
      onTextRequested: (at) => {
        const screen = worldToScreen(viewportRef.current, at);
        setTextOverlay({ screenX: screen.x, screenY: screen.y, world: at });
        textValueRef.current = '';
      },
      findElementsAt: (at) => {
        const tolerance = ERASER_RADIUS / viewportRef.current.zoom;
        const { elements } = store.getDocument();
        const ids: string[] = [];
        for (const id in elements) {
          if (hitTestElement(elements[id], at, tolerance)) ids.push(id);
        }
        return ids;
      },
    });
    controller.setTool(activeToolRef.current);
    controllerRef.current = controller;

    lastSizeRef.current = { w: canvas.clientWidth, h: canvas.clientHeight };
    renderer.resize();
    // land late joiners / re-openers on existing content, at 100%
    startViewport(true);

    const unsubscribe = store.subscribe(() => {
      if (
        !interactedRef.current &&
        !autoFittedRef.current &&
        !store.isEmpty()
      ) {
        startViewport(false);
      } else {
        renderer.requestPaint();
      }
    });

    const unsubscribePresence = sync.subscribePresence(renderer.requestPaint);

    const resizeObserver = new ResizeObserver(() => {
      const { w: prevW, h: prevH } = lastSizeRef.current;
      const nextW = canvas.clientWidth;
      const nextH = canvas.clientHeight;
      if (prevW > 0 && prevH > 0 && (prevW !== nextW || prevH !== nextH)) {
        viewportRef.current = recenterAfterResize(
          viewportRef.current,
          prevW,
          prevH,
          nextW,
          nextH,
        );
      }
      lastSizeRef.current = { w: nextW, h: nextH };
      renderer.resize();
    });
    resizeObserver.observe(container);

    const toWorld = (event: PointerEvent): Point => {
      const rect = canvas.getBoundingClientRect();
      return screenToWorld(viewportRef.current, {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    };

    let pan: { x: number; y: number } | null = null;

    const toolCursor = () => cursorForTool(activeToolRef.current);

    const onPointerDown = (event: PointerEvent) => {
      if (textOverlayRef.current) return;
      const wantsPan =
        event.button === 1 ||
        spaceHeldRef.current ||
        activeToolRef.current === 'pan';
      if (wantsPan) {
        pan = { x: event.clientX, y: event.clientY };
        canvas.setPointerCapture(event.pointerId);
        canvas.style.cursor = 'grabbing';
        return;
      }
      if (event.button !== 0) return;
      interactedRef.current = true;
      canvas.setPointerCapture(event.pointerId);
      controller.onPointerDown(toWorld(event));
    };

    const onPointerMove = (event: PointerEvent) => {
      if (pan) {
        const dx = event.clientX - pan.x;
        const dy = event.clientY - pan.y;
        pan = { x: event.clientX, y: event.clientY };
        viewportRef.current = panBy(viewportRef.current, -dx, -dy);
        renderer.requestPaint();
        return;
      }
      if (controller.isDrawing()) controller.onPointerMove(toWorld(event));
    };

    const onPointerUp = (event: PointerEvent) => {
      if (pan) {
        pan = null;
        canvas.releasePointerCapture(event.pointerId);
        canvas.style.cursor = spaceHeldRef.current ? 'grab' : toolCursor();
        return;
      }
      if (controller.isDrawing()) {
        controller.onPointerUp(toWorld(event));
        canvas.releasePointerCapture(event.pointerId);
      }
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      interactedRef.current = true;
      if (event.ctrlKey || event.metaKey) {
        const rect = canvas.getBoundingClientRect();
        const anchor = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        };
        const factor = Math.exp(-event.deltaY * WHEEL_ZOOM_SENSITIVITY);
        viewportRef.current = zoomAt(viewportRef.current, anchor, factor);
        reportZoom();
      } else {
        viewportRef.current = panBy(
          viewportRef.current,
          event.deltaX,
          event.deltaY,
        );
      }
      renderer.requestPaint();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isSpaceKey(event) || isInteractiveTarget(event.target)) return;
      event.preventDefault(); // hold-space pans; do not scroll the page
      if (!spaceHeldRef.current) {
        spaceHeldRef.current = true;
        if (!pan) canvas.style.cursor = 'grab';
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (!isSpaceKey(event) || !spaceHeldRef.current) return;
      spaceHeldRef.current = false;
      if (!pan) canvas.style.cursor = toolCursor();
    };

    // Releasing focus (e.g. alt-tab) can swallow the keyup; reset so the pan
    // modifier does not stay stuck on.
    const onBlur = () => {
      if (!spaceHeldRef.current) return;
      spaceHeldRef.current = false;
      if (!pan) canvas.style.cursor = toolCursor();
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    const zoomAtCenter = (factor: number) => {
      const center = {
        x: canvas.clientWidth / 2,
        y: canvas.clientHeight / 2,
      };
      interactedRef.current = true;
      viewportRef.current = zoomAt(viewportRef.current, center, factor);
      renderer.requestPaint();
      reportZoom();
    };

    handleRef.current = {
      zoomIn: () => zoomAtCenter(ZOOM_BUTTON_FACTOR),
      zoomOut: () => zoomAtCenter(1 / ZOOM_BUTTON_FACTOR),
      reset: () => {
        interactedRef.current = true;
        viewportRef.current = createViewport();
        renderer.requestPaint();
        reportZoom();
      },
      fit: fitToContent,
    };

    return () => {
      unsubscribe();
      unsubscribePresence();
      resizeObserver.disconnect();
      renderer.dispose();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      rendererRef.current = null;
      controllerRef.current = null;
      handleRef.current = null;
    };
  }, [store, sync, sequencer, getStyle, handleRef]);

  const commitText = () => {
    const overlay = textOverlayRef.current;
    if (overlay)
      controllerRef.current?.commitText(overlay.world, textValueRef.current);
    setTextOverlay(null);
    textValueRef.current = '';
  };

  const cancelText = () => {
    setTextOverlay(null);
    textValueRef.current = '';
  };

  return (
    <div ref={containerRef} className="rd__whiteboard__canvas-wrapper">
      <canvas
        ref={canvasRef}
        className="rd__whiteboard__canvas"
        aria-label="Collaborative whiteboard drawing surface"
        role="img"
      />
      {textOverlay && (
        <textarea
          ref={textareaRef}
          className="rd__whiteboard__text-input"
          defaultValue=""
          style={{ left: textOverlay.screenX, top: textOverlay.screenY }}
          onChange={(e) => {
            textValueRef.current = e.target.value;
          }}
          onBlur={commitText}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              commitText();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              cancelText();
            }
          }}
        />
      )}
    </div>
  );
};
