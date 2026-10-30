/**
 * @vitest-environment happy-dom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createPageVisibilitySource,
  tracePageLifecycle,
} from '../pageLifecycle';
import { Tracer } from '../../stats';

const setVisibility = (state: DocumentVisibilityState, dispatch = true) => {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
  if (dispatch) document.dispatchEvent(new Event('visibilitychange'));
};

const records = (tracer: Tracer) =>
  tracer.take().snapshot.map(([tag, , data]) => [tag, data]);

describe('tracePageLifecycle', () => {
  let tracer: Tracer;
  let stop: (() => void) | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    tracer = new Tracer(null);
    setVisibility('visible', false);
  });

  afterEach(() => {
    stop?.();
    stop = undefined;
    vi.useRealTimers();
    // @ts-expect-error restore the prototype getter
    delete document.visibilityState;
  });

  const start = (onHidden = vi.fn()) => {
    stop = tracePageLifecycle({ tracer, onHidden });
    return onHidden;
  };

  it('traces the initial visibility state without a timer', () => {
    start();
    expect(records(tracer)).toEqual([
      ['page.visibility', { state: 'visible' }],
    ]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('flags a page the browser discarded and reloaded', () => {
    Object.defineProperty(document, 'wasDiscarded', {
      configurable: true,
      value: true,
    });
    try {
      start();
      expect(records(tracer)).toEqual([
        ['page.visibility', { state: 'visible', wasDiscarded: true }],
      ]);
    } finally {
      // @ts-expect-error remove the test double
      delete document.wasDiscarded;
    }
  });

  it('traces hiding before invoking onHidden', () => {
    const onHidden = vi.fn(() => {
      expect(records(tracer)).toEqual([
        ['page.visibility', { state: 'hidden' }],
      ]);
    });
    start(onHidden);
    tracer.take();

    setVisibility('hidden');
    expect(onHidden).toHaveBeenCalledTimes(1);
  });

  it('reports the whole hidden span as a timer gap when timers were suspended', () => {
    start();
    setVisibility('hidden');
    // timers don't fire: the clock moves without running them
    vi.setSystemTime(Date.now() + 30_000);
    tracer.take();

    setVisibility('visible');
    expect(records(tracer)).toEqual([
      [
        'page.visibility',
        { state: 'visible', hiddenMs: 30_000, maxTimerGapMs: 30_000 },
      ],
    ]);
  });

  it('reports the hidden span once, ignoring a repeated hidden event', () => {
    const onHidden = start();
    setVisibility('hidden');
    vi.advanceTimersByTime(5000);
    setVisibility('hidden');
    vi.advanceTimersByTime(5000);
    expect(onHidden).toHaveBeenCalledTimes(1);
    tracer.take();

    setVisibility('visible');
    expect(records(tracer)).toEqual([
      [
        'page.visibility',
        { state: 'visible', hiddenMs: 10_000, maxTimerGapMs: 5000 },
      ],
    ]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('flags hiddenMs as partial when started while hidden', () => {
    setVisibility('hidden', false);
    start();
    vi.advanceTimersByTime(10_000);
    tracer.take();

    setVisibility('visible');
    setVisibility('hidden');
    vi.advanceTimersByTime(5000);
    setVisibility('visible');
    expect(records(tracer)).toEqual([
      [
        'page.visibility',
        {
          state: 'visible',
          hiddenMs: 10_000,
          maxTimerGapMs: 5000,
          hiddenBeforeStart: true,
        },
      ],
      ['page.visibility', { state: 'hidden' }],
      [
        'page.visibility',
        { state: 'visible', hiddenMs: 5000, maxTimerGapMs: 5000 },
      ],
    ]);
  });

  it('traces freeze/resume', () => {
    start();
    tracer.take();

    document.dispatchEvent(new Event('freeze'));
    document.dispatchEvent(new Event('resume'));
    expect(records(tracer)).toEqual([
      ['page.freeze', null],
      ['page.resume', null],
    ]);
  });

  it('is a no-op in React Native', () => {
    Object.defineProperty(navigator, 'product', {
      configurable: true,
      value: 'ReactNative',
    });
    try {
      const onHidden = start();
      setVisibility('hidden');
      expect(records(tracer)).toEqual([]);
      expect(onHidden).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      // @ts-expect-error restore the prototype getter
      delete navigator.product;
    }
  });

  it('stops tracing and clears the gap timer', () => {
    const onHidden = start();
    setVisibility('hidden');
    tracer.take();
    stop?.();
    stop = undefined;

    expect(vi.getTimerCount()).toBe(0);
    setVisibility('visible');
    setVisibility('hidden');
    document.dispatchEvent(new Event('freeze'));
    expect(records(tracer)).toEqual([]);
    expect(onHidden).toHaveBeenCalledTimes(1);
  });
});

describe('createPageVisibilitySource', () => {
  let stop: (() => void) | undefined;
  let boundVideo: HTMLVideoElement;

  const setPiPElement = (element: Element | null) =>
    Object.defineProperty(document, 'pictureInPictureElement', {
      configurable: true,
      get: () => element,
    });

  const findBoundVideo = (element: Element) =>
    element === boundVideo
      ? { sessionId: 'remote', trackType: 'videoTrack' as const }
      : undefined;

  beforeEach(() => {
    setVisibility('visible', false);
    setPiPElement(null);
    boundVideo = document.createElement('video');
    document.body.appendChild(boundVideo);
  });

  afterEach(() => {
    stop?.();
    stop = undefined;
    boundVideo.remove();
    // @ts-expect-error restore the prototype getter
    delete document.visibilityState;
    // @ts-expect-error remove the test double
    delete document.pictureInPictureElement;
    // @ts-expect-error remove the test double
    delete window.documentPictureInPicture;
  });

  const start = () => {
    const source = createPageVisibilitySource(findBoundVideo);
    const onChange = vi.fn();
    stop = source.watch(onChange);
    return { source, onChange };
  };

  const installDocumentPiP = () => {
    const documentPictureInPicture = Object.assign(new EventTarget(), {
      window: null as Window | null,
    });
    Object.defineProperty(window, 'documentPictureInPicture', {
      configurable: true,
      value: documentPictureInPicture,
    });
    return documentPictureInPicture;
  };

  it('reports visibility changes', () => {
    const { source, onChange } = start();
    expect(source.getVisibility()).toEqual({ hidden: false });

    setVisibility('hidden');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(source.getVisibility()).toEqual({ hidden: true });
  });

  it('reports the participant video shown in picture-in-picture', () => {
    const { source, onChange } = start();
    setVisibility('hidden');

    setPiPElement(boundVideo);
    boundVideo.dispatchEvent(new Event('enterpictureinpicture'));
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(source.getVisibility()).toEqual({
      hidden: true,
      shownTrack: { sessionId: 'remote', trackType: 'videoTrack' },
    });

    setPiPElement(null);
    boundVideo.dispatchEvent(new Event('leavepictureinpicture'));
    expect(onChange).toHaveBeenCalledTimes(3);
    expect(source.getVisibility()).toEqual({ hidden: true });
  });

  it('treats a page with an unknown video in picture-in-picture as visible', () => {
    const { source } = start();
    setVisibility('hidden');
    setPiPElement(document.createElement('div'));

    expect(source.getVisibility()).toEqual({ hidden: false });
  });

  it('treats a hidden page with a Document Picture-in-Picture window as visible', () => {
    const documentPictureInPicture = installDocumentPiP();
    const { source, onChange } = start();
    setVisibility('hidden');

    const pipWindow = new EventTarget() as Window;
    documentPictureInPicture.window = pipWindow;
    documentPictureInPicture.dispatchEvent(
      Object.assign(new Event('enter'), { window: pipWindow }),
    );
    expect(source.getVisibility()).toEqual({ hidden: false });

    pipWindow.dispatchEvent(new Event('pagehide'));
    expect(onChange).toHaveBeenCalledTimes(3);
    expect(source.getVisibility()).toEqual({ hidden: true });
  });

  it('picks up a Document Picture-in-Picture window opened before it was created', () => {
    const documentPictureInPicture = installDocumentPiP();
    const pipWindow = new EventTarget() as Window;
    documentPictureInPicture.window = pipWindow;
    const { source } = start();
    setVisibility('hidden');
    expect(source.getVisibility()).toEqual({ hidden: false });

    pipWindow.dispatchEvent(new Event('pagehide'));
    expect(source.getVisibility()).toEqual({ hidden: true });
  });

  it('is never hidden in Firefox', () => {
    const userAgent = vi
      .spyOn(navigator, 'userAgent', 'get')
      .mockReturnValue('Mozilla/5.0 Gecko/20100101 Firefox/133.0');
    try {
      const { source, onChange } = start();
      setVisibility('hidden');
      expect(source.getVisibility()).toEqual({ hidden: false });
      expect(onChange).not.toHaveBeenCalled();
    } finally {
      userAgent.mockRestore();
    }
  });

  it('is never hidden in React Native', () => {
    Object.defineProperty(navigator, 'product', {
      configurable: true,
      value: 'ReactNative',
    });
    try {
      const { source, onChange } = start();
      setVisibility('hidden');
      expect(source.getVisibility()).toEqual({ hidden: false });
      expect(onChange).not.toHaveBeenCalled();
    } finally {
      // @ts-expect-error restore the prototype getter
      delete navigator.product;
    }
  });

  it('stops watching', () => {
    const { onChange } = start();
    stop?.();
    stop = undefined;
    setVisibility('hidden');
    boundVideo.dispatchEvent(new Event('enterpictureinpicture'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
