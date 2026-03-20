/**
 * Module to manage pending promise for audio session activation.
 * Used to wait for iOS CallKit's didActivateAudioSession event after starting a call.
 */

import { videoLoggerSystem } from '@stream-io/video-client';

const logger = videoLoggerSystem.getLogger('callingx');

let pendingResolve: (() => void) | null = null;
let pendingTimeout: ReturnType<typeof setTimeout> | null = null;
let resolveSetTime: number | null = null;
/**
 * Flag to check if the audio session is already activated.
 * This solves race condition for a cold start case, when the audio session is activated before the promise is created.
 */
let isAudioSessionAlreadyActivated = false;

const AUDIO_SESSION_TIMEOUT_MS = 5000;

/**
 * Creates a promise that resolves when the audio session is activated,
 * or after a timeout to prevent hanging indefinitely.
 * @returns Promise that resolves when audio session is activated or timeout occurs
 */
export function waitForAudioSessionActivation(): Promise<void> {
  if (isAudioSessionAlreadyActivated) {
    isAudioSessionAlreadyActivated = false;
    return Promise.resolve();
  }

  resolveSetTime = Date.now();
  return new Promise((resolve) => {
    pendingResolve = resolve;
    pendingTimeout = setTimeout(() => {
      // Resolve on timeout to prevent hanging
      logger.debug('audioSessionPromise timed out');
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
    if (resolveSetTime) {
      const elapsedTime = Date.now() - resolveSetTime;
      resolveSetTime = null;
      logger.debug(`audioSessionPromise resolved in ${elapsedTime}ms`);
    }
    pendingResolve = null;
    isAudioSessionAlreadyActivated = false;
  } else {
    isAudioSessionAlreadyActivated = true;
  }
}
