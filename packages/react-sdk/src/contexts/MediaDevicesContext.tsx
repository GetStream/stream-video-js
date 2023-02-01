import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
  useCallback,
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
  selectedAudioDeviceId?: string;
  selectedVideoDeviceId?: string;
  switchDevice: (kind: 'videoinput' | 'audioinput', deviceId?: string) => void;
};

const MediaDevicesContext = createContext<MediaDevicesContextAPI | null>(null);

export type MediaDevicesProviderProps = PropsWithChildren<{
  enumerate?: boolean;
}>;

export const MediaDevicesProvider = ({
  children,
  enumerate = true,
}: MediaDevicesProviderProps) => {
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDeviceId, selectAudioDeviceId] =
    useState<MediaDevicesContextAPI['selectedAudioDeviceId']>('default');
  const [selectedVideoDeviceId, selectVideoDeviceId] =
    useState<MediaDevicesContextAPI['selectedVideoDeviceId']>('default');
  const [audioOutputDevices, setAudioOutputDevices] = useState<
    MediaDeviceInfo[]
  >([]);
  const [isAudioOutputChangeSupported] = useState<boolean>(() =>
    checkIfAudioOutputChangeSupported(),
  );

  const switchDevice = useCallback(
    async (kind: 'videoinput' | 'audioinput', deviceId?: string) => {
      if (kind === 'videoinput') {
        selectVideoDeviceId(deviceId);
      }
      if (kind === 'audioinput') {
        selectAudioDeviceId(deviceId);
      }
    },
    [],
  );

  useEffect(() => {
    if (!enumerate) return;

    const subscription = getAudioDevices().subscribe(setAudioDevices);
    return () => subscription.unsubscribe();
  }, [enumerate]);

  useEffect(() => {
    if (!enumerate) return;

    const subscription = getVideoDevices().subscribe(setVideoDevices);
    return () => subscription.unsubscribe();
  }, [enumerate]);

  useEffect(() => {
    if (!enumerate) return;

    const subscription = getAudioOutputDevices().subscribe(
      setAudioOutputDevices,
    );
    return () => subscription.unsubscribe();
  }, [enumerate]);

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
      {children}
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
