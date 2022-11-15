import { StreamVideoClient } from '@stream-io/video-client';
import { MediaStream } from 'react-native-webrtc';
import createStoreContext from './createStoreContext';

interface AppGlobalStore {
  meetingCallID: string;
  ringingCallID: string;
  username: string;
  token: string;
  videoClient: StreamVideoClient | undefined;
  localMediaStream: MediaStream | undefined;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  cameraBackFacingMode: boolean;
  loopbackMyVideo: boolean;
}

export const {
  Provider: AppGlobalContextProvider,
  useStoreValue: useAppGlobalStoreValue,
  useStoreSetState: useAppGlobalStoreSetState,
} = createStoreContext<AppGlobalStore>(
  {
    meetingCallID: '',
    ringingCallID: '',
    username: '',
    token: '',
    videoClient: undefined,
    localMediaStream: undefined,
    loopbackMyVideo: false,
    isAudioMuted: false,
    isVideoMuted: false,
    cameraBackFacingMode: false,
  },
  ['meetingCallID', 'ringingCallID', 'username', 'token'],
);
