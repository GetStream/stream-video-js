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
    let unsubscribe: (() => void) | undefined;

    const initSpeechDetector = async () => {
      try {
        unsubscribe = await speechDetector.start(
          (state: SoundDetectorState) => {
            setAudioState(state);
          },
        );
      } catch (error) {
        const logger = getLogger(['useSpeechDetection']);
        logger('error', 'Failed to initialize speech detector', error);
      }
    };

    initSpeechDetector();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return audioState;
}
