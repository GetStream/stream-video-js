import { useEffect, useState } from 'react';
import { createSoundDetector } from '@stream-io/video-client';
import clsx from 'clsx';

const LEVEL_BARS = 5;

export type DeviceLevelIndicatorProps = {
  deviceId: string;
};

/**
 * Renders a per-device audio level meter as a row of bars.
 *
 * Opens an independent `getUserMedia` stream for the given device and
 * uses `createSoundDetector` to display the current audio level.
 */
export const DeviceLevelIndicator = ({
  deviceId,
}: DeviceLevelIndicatorProps) => {
  const [audioLevel, setAudioLevel] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let dispose: (() => Promise<void>) | undefined;

    navigator.mediaDevices
      .getUserMedia({
        audio: { deviceId: { exact: deviceId } },
        video: false,
      })
      .then((mediaStream) => {
        if (cancelled) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }
        dispose = createSoundDetector(
          mediaStream,
          ({ audioLevel: al }) => setAudioLevel(al),
          { detectionFrequencyInMs: 80 },
        );
      })
      .catch(console.error);

    return () => {
      cancelled = true;
      dispose?.().catch(console.error);
    };
  }, [deviceId]);

  const activeBars = Math.round((audioLevel / 100) * LEVEL_BARS);

  return (
    <div className="str-video__device-level-indicator" aria-label="Audio level">
      {Array.from({ length: LEVEL_BARS }, (_, i) => (
        <div
          key={i}
          className={clsx('str-video__device-level-indicator__bar', {
            'str-video__device-level-indicator__bar--active': i < activeBars,
          })}
        />
      ))}
    </div>
  );
};
