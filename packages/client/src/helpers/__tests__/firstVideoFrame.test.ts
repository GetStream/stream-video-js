import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createFirstVideoFrameDetector } from '../firstVideoFrame';

describe('createFirstVideoFrameDetector', () => {
  let videoElement: HTMLVideoElement;

  beforeEach(() => {
    videoElement = document.createElement('video');
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
