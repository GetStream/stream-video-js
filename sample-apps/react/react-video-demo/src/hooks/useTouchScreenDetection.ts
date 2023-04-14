import { useMemo } from 'react';

export function useTouchScreenDetection() {
  return useMemo(() => {
    switch (true) {
      case Boolean(window.PointerEvent) && 'maxTouchPoints' in navigator:
        return navigator.maxTouchPoints > 0;

      case Boolean(window.matchMedia):
        return window.matchMedia('(any-pointer:coarse)').matches;

      default:
        return Boolean(window.TouchEvent) || 'ontouchstart' in window;
    }
  }, []);
}
