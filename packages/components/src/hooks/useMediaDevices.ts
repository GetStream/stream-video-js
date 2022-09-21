import { useState, useEffect } from 'react';

export const useMediaDevices = () => {
  const [mediaStream, setMediaStream] = useState<MediaStream>();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    const reloadDevices = async () => {
      const constraints = { audio: true, video: { width: 1280, height: 720 } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setMediaStream(stream);

      // in Firefox, devices can be enumerated after userMedia is requested
      // and permissions granted. Otherwise, device labels are empty
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      setDevices(allDevices);
    };

    navigator.mediaDevices.addEventListener('devicechange', reloadDevices);

    reloadDevices();

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', reloadDevices);
    };
  }, []);

  return { devices, mediaStream };
};
