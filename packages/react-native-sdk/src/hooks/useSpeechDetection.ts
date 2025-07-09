import { useEffect, useState } from 'react';
import {
  type SoundDetectorState,
  RNSpeechDetector,
  getLogger,
} from '@stream-io/video-client';

/**
 * Hook that provides speech detection info using the RNSpeechDetector.
 *
 * @returns An object containing the current audio level (0 - 1) and whether sound is detected.
 */
export function useSpeechDetection() {
  const [audioState, setAudioState] = useState<SoundDetectorState>({
    isSoundDetected: false,
    audioLevel: 0,
  });

  useEffect(() => {
    const speechDetector = new RNSpeechDetector();
    let cleanup: (() => void) | undefined;

    const initSpeechDetector = async () => {
      try {
        cleanup = await speechDetector.start((state: SoundDetectorState) => {
          setAudioState(state);
        });
      } catch (error) {
        const logger = getLogger(['useAudioLevels']);
        logger('error', 'Failed to initialize speech detector', error);
      }
    };

    initSpeechDetector();

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  return audioState;
}
