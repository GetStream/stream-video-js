import { createContext, useContext, useEffect, useState } from 'react';
import {
  useIncomingCalls,
  useOutgoingCalls,
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
export const LocalMediaStreamsContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const incomingCalls = useIncomingCalls();
  const outgoingCalls = useOutgoingCalls();
  const { selectedAudioDeviceId, selectedVideoDeviceId, switchDevice } =
    useMediaDevices();
  const [localAudioStream, setLocalAudioStream] = useState<MediaStream>();
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream>();

  useEffect(() => {
    if (!(incomingCalls.length + outgoingCalls.length)) return;

    if (localAudioStream?.active) {
      const [t] =
        localAudioStream
          .getAudioTracks()
          .map((track) => track.getSettings().deviceId) ?? [];

      if (t === selectedAudioDeviceId) return;
    }

    getAudioStream(selectedAudioDeviceId).then((stream) => {
      setLocalAudioStream(stream);
      if (selectedAudioDeviceId) return;
      const [deviceId] = stream
        .getAudioTracks()
        .map((v) => v.getSettings().deviceId);
      // @ts-ignore
      switchDevice('audioinput', deviceId);
    });
  }, [localAudioStream, incomingCalls, outgoingCalls, selectedAudioDeviceId]);

  useEffect(() => {
    if (!(incomingCalls.length + outgoingCalls.length)) return;

    if (localVideoStream?.active) {
      const [deviceId] =
        localVideoStream
          .getVideoTracks()
          .map((track) => track.getSettings().deviceId) ?? [];

      if (deviceId === selectedVideoDeviceId) return;
    }

    getVideoStream(selectedVideoDeviceId).then((stream) => {
      setLocalVideoStream(stream);
      if (selectedVideoDeviceId) return;
      const [deviceId] = stream
        .getVideoTracks()
        .map((v) => v.getSettings().deviceId);
      // @ts-ignore
      switchDevice('videoinput', deviceId);
    });
  }, [localVideoStream, incomingCalls, outgoingCalls, selectedVideoDeviceId]);

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
