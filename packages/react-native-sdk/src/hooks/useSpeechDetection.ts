import { useEffect, useState, useRef } from 'react';
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
  const deinit = useRef<Promise<void>>(undefined);

  useEffect(() => {
    const speechDetector = new RNSpeechDetector();
    let unsubscribe: (() => void) | undefined;

    const init = async () => {
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

    return () => {
      deinit.current = init().then(() => {
        if (unsubscribe) {
          unsubscribe();
        }
      });
    };
  }, []);

  return audioState;
}
