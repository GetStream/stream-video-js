import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createFirstVideoFrameDetector } from '../firstVideoFrame';

const createVideoElement = () => {
  const listeners = new Map<string, EventListener>();

  return {
    readyState: 0,
    HAVE_CURRENT_DATA: 2,
    addEventListener: vi.fn((type: string, listener: EventListener) => {
      listeners.set(type, listener);
    }),
    removeEventListener: vi.fn((type: string, listener: EventListener) => {
      if (listeners.get(type) === listener) {
        listeners.delete(type);
      }
    }),
    dispatchEvent: vi.fn((event: Event) => {
      listeners.get(event.type)?.(event);
      return true;
    }),
  } as unknown as HTMLVideoElement;
};

describe('createFirstVideoFrameDetector', () => {
  let videoElement: HTMLVideoElement;

  beforeEach(() => {
    videoElement = createVideoElement();
  });

  it('invokes the callback once on loadeddata when video frame callbacks are unavailable', () => {
    const onFirstFrame = vi.fn();
    const stop = createFirstVideoFrameDetector(videoElement, onFirstFrame);

    videoElement.dispatchEvent(new Event('loadeddata'));
    videoElement.dispatchEvent(new Event('loadeddata'));

    expect(onFirstFrame).toHaveBeenCalledOnce();
    stop();
  });

  it('cancels the loadeddata fallback', () => {
    const onFirstFrame = vi.fn();
    const stop = createFirstVideoFrameDetector(videoElement, onFirstFrame);

    stop();
    videoElement.dispatchEvent(new Event('loadeddata'));

    expect(onFirstFrame).not.toHaveBeenCalled();
  });

  it('invokes the callback when frame data is already available', async () => {
    const onFirstFrame = vi.fn();
    Object.defineProperty(videoElement, 'requestVideoFrameCallback', {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(videoElement, 'HAVE_CURRENT_DATA', {
      configurable: true,
      value: 2,
    });
    Object.defineProperty(videoElement, 'readyState', {
      configurable: true,
      value: 2,
    });

    createFirstVideoFrameDetector(videoElement, onFirstFrame);
    await Promise.resolve();

    expect(onFirstFrame).toHaveBeenCalledOnce();
  });

  it('uses requestVideoFrameCallback when available', () => {
    const onFirstFrame = vi.fn();
    let frameCallback: VideoFrameRequestCallback | undefined;
    videoElement.requestVideoFrameCallback = vi.fn((callback) => {
      frameCallback = callback;
      return 1;
    });
    videoElement.cancelVideoFrameCallback = vi.fn();

    const stop = createFirstVideoFrameDetector(videoElement, onFirstFrame);
    frameCallback?.(0, {} as VideoFrameCallbackMetadata);

    expect(onFirstFrame).toHaveBeenCalledOnce();

    stop();
    expect(videoElement.cancelVideoFrameCallback).toHaveBeenCalledWith(1);
  });
});
