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
    console.log('mount: ', deviceId);
    let cancelled = false;
    let dispose: (() => Promise<void>) | undefined;
    let stream: MediaStream | undefined;

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
        stream = mediaStream;
        dispose = createSoundDetector(
          mediaStream,
          ({ audioLevel: al }) => setAudioLevel(al),
          { detectionFrequencyInMs: 80, destroyStreamOnStop: false },
        );
      })
      .catch((e) => {
        console.error(e);
      });

    return () => {
      console.log('unmount: ', deviceId);
      cancelled = true;
      dispose?.().catch(console.error);
      stream?.getTracks().forEach((t) => t.stop());
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
