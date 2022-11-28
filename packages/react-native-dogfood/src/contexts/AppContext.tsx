import { StreamVideoClient } from '@stream-io/video-client';
import { MediaStream } from 'react-native-webrtc';
import createStoreContext from './createStoreContext';

interface AppGlobalStore {
  meetingCallID: string;
  ringingCallID: string;
  ringingUsers: string[];
  username: string;
  userImageUrl: string;
  videoClient: StreamVideoClient | undefined;
  localMediaStream: MediaStream | undefined;
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
    ringingUsers: [],
    username: '',
    userImageUrl: '',
    videoClient: undefined,
    localMediaStream: undefined,
    loopbackMyVideo: false,
    cameraBackFacingMode: false,
  },
  ['username', 'userImageUrl'],
);
