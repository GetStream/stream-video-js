import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  getAudioDevices,
  getVideoDevices,
  getAudioStream,
  getVideoStream,
} from '@stream-io/video-client';
import { MediaStream } from 'react-native-webrtc';

type MediaDeviceInfo = {
  deviceId: string;
  facing?: 'environment' | 'front';
  groupId: string;
  kind: 'videoinput' | 'audioinput';
  label: string;
};

/**
 * Exclude types from documentaiton site, but we should still add doc comments
 * @internal
 *
 * @category Device Management
 */
export type MediaDevicesContextAPI = {
  audioDevice?: MediaDeviceInfo;
  currentVideoDevice?: MediaDeviceInfo;
  getAudioStream: (deviceId?: string) => Promise<MediaStream>;
  getVideoStream: (deviceId?: string) => Promise<MediaStream>;
  setCurrentVideoDevice: React.Dispatch<
    React.SetStateAction<MediaDeviceInfo | undefined>
  >;
  videoDevices: MediaDeviceInfo[];
};

const MediaDevicesContext = createContext<MediaDevicesContextAPI | null>(null);

export const MediaDevicesProvider = (props: PropsWithChildren<{}>) => {
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentVideoDevice, setCurrentVideoDevice] = useState<
    MediaDeviceInfo | undefined
  >();
  const initialVideoDeviceSet = useRef(false);

  useEffect(() => {
    const subscription = getAudioDevices().subscribe(setAudioDevices);
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const subscription = getVideoDevices().subscribe(setVideoDevices);
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (videoDevices.length > 0 && !initialVideoDeviceSet.current) {
      const frontFacingVideoDevice = videoDevices.find(
        (videoDevice) =>
          videoDevice.kind === 'videoinput' && videoDevice.facing === 'front',
      );
      setCurrentVideoDevice(frontFacingVideoDevice);
      initialVideoDeviceSet.current = true;
    }
  }, [videoDevices]);

  const contextValue = {
    audioDevice: audioDevices[0],
    // Mobile devices generally stream front facing stream when a call starts
    currentVideoDevice,
    getAudioStream,
    getVideoStream,
    setCurrentVideoDevice,
    videoDevices,
  };

  return (
    <MediaDevicesContext.Provider value={contextValue}>
      {props.children}
    </MediaDevicesContext.Provider>
  );
};

/**
 *
 * @returns
 *
 * @category Device Management
 */
export const useMediaDevices = () => {
  const value = useContext(MediaDevicesContext);
  if (!value) {
    throw new Error(`MediaDevicesContext is null`);
  }
  return value;
};
