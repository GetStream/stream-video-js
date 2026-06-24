import { useEffect, useRef } from 'react';
import { createSoundDetector } from '@stream-io/video-client';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { Icon } from '../Icon';

export const AudioVolumeIndicator = () => {
  const { useMicrophoneState } = useCallStateHooks();
  const { isEnabled, mediaStream } = useMicrophoneState();
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEnabled || !mediaStream) return;
    const disposeSoundDetector = createSoundDetector(
      mediaStream,
      ({ audioLevel: al }) => {
        if (barRef.current) {
          barRef.current.style.transform = `scaleX(${al / 100})`;
        }
      },
      { detectionFrequencyInMs: 80, destroyStreamOnStop: false },
    );
    return () => {
      disposeSoundDetector().catch(console.error);
    };
  }, [isEnabled, mediaStream]);

  return (
    <div className="str-video__audio-volume-indicator">
      <Icon icon={isEnabled ? 'mic' : 'mic-off'} />
      <div className="str-video__audio-volume-indicator__bar">
        <div
          ref={barRef}
          className="str-video__audio-volume-indicator__bar-value"
        />
      </div>
    </div>
  );
};
