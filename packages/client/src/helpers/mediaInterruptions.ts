/**
 * Checks whether media playback and capture are likely interrupted: the page
 * is hidden, or WebKit reports the audio session as interrupted (a phone
 * call, Siri, or another app taking over audio).
 */
export const isMediaInterrupted = (): boolean => {
  if (typeof document === 'undefined') return false;
  return (
    document.visibilityState === 'hidden' ||
    navigator.audioSession?.state === 'interrupted'
  );
};

/**
 * Invokes `onResumed` every time the page leaves a media interruption,
 * as defined by {@link isMediaInterrupted}.
 *
 * @param onResumed the callback to invoke.
 * @returns a function that stops watching.
 */
export const watchMediaInterruptions = (
  onResumed: () => void,
): (() => void) => {
  if (typeof document === 'undefined') return () => {};
  let interrupted = isMediaInterrupted();
  const check = () => {
    const wasInterrupted = interrupted;
    interrupted = isMediaInterrupted();
    if (wasInterrupted && !interrupted) onResumed();
  };

  const controller = new AbortController();
  const { signal } = controller;
  document.addEventListener('visibilitychange', check, { signal });
  navigator.audioSession?.addEventListener('statechange', check, { signal });
  return () => controller.abort();
};
