import { useEffect, useState } from 'react';

import {
  createSoundDetector,
  Icon,
  useMediaDevices,
} from '@stream-io/video-react-sdk';

export const AudioVolumeIndicator = () => {
  const { getAudioStream, selectedAudioInputDeviceId, initialAudioEnabled } =
    useMediaDevices();
  const [audioLevel, setAudioLevel] = useState<number>(0);

  useEffect(() => {
    if (!initialAudioEnabled) return;

    const disposeSoundDetector = getAudioStream({
      deviceId: selectedAudioInputDeviceId,
    }).then((audioStream) =>
      createSoundDetector(
        audioStream,
        ({ audioLevel: al }) => setAudioLevel(al),
        { detectionFrequencyInMs: 80 },
      ),
    );

    disposeSoundDetector.catch((err) => {
      console.error('Error while creating sound detector', err);
    });

    return () => {
      disposeSoundDetector
        .then((dispose) => dispose())
        .catch((err) => {
          console.error('Error while disposing sound detector', err);
        });
    };
  }, [initialAudioEnabled, getAudioStream, selectedAudioInputDeviceId]);

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
      <Icon icon={initialAudioEnabled ? 'mic' : 'mic-off'} />
      <div
        style={{
          flex: '1',
          background: initialAudioEnabled ? '#fff' : '#777',
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
