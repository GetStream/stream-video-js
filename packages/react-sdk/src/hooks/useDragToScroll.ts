import { useEffect, useRef } from 'react';

interface DragScrollState {
  isDragging: boolean;
  isPointerActive: boolean;
  prevX: number;
  prevY: number;
  velocityX: number;
  velocityY: number;
  rafId: number;
  startX: number;
  startY: number;
}

interface DragToScrollOptions {
  decay?: number;
  minVelocity?: number;
  dragThreshold?: number;
  enabled?: boolean;
}

/**
 * Enables drag-to-scroll functionality with momentum scrolling on a scrollable element.
 *
 * This hook allows users to click and drag to scroll an element, with momentum scrolling
 * that continues after the drag ends. The drag only activates after moving beyond a threshold
 *  distance, which prevents accidental drags from clicks.
 *
 * @param element - The HTML element to enable drag to scroll on.
 * @param options - Options for customizing the drag-to-scroll behavior.
 */
export function useDragToScroll(
  element: HTMLElement | null,
  options: DragToScrollOptions = {},
) {
  const stateRef = useRef<DragScrollState>({
    isDragging: false,
    isPointerActive: false,
    prevX: 0,
    prevY: 0,
    velocityX: 0,
    velocityY: 0,
    rafId: 0,
    startX: 0,
    startY: 0,
  });

  useEffect(() => {
    if (!element || !options.enabled) return;

    const { decay = 0.95, minVelocity = 0.5, dragThreshold = 5 } = options;

    const state = stateRef.current;

    const stopMomentum = () => {
      if (state.rafId) {
        cancelAnimationFrame(state.rafId);
        state.rafId = 0;
      }
      state.velocityX = 0;
      state.velocityY = 0;
    };

    const momentumStep = () => {
      state.velocityX *= decay;
      state.velocityY *= decay;

      element.scrollLeft -= state.velocityX;
      element.scrollTop -= state.velocityY;

      if (
        Math.abs(state.velocityX) < minVelocity &&
        Math.abs(state.velocityY) < minVelocity
      ) {
        state.rafId = 0;
        return;
      }

      state.rafId = requestAnimationFrame(momentumStep);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;

      stopMomentum();

      state.isDragging = false;
      state.isPointerActive = true;

      state.prevX = e.clientX;
      state.prevY = e.clientY;
      state.startX = e.clientX;
      state.startY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;

      if (!state.isPointerActive) return;

      const dx = e.clientX - state.startX;
      const dy = e.clientY - state.startY;

      if (!state.isDragging && Math.hypot(dx, dy) > dragThreshold) {
        state.isDragging = true;
        e.preventDefault();
      }

      if (!state.isDragging) return;

      const moveDx = e.clientX - state.prevX;
      const moveDy = e.clientY - state.prevY;

      element.scrollLeft -= moveDx;
      element.scrollTop -= moveDy;

      state.velocityX = moveDx;
      state.velocityY = moveDy;

      state.prevX = e.clientX;
      state.prevY = e.clientY;
    };

    const onPointerUpOrCancel = () => {
      const wasDragging = state.isDragging;

      state.isDragging = false;
      state.isPointerActive = false;

      state.prevX = 0;
      state.prevY = 0;
      state.startX = 0;
      state.startY = 0;

      if (!wasDragging) {
        stopMomentum();
        return;
      }

      if (Math.hypot(state.velocityX, state.velocityY) < minVelocity) {
        stopMomentum();
        return;
      }

      state.rafId = requestAnimationFrame(momentumStep);
    };

    element.addEventListener('pointerdown', onPointerDown);
    element.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUpOrCancel);
    window.addEventListener('pointercancel', onPointerUpOrCancel);

    return () => {
      element.removeEventListener('pointerdown', onPointerDown);
      element.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUpOrCancel);
      window.removeEventListener('pointercancel', onPointerUpOrCancel);

      stopMomentum();
    };
  }, [element, options]);
}
