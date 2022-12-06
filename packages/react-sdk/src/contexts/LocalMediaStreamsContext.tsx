import { createContext, useContext, useEffect, useState } from 'react';
import { usePendingCalls } from '@stream-io/video-react-bindings';
import { getAudioStream, getVideoStream } from '@stream-io/video-client';
import { useMediaDevices } from './MediaDevicesContext';

type MediaStreamsContextType = {
  localAudioStream?: MediaStream;
  localVideoStream?: MediaStream;
};

const LocalMediaStreamsContext = createContext<MediaStreamsContextType>({
  localAudioStream: undefined,
  localVideoStream: undefined,
});

const getDeviceId = (mediaStream: MediaStream) => {
  // considering the fact that we create separate MediaStreams for
  // audio inputs and video inputs meaning one track per stream (one deviceId)
  const [deviceId] =
    mediaStream.getTracks().map((track) => track.getSettings().deviceId) ?? [];
  return deviceId;
};

const getStream = (type: 'audioinput' | 'videoinput', deviceId?: string) =>
  type === 'audioinput' ? getAudioStream(deviceId) : getVideoStream(deviceId);

const useLocalMediaStreamSetup = ({
  localStream,
  selectedDeviceId,
  setLocalStream,
  type,
}: {
  localStream?: MediaStream;
  setLocalStream: React.Dispatch<React.SetStateAction<MediaStream | undefined>>;
  selectedDeviceId?: string;
  type: 'audioinput' | 'videoinput';
}) => {
  const pendingCalls = usePendingCalls();
  const { switchDevice } = useMediaDevices();

  useEffect(() => {
    let effectInterrupted = false;

    const cleanup = () => {
      effectInterrupted = true;
      localStream?.getTracks().forEach((t) => {
        console.log(t);
        t.stop();
      });
    };

    if (!pendingCalls.length) return cleanup;

    if (localStream?.active) {
      const deviceId = getDeviceId(localStream);
      if (deviceId === selectedDeviceId) return;
    }

    getStream(type, selectedDeviceId).then((stream) => {
      if (effectInterrupted) return;
      setLocalStream(stream);
      if (selectedDeviceId) return;
      const deviceId = getDeviceId(stream);
      // @ts-ignore
      switchDevice(type, deviceId);
    });

    return cleanup;
  }, [localStream, pendingCalls, selectedDeviceId]);
};

export const LocalMediaStreamsContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { selectedAudioDeviceId, selectedVideoDeviceId } = useMediaDevices();
  const [localAudioStream, setLocalAudioStream] = useState<MediaStream>();
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream>();

  useLocalMediaStreamSetup({
    localStream: localAudioStream,
    setLocalStream: setLocalAudioStream,
    selectedDeviceId: selectedAudioDeviceId,
    type: 'audioinput',
  });

  useLocalMediaStreamSetup({
    localStream: localVideoStream,
    setLocalStream: setLocalVideoStream,
    selectedDeviceId: selectedVideoDeviceId,
    type: 'videoinput',
  });

  return (
    <LocalMediaStreamsContext.Provider
      value={{
        localVideoStream,
        localAudioStream,
      }}
    >
      {children}
    </LocalMediaStreamsContext.Provider>
  );
};

export const useLocalMediaStreamsContext = () =>
  useContext(LocalMediaStreamsContext);
