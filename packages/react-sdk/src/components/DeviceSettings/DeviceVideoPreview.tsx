import { useEffect, useRef, useState } from 'react';

export type DeviceVideoPreviewProps = {
  deviceId: string;
};

/**
 * Renders a live camera preview for the given video device.
 *
 * Opens an independent `getUserMedia` stream for the given device and
 * displays it in a `<video>` element. Cleans up on unmount or device change.
 */
export const DeviceVideoPreview = ({ deviceId }: DeviceVideoPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | undefined;

    setError(false);

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
      .catch(() => {
        if (!cancelled) {
          setError(true);
        }
      });

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [deviceId]);

  if (error) return null;

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
