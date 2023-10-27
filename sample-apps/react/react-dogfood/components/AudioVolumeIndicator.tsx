import { useEffect, useState } from 'react';

import {
  createSoundDetector,
  Icon,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';

export const AudioVolumeIndicator = () => {
  const { useMicrophoneState } = useCallStateHooks();
  const { isEnabled, mediaStream } = useMicrophoneState();
  const [audioLevel, setAudioLevel] = useState(0);

  useEffect(() => {
    if (!isEnabled || !mediaStream) return;

    const disposeSoundDetector = createSoundDetector(
      mediaStream,
      ({ audioLevel: al }) => setAudioLevel(al),
      { detectionFrequencyInMs: 80 },
    );

    return () => {
      disposeSoundDetector().catch(console.error);
    };
  }, [isEnabled, mediaStream]);

  if (!isEnabled) return null;

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0 1.25rem 1rem',
      }}
    >
      <Icon icon="mic" />
      <div
        style={{
          flex: '1',
          background: '#fff',
          height: '5px',
          borderRadius: '4px',
        }}
      >
        <div
          style={{
            transform: `scaleX(${audioLevel / 100})`,
            transformOrigin: 'left center',
            background: 'var(--str-video__primary-color)',
            width: '100%',
            height: '100%',
          }}
        />
      </div>
    </div>
  );
};
