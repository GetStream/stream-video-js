import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Call } from '@stream-io/video-client';

export type MediaDevicesContextAPI = {
  switchDevice: (kind: 'audioinput' | 'videoinput', deviceId: string) => void;
  devices?: MediaDeviceInfo[];
  audioInputDeviceId?: string;
  videoInputDeviceId?: string;
  videoStream?: MediaStream;
  audioStream?: MediaStream;
};

const MediaDevicesContext = createContext<MediaDevicesContextAPI | null>(null);

// FIXME: OL: shared logic, move into dedicated module
export const MediaDevicesProvider = (
  props: PropsWithChildren<{
    call?: Call;
  }>,
) => {
  const { call } = props;
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioStream, setAudioStream] = useState<MediaStream>();
  const [videoStream, setVideoStream] = useState<MediaStream>();

  useEffect(() => {
    if (!call) return;
    const reloadDevices = async () => {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: call.getActiveInputDeviceId('audioinput'),
        },
      });
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: call.getActiveInputDeviceId('videoinput'),
          width: 1280,
          height: 720,
        },
      });
      setAudioStream(audioStream);
      setVideoStream(videoStream);

      // in Firefox, devices can be enumerated after userMedia is requested
      // and permissions granted. Otherwise, device labels are empty
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      setDevices(allDevices);
    };

    reloadDevices().catch((e) => {
      console.error('Failed to access to media devices', e);
    });

    navigator.mediaDevices.addEventListener('devicechange', reloadDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', reloadDevices);
    };
  }, [call]);

  const switchDevice = useCallback(
    async (kind: 'audioinput' | 'videoinput', deviceId: string) => {
      if (!call) return;
      if (kind === 'videoinput') {
        const videoStream = await call.changeInputDevice(kind, deviceId, {
          width: 1280,
          height: 720,
        });
        setVideoStream(videoStream);
      } else if (kind === 'audioinput') {
        const audioStream = await call.changeInputDevice(kind, deviceId);
        setAudioStream(audioStream);
      }
    },
    [call],
  );

  const contextValue = {
    audioInputDeviceId: call?.getActiveInputDeviceId('audioinput'),
    videoInputDeviceId: call?.getActiveInputDeviceId('videoinput'),
    devices,
    audioStream,
    videoStream,
    switchDevice,
  };

  return (
    <MediaDevicesContext.Provider value={contextValue}>
      {props.children}
    </MediaDevicesContext.Provider>
  );
};

export const useMediaDevices = () => {
  const value = useContext(MediaDevicesContext);
  if (!value) {
    console.warn(`Null MediaDevicesContext`);
  }
  return value as MediaDevicesContextAPI;
};
