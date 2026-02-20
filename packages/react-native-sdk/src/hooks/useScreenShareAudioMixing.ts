import { useCallback, useEffect, useRef, useState } from 'react';
import { hasScreenShare, videoLoggerSystem } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import {
  startScreenShareAudioMixing,
  stopScreenShareAudioMixing,
} from '../native/ScreenShareAudioModule';
import { NoiseCancellationWrapper } from '../providers/NoiseCancellation/lib';

const logger = videoLoggerSystem.getLogger('useScreenShareAudioMixing');

/**
 * Tries to disable noise cancellation so screen audio passes through
 * unfiltered. Returns true if NC was disabled (and should be re-enabled later).
 */
async function disableNoiseCancellation(): Promise<boolean> {
  try {
    const nc = NoiseCancellationWrapper.getInstance();
    const wasEnabled = await nc.isEnabled();
    if (wasEnabled) {
      await nc.disable();
      logger.info('Noise cancellation disabled for screen share audio');
    }
    return wasEnabled;
  } catch {
    // NC module not installed or not configured — nothing to do
    return false;
  }
}

/**
 * Re-enables noise cancellation if it was previously disabled.
 */
async function restoreNoiseCancellation() {
  try {
    const nc = NoiseCancellationWrapper.getInstance();
    await nc.enable();
    logger.info('Noise cancellation re-enabled after screen share audio');
  } catch {
    // NC module not installed — nothing to do
  }
}

/**
 * Hook that manages the lifecycle of screen share audio mixing.
 *
 * When screen share is active and audio mixing is enabled
 * (via `call.screenShare.enableScreenShareAudio()`), this hook
 * calls the native module to mix captured screen/app audio
 * into the microphone audio track.
 *
 * Noise cancellation is temporarily disabled while screen audio mixing
 * is active so that all captured sounds (music, game audio, etc.)
 * pass through without being filtered.
 */
export const useScreenShareAudioMixing = () => {
  const call = useCall();
  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const isScreenSharing =
    localParticipant != null && hasScreenShare(localParticipant);

  const [audioEnabled, setAudioEnabled] = useState(
    () => call?.screenShare.state.audioEnabled ?? false,
  );

  const isMixingActiveRef = useRef(false);
  const ncWasEnabledRef = useRef(false);

  // Subscribe to the audioEnabled state on ScreenShareManager.
  // This observable is not exposed by a react-bindings hook,
  // so we subscribe to it directly via the call object.
  useEffect(() => {
    if (!call) return;
    const sub = call.screenShare.state.audioEnabled$.subscribe(setAudioEnabled);
    return () => sub.unsubscribe();
  }, [call]);

  const startMixing = useCallback(async () => {
    if (isMixingActiveRef.current) return;
    try {
      // Disable NC before starting mixing so screen audio is not filtered
      ncWasEnabledRef.current = await disableNoiseCancellation();

      logger.info('Starting screen share audio mixing');
      await startScreenShareAudioMixing();
      isMixingActiveRef.current = true;
    } catch (error) {
      logger.warn('Failed to start screen share audio mixing', error);
      // Restore NC if we disabled it but mixing failed
      if (ncWasEnabledRef.current) {
        restoreNoiseCancellation().catch(() => {});
        ncWasEnabledRef.current = false;
      }
    }
  }, []);

  const stopMixing = useCallback(async () => {
    if (!isMixingActiveRef.current) return;
    try {
      logger.info('Stopping screen share audio mixing');
      await stopScreenShareAudioMixing();
      isMixingActiveRef.current = false;

      // Restore NC if we disabled it
      if (ncWasEnabledRef.current) {
        await restoreNoiseCancellation();
        ncWasEnabledRef.current = false;
      }
    } catch (error) {
      logger.warn('Failed to stop screen share audio mixing', error);
    }
  }, []);

  // Start/stop audio mixing based on screen share status and audio preference
  useEffect(() => {
    if (isScreenSharing && audioEnabled) {
      startMixing();
    } else {
      stopMixing();
    }
  }, [isScreenSharing, audioEnabled, startMixing, stopMixing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isMixingActiveRef.current) {
        stopScreenShareAudioMixing().catch(() => {});
        isMixingActiveRef.current = false;
        if (ncWasEnabledRef.current) {
          restoreNoiseCancellation().catch(() => {});
          ncWasEnabledRef.current = false;
        }
      }
    };
  }, []);
};
