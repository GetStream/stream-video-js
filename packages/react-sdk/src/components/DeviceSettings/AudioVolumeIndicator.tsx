import { useEffect, useState } from 'react';
import { createSoundDetector } from '@stream-io/video-client';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { Icon } from '../Icon';

export const AudioVolumeIndicator = () => {
  const { useMicrophoneState } = useCallStateHooks();
  const { isEnabled, mediaStream } = useMicrophoneState();
  const [audioLevel, setAudioLevel] = useState(0);

  useEffect(() => {
    if (!isEnabled || !mediaStream) return;
    const disposeSoundDetector = createSoundDetector(
      mediaStream,
      ({ audioLevel: al }) => setAudioLevel(al),
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
          className="str-video__audio-volume-indicator__bar-value"
          style={{ transform: `scaleX(${audioLevel / 100})` }}
        />
      </div>
    </div>
  );
};
