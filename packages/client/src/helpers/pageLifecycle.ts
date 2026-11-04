import type { Tracer } from '../stats';
import type { AppVisibility, AppVisibilitySource } from '../types';
import { isFirefox } from './browsers';
import { isReactNative } from './platforms';

export type PageLifecycleTracingOptions = {
  tracer: Tracer;
  /**
   * Invoked every time the page becomes hidden, after the change is traced.
   */
  onHidden?: () => void;
};

/**
 * Traces the page lifecycle: visibility changes (on return, with how long
 * the page was hidden and the longest timer gap while hidden) and
 * `freeze`/`resume` (Chromium only). A no-op outside the browser
 * (React Native, Node.js).
 *
 * The longest timer gap tells a hidden page that kept running apart from
 * one whose JavaScript was suspended, as iOS does with background tabs.
 *
 * @returns a function that stops tracing.
 */
export const tracePageLifecycle = ({
  tracer,
  onHidden,
}: PageLifecycleTracingOptions): (() => void) => {
  if (typeof document === 'undefined' || isReactNative()) return () => {};

  let hiddenAt: number | undefined;
  // when tracing starts on a hidden page, `hiddenMs` covers only the part
  // since the start, so the `visible` record is flagged as a lower bound
  let hiddenBeforeStart = false;
  let lastTickAt = 0;
  let maxTimerGapMs = 0;
  let timerId: ReturnType<typeof setInterval> | undefined;

  const tick = () => {
    const now = Date.now();
    maxTimerGapMs = Math.max(maxTimerGapMs, now - lastTickAt);
    lastTickAt = now;
  };

  const startHiddenTimer = () => {
    hiddenAt = lastTickAt = Date.now();
    maxTimerGapMs = 0;
    clearInterval(timerId);
    timerId = setInterval(tick, 5000);
  };

  const stopHiddenTimer = () => {
    clearInterval(timerId);
    timerId = undefined;
  };

  const onVisibilityChange = () => {
    const state = document.visibilityState;
    if (state === 'hidden') {
      if (hiddenAt !== undefined) return;
      startHiddenTimer();
      tracer.trace('page.visibility', { state });
      onHidden?.();
    } else if (hiddenAt !== undefined) {
      tick();
      stopHiddenTimer();
      tracer.trace('page.visibility', {
        state,
        hiddenMs: Date.now() - hiddenAt,
        maxTimerGapMs,
        ...(hiddenBeforeStart && { hiddenBeforeStart }),
      });
      hiddenAt = undefined;
      hiddenBeforeStart = false;
    }
  };

  const onFreeze = () => tracer.trace('page.freeze', null);
  const onResume = () => tracer.trace('page.resume', null);

  const state = document.visibilityState;
  tracer.trace('page.visibility', {
    state,
    ...(document.wasDiscarded && { wasDiscarded: true }),
  });
  if (state === 'hidden') {
    hiddenBeforeStart = true;
    startHiddenTimer();
  }

  const controller = new AbortController();
  const { signal } = controller;
  document.addEventListener('visibilitychange', onVisibilityChange, { signal });
  document.addEventListener('freeze', onFreeze, { signal });
  document.addEventListener('resume', onResume, { signal });
  return () => {
    controller.abort();
    stopHiddenTimer();
  };
};

type DocumentPictureInPicture = EventTarget & { window: Window | null };

type ShownTrack = Extract<AppVisibility, { hidden: true }>['shownTrack'];

const noVisibility: AppVisibilitySource = {
  getVisibility: () => ({ hidden: false }),
  watch: () => () => {},
};

/**
 * Creates the {@link AppVisibilitySource} of a web page. The page counts as
 * visible while a Document Picture-in-Picture window is open, and while a
 * video element that isn't a bound participant video is in
 * picture-in-picture. Never hidden outside the browser (React Native,
 * Node.js) and in Firefox, whose built-in picture-in-picture can't be
 * detected.
 *
 * @param findBoundVideo resolves a video element to the participant track
 * it renders, if any.
 */
export const createPageVisibilitySource = (
  findBoundVideo: (element: Element) => ShownTrack,
): AppVisibilitySource => {
  if (typeof document === 'undefined' || isReactNative() || isFirefox()) {
    return noVisibility;
  }

  const documentPiP = (
    window as Window & { documentPictureInPicture?: DocumentPictureInPicture }
  ).documentPictureInPicture;
  let documentPiPWindow = documentPiP?.window ?? undefined;

  const getVisibility = (): AppVisibility => {
    if (document.visibilityState !== 'hidden' || documentPiPWindow) {
      return { hidden: false };
    }
    const pipElement = document.pictureInPictureElement;
    if (!pipElement) return { hidden: true };
    const shownTrack = findBoundVideo(pipElement);
    return shownTrack ? { hidden: true, shownTrack } : { hidden: false };
  };

  const watch = (onChange: () => void) => {
    const controller = new AbortController();
    const { signal } = controller;

    const watchDocumentPiPWindow = (pipWindow: Window) => {
      documentPiPWindow = pipWindow;
      pipWindow.addEventListener(
        'pagehide',
        () => {
          documentPiPWindow = undefined;
          onChange();
        },
        { signal },
      );
    };

    if (documentPiPWindow) watchDocumentPiPWindow(documentPiPWindow);
    document.addEventListener('visibilitychange', onChange, { signal });
    // fired at the video element, captured here for any element of the page
    document.addEventListener('enterpictureinpicture', onChange, {
      signal,
      capture: true,
    });
    document.addEventListener('leavepictureinpicture', onChange, {
      signal,
      capture: true,
    });
    documentPiP?.addEventListener(
      'enter',
      (e) => {
        watchDocumentPiPWindow((e as Event & { window: Window }).window);
        onChange();
      },
      { signal },
    );
    return () => controller.abort();
  };

  return { getVisibility, watch };
};
