/**
 * Module to manage pending promise for audio session activation.
 * Used to wait for iOS CallKit's didActivateAudioSession event after starting a call.
 */

let pendingResolve: (() => void) | null = null;
let pendingTimeout: ReturnType<typeof setTimeout> | null = null;

const AUDIO_SESSION_TIMEOUT_MS = 5000;

/**
 * Creates a promise that resolves when the audio session is activated,
 * or after a timeout to prevent hanging indefinitely.
 * @returns Promise that resolves when audio session is activated or timeout occurs
 */
export function waitForAudioSessionActivation(): Promise<void> {
  return new Promise((resolve) => {
    pendingResolve = resolve;
    pendingTimeout = setTimeout(() => {
      // Resolve on timeout to prevent hanging
      resolvePendingAudioSession();
    }, AUDIO_SESSION_TIMEOUT_MS);
  });
}

/**
 * Resolves the pending audio session activation promise.
 * Called when the didActivateAudioSession event fires or on timeout.
 */
export function resolvePendingAudioSession(): void {
  if (pendingTimeout) {
    clearTimeout(pendingTimeout);
    pendingTimeout = null;
  }
  if (pendingResolve) {
    pendingResolve();
    pendingResolve = null;
  }
}
