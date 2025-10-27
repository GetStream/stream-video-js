import { useEffect, useState } from 'react';
import {
  type SoundDetectorState,
  RNSpeechDetector,
} from '@stream-io/video-client';
import { useCallStateHooks } from '@stream-io/video-react-bindings';

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
  const { useMicrophoneState } = useCallStateHooks();
  const { isEnabled, mediaStream } = useMicrophoneState();

  useEffect(() => {
    if (!isEnabled) return;

    const detector = new RNSpeechDetector(mediaStream);
    const start = detector.start((state: SoundDetectorState) => {
      setAudioState(state);
    });

    return () => {
      start.then((stop) => stop());
    };
  }, [mediaStream, isEnabled]);

  return audioState;
}
