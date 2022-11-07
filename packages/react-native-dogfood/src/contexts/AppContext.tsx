import { CallMeta, StreamVideoClient, Call } from '@stream-io/video-client';
import { MediaStream } from 'react-native-webrtc';
import createStoreContext from './createStoreContext';

interface AppGlobalStore {
  callID: string;
  username: string;
  token: string;
  videoClient: StreamVideoClient | undefined;
  call: Call | undefined;
  activeCall: CallMeta.Call | undefined;
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
    callID: '',
    username: '',
    token: '',
    videoClient: undefined,
    localMediaStream: undefined,
    call: undefined,
    activeCall: undefined,
    loopbackMyVideo: false,
    isAudioMuted: false,
    isVideoMuted: false,
    cameraBackFacingMode: false,
  },
  ['callID', 'username', 'token'],
);
