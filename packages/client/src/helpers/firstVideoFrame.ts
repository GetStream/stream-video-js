/**
 * Invokes `onFirstFrame` once when the video element renders a frame.
 *
 * Uses `requestVideoFrameCallback` when available, falling back to `loadeddata`
 * for browsers that don't support it.
 */
export const createFirstVideoFrameDetector = (
  videoElement: HTMLVideoElement,
  onFirstFrame: () => void,
) => {
  let done = false;
  const notify = () => {
    if (done) return;
    done = true;
    onFirstFrame();
  };

  if (typeof videoElement.requestVideoFrameCallback === 'function') {
    const handle = videoElement.requestVideoFrameCallback(notify);
    return () => {
      done = true;
      videoElement.cancelVideoFrameCallback(handle);
    };
  }

  if (videoElement.readyState >= videoElement.HAVE_CURRENT_DATA) {
    queueMicrotask(notify);
    return () => {
      done = true;
    };
  }

  videoElement.addEventListener('loadeddata', notify, { once: true });
  return () => {
    done = true;
    videoElement.removeEventListener('loadeddata', notify);
  };
};
