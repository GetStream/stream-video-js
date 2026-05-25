import { useEffect, useState } from 'react';
import { createSoundDetector } from '@stream-io/video-client';
import clsx from 'clsx';
import { DeviceListItem } from '../../hooks';

const LEVEL_BARS = 5;

const DeviceLevelIndicator = ({ deviceId }: { deviceId: string }) => {
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

export type DeviceAudioPreviewItemProps = {
  device: DeviceListItem;
  onSelect: (deviceId: string) => void;
};

export const DeviceAudioPreviewItem = ({
  device,
  onSelect,
}: DeviceAudioPreviewItemProps) => {
  if (device.deviceId === 'default') return null;

  return (
    <label
      className={`str-video__device-settings__option${device.isSelected ? ' str-video__device-settings__option--selected' : ''}`}
      htmlFor={`audioinput--${device.deviceId}`}
    >
      <input
        type="radio"
        name="audioinput"
        value={device.deviceId}
        id={`audioinput--${device.deviceId}`}
        checked={device.isSelected}
        onChange={(e) => onSelect(e.target.value)}
      />
      {device.label}
      <DeviceLevelIndicator deviceId={device.deviceId} />
    </label>
  );
};
