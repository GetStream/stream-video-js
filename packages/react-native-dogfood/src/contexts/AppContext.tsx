import React, {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Linking } from 'react-native';
import { mediaDevices, MediaStream } from 'react-native-webrtc';
import { CallState, Participant } from '../gen/video/sfu/models/models';
import { Call as CallMeta } from '../gen/video/coordinator/call_v1/call';
import { useMuteState } from '../hooks/useMuteState';
import { useStoredState } from '../hooks/useStoredState';
import { Call } from '../modules/Call';
import { StreamSfuClient, StreamVideoClient } from '@stream-io/video-client';

export interface AppValueContextProps {
  callID: string;
  username: string;
  videoClient: StreamVideoClient | undefined;
  sfuClient: StreamSfuClient | undefined;
  call: Call | undefined;
  activeCall: CallMeta | undefined;
  localMediaStream: MediaStream | undefined;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  loopbackMyVideo: boolean;
  callState: CallState | undefined;
  participants: Participant[];
}

export interface AppSetterContextProps {
  setCallID: Dispatch<SetStateAction<string>>;
  setCameraBackFacingMode: Dispatch<SetStateAction<boolean>>;
  setUsername: Dispatch<SetStateAction<string>>;
  setVideoClient: Dispatch<SetStateAction<StreamVideoClient | undefined>>;
  setSfuClient: Dispatch<SetStateAction<StreamSfuClient | undefined>>;
  setCall: Dispatch<SetStateAction<Call | undefined>>;
  setActiveCall: Dispatch<SetStateAction<CallMeta | undefined>>;
  setLoopbackMyVideo: Dispatch<SetStateAction<boolean>>;
  setCallState: Dispatch<SetStateAction<CallState | undefined>>;
  setParticipants: Dispatch<SetStateAction<Participant[]>>;
  resetCallState: () => void;
}

export const AppContextProvider = (props: PropsWithChildren<{}>) => {
  const [callID, setCallID] = useStoredState('callID', '123');
  const [username, setUsername] = useStoredState('username', 'marcelo');
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const [sfuClient, setSfuClient] = useState<StreamSfuClient>();
  const [call, setCall] = useState<Call>();
  const [activeCall, setActiveCall] = useState<CallMeta>();
  const [cameraBackFacingMode, setCameraBackFacingMode] =
    useState<boolean>(false);

  const [localMediaStream, setLocalMediaStream] = useState<MediaStream>();

  const [loopbackMyVideo, setLoopbackMyVideo] = useState<boolean>(false);
  const [callState, setCallState] = useState<CallState>();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const { isAudioMuted, isVideoMuted, resetAudioAndVideoMuted } = useMuteState(
    username,
    call,
    localMediaStream,
  );

  const resetCallState = useCallback(() => {
    if (localMediaStream) {
      const [primaryVideoTrack] = localMediaStream.getVideoTracks();
      if (cameraBackFacingMode) {
        primaryVideoTrack._switchCamera();
        setCameraBackFacingMode((prevState) => !prevState);
      }
    }
    setCallState(undefined);
    resetAudioAndVideoMuted();
    setParticipants([]);
  }, [cameraBackFacingMode, localMediaStream, resetAudioAndVideoMuted]);

  // run only once per app lifecycle
  useEffect(() => {
    const parseAndSetCallID = (url: string | null) => {
      const matchResponse = url?.match(/.*callID\/(.*)\//);
      if (!matchResponse || matchResponse.length < 1) {
        return null;
      }

      setCallID(matchResponse[1]);
    };
    const configure = async () => {
      const mediaStream = await mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      setLocalMediaStream(mediaStream);

      // listen to url changes and parse the callID
      Linking.addEventListener('url', ({ url }) => {
        parseAndSetCallID(url);
      });
      const url = await Linking.getInitialURL();
      parseAndSetCallID(url);
    };

    configure();
  }, [setCallID]);

  const setterContext: AppSetterContextProps = useMemo(
    () => ({
      setCallID,
      setCameraBackFacingMode,
      setUsername,
      setVideoClient,
      setSfuClient,
      setLocalMediaStream,
      setCall,
      setActiveCall,
      setLoopbackMyVideo,
      setCallState,
      setParticipants,
      resetCallState,
    }),
    [setCallID, setUsername, resetCallState],
  );
  const valueContext: AppValueContextProps = {
    callID,
    username,
    videoClient,
    sfuClient,
    localMediaStream,
    call,
    activeCall,
    loopbackMyVideo,
    callState,
    participants,
    isAudioMuted,
    isVideoMuted,
  };
  return (
    <AppValueContext.Provider value={valueContext}>
      <AppSetterContext.Provider value={setterContext}>
        {props.children}
      </AppSetterContext.Provider>
    </AppValueContext.Provider>
  );
};

export const useAppValueContext = () => {
  return useContext(AppValueContext);
};

export const useAppSetterContext = () => {
  return useContext(AppSetterContext);
};

const AppValueContext = createContext<AppValueContextProps>({
  callID: '',
  username: '',
  videoClient: undefined,
  sfuClient: undefined,
  localMediaStream: undefined,
  call: undefined,
  activeCall: undefined,
  loopbackMyVideo: false,
  callState: undefined,
  participants: [],
  isAudioMuted: false,
  isVideoMuted: false,
});

const AppSetterContext = createContext<AppSetterContextProps>({
  setCallID: () => {},
  setCameraBackFacingMode: () => {},
  setUsername: () => {},
  setVideoClient: () => {},
  setSfuClient: () => {},
  setLoopbackMyVideo: () => {},
  setCallState: () => {},
  resetCallState: () => {},
  setParticipants: () => {},
  setCall: () => {},
  setActiveCall: () => {},
});
