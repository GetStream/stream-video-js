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
  const { selectedAudioDeviceId, selectedVideoDeviceId } = useMediaDevices();
  const [localAudioStream, setLocalAudioStream] = useState<MediaStream>();
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream>();

  useEffect(() => {
    const deviceIdsForStream = localAudioStream
      ?.getAudioTracks()
      .map((track) => {
        const settings = track.getSettings();
        return settings.deviceId;
      });

    if (
      !(incomingCalls.length + outgoingCalls.length) ||
      deviceIdsForStream?.includes(selectedAudioDeviceId)
    )
      return;

    getAudioStream(selectedAudioDeviceId).then(setLocalAudioStream);
  }, [localAudioStream, incomingCalls, outgoingCalls, selectedAudioDeviceId]);

  useEffect(() => {
    const deviceIdsForStream = localVideoStream
      ?.getVideoTracks()
      .map((track) => {
        const settings = track.getSettings();
        return settings.deviceId;
      });

    if (
      !(incomingCalls.length + outgoingCalls.length) ||
      deviceIdsForStream?.includes(selectedVideoDeviceId)
    )
      return;

    getVideoStream(selectedVideoDeviceId).then(setLocalVideoStream);
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
