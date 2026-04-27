import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { VIRTUAL_DEVICE_PREFIX } from '@stream-io/video-client';
import { DeviceListItem } from '../../hooks';

const DeviceVideoPreview = ({ deviceId }: { deviceId: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (deviceId.startsWith(VIRTUAL_DEVICE_PREFIX)) return;

    let cancelled = false;
    let stream: MediaStream | undefined;

    navigator.mediaDevices
      .getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: false,
      })
      .then((mediaStream) => {
        if (cancelled) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }

        stream = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      })
      .catch(console.error);

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [deviceId]);

  return (
    <div className="str-video__device-video-preview">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="str-video__device-video-preview__video"
      />
    </div>
  );
};

export type DeviceVideoPreviewItemProps = {
  device: DeviceListItem;
  onSelect: (deviceId: string) => void;
};

export const DeviceVideoPreviewItem = ({
  device,
  onSelect,
}: DeviceVideoPreviewItemProps) => {
  if (device.deviceId === 'default') return null;

  return (
    <button
      type="button"
      className={clsx('str-video__device-preview', {
        'str-video__device-preview--selected': device.isSelected,
      })}
      onClick={() => onSelect(device.deviceId)}
      aria-pressed={device.isSelected}
    >
      <DeviceVideoPreview deviceId={device.deviceId} />
      <span className="str-video__device-preview__label">{device.label}</span>
    </button>
  );
};
