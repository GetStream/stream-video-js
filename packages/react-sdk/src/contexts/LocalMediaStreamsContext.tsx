import { createContext, useContext, useEffect, useState } from 'react';
import {
  useActiveCall,
  usePendingCalls,
} from '@stream-io/video-react-bindings';
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

// this function has been written with a thought in mind which
// is that we create separate MediaStreams for audio inputs
// and video inputs meaning there's _always_ one track per stream (thus one deviceId)
const getDeviceId = (mediaStream: MediaStream) => {
  const [deviceId] =
    mediaStream.getTracks().map((track) => track.getSettings().deviceId) ?? [];
  return deviceId;
};

const getStream = (type: 'audioinput' | 'videoinput', deviceId?: string) =>
  type === 'audioinput' ? getAudioStream(deviceId) : getVideoStream(deviceId);

const useSetupLocalMediaStream = ({
  localStream,
  selectedDeviceId,
  setLocalStream,
  type,
}: {
  localStream?: MediaStream;
  setLocalStream: React.Dispatch<React.SetStateAction<MediaStream | undefined>>;
  selectedDeviceId?: string;
  type: 'audioinput' | 'videoinput'; // FIXME: typing
}) => {
  const pendingCalls = usePendingCalls();
  const call = useActiveCall();
  const { switchDevice } = useMediaDevices();

  useEffect(() => {
    let effectInterrupted = false;

    const cleanup = () => {
      effectInterrupted = true;
      localStream?.getTracks().forEach((t) => t.stop());
    };

    // request streams only if there's at least one pending call
    if (!pendingCalls.length && !call) return cleanup;

    if (localStream?.active) {
      const deviceId = getDeviceId(localStream);
      if (deviceId === selectedDeviceId) return;
    }

    getStream(type, selectedDeviceId).then((stream) => {
      if (effectInterrupted) return;
      setLocalStream(stream);
      if (selectedDeviceId) return;
      const deviceId = getDeviceId(stream);
      switchDevice(type, deviceId);
    });

    return cleanup;
  }, [localStream, pendingCalls, selectedDeviceId, call]);
};

export const LocalMediaStreamsContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { selectedAudioDeviceId, selectedVideoDeviceId } = useMediaDevices();
  const [localAudioStream, setLocalAudioStream] = useState<MediaStream>();
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream>();

  useSetupLocalMediaStream({
    localStream: localAudioStream,
    setLocalStream: setLocalAudioStream,
    selectedDeviceId: selectedAudioDeviceId,
    type: 'audioinput',
  });

  useSetupLocalMediaStream({
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
