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
  getAudioOutputDevices,
  checkIfAudioOutputChangeSupported,
} from '@stream-io/video-client';

export type MediaDevicesContextAPI = {
  audioDevices: MediaDeviceInfo[];
  videoDevices: MediaDeviceInfo[];
  audioOutputDevices: MediaDeviceInfo[];
  getAudioStream: (deviceId?: string) => Promise<MediaStream>;
  getVideoStream: (deviceId?: string) => Promise<MediaStream>;
  isAudioOutputChangeSupported: boolean;
  selectedAudioDeviceId: string | undefined;
  selectedVideoDeviceId: string | undefined;
  switchDevice: (kind: 'videoinput' | 'audioinput', deviceId: string) => void;
};

const MediaDevicesContext = createContext<MediaDevicesContextAPI | null>(null);

export const MediaDevicesProvider = (props: PropsWithChildren<{}>) => {
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDeviceId, selectAudioDeviceId] =
    useState<MediaDevicesContextAPI['selectedAudioDeviceId']>();
  const [selectedVideoDeviceId, selectVideoDeviceId] =
    useState<MediaDevicesContextAPI['selectedVideoDeviceId']>();
  const [audioOutputDevices, setAudioOutputDevices] = useState<
    MediaDeviceInfo[]
  >([]);
  const [isAudioOutputChangeSupported] = useState<boolean>(() =>
    checkIfAudioOutputChangeSupported(),
  );

  const switchDevice = async (
    kind: 'videoinput' | 'audioinput',
    deviceId: string,
  ) => {
    if (kind === 'videoinput') {
      selectVideoDeviceId(deviceId);
    }
    if (kind === 'audioinput') {
      selectAudioDeviceId(deviceId);
    }
  };

  useEffect(() => {
    const subscription = getAudioDevices().subscribe(setAudioDevices);
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const subscription = getVideoDevices().subscribe(setVideoDevices);
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const subscription = getAudioOutputDevices().subscribe(
      setAudioOutputDevices,
    );
    return () => subscription.unsubscribe();
  }, []);

  const contextValue = {
    audioDevices,
    videoDevices,
    audioOutputDevices,
    getAudioStream,
    getVideoStream,
    isAudioOutputChangeSupported,
    selectedAudioDeviceId,
    selectedVideoDeviceId,
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
