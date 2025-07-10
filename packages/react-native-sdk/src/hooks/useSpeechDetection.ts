import { useEffect, useState, useRef } from 'react';
import {
  type SoundDetectorState,
  RNSpeechDetector,
  getLogger,
} from '@stream-io/video-client';
import { useCallStateHooks } from '@stream-io/video-react-bindings';

/**
 * Hook that provides speech detection info using the RNSpeechDetector.
 *
 * @returns An object containing the current audio level (0 - 1) and whether sound is detected.
 */
export function useSpeechDetection(mediaStream: MediaStream | undefined) {
  const [audioState, setAudioState] = useState<SoundDetectorState>({
    isSoundDetected: false,
    audioLevel: 0,
  });
  const { useMicrophoneState } = useCallStateHooks();
  const { isEnabled } = useMicrophoneState();

  const deinit = useRef<Promise<() => void>>(undefined);
  useEffect(() => {
    const speechDetector = new RNSpeechDetector();
    let unsubscribe: Promise<() => void>;

    try {
      unsubscribe = speechDetector.start((state: SoundDetectorState) => {
        if (isEnabled) {
          setAudioState(state);
        } else {
          setAudioState({ isSoundDetected: false, audioLevel: 0 });
        }
      }, mediaStream);
    } catch (error) {
      const logger = getLogger(['useSpeechDetection']);
      logger('error', 'Failed to initialize speech detector', error);
    }

    const init = (deinit.current || Promise.resolve()).then(() => unsubscribe);

    return () => {
      deinit.current = init.then(() => unsubscribe);
    };
  }, [mediaStream, isEnabled]);

  return audioState;
}
