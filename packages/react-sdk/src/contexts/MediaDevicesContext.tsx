import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  getAudioDevices,
  getVideoDevices,
  getAudioStream,
  getVideoStream,
} from '@stream-io/video-client';

export type MediaDevicesContextAPI = {
  audioDevices: MediaDeviceInfo[];
  videoDevices: MediaDeviceInfo[];
  getAudioStream: (deviceId?: string) => Promise<MediaStream>;
  getVideoStream: (deviceId?: string) => Promise<MediaStream>;
};

const MediaDevicesContext = createContext<MediaDevicesContextAPI | null>(null);

export const MediaDevicesProvider = (props: PropsWithChildren<{}>) => {
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    const subscription = getAudioDevices().subscribe(setAudioDevices);
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const subscription = getVideoDevices().subscribe(setVideoDevices);
    return () => subscription.unsubscribe();
  }, []);

  const contextValue = {
    audioDevices,
    videoDevices,
    getAudioStream,
    getVideoStream,
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
