import { StreamVideoClient } from '@stream-io/video-client';
import { MediaStream } from 'react-native-webrtc';
import createStoreContext from './createStoreContext';

interface AppGlobalStore {
  meetingCallID: string;
  ringingCallID: string;
  ringingUsers: string[];
  username: string;
  userImageUrl: string;
  localMediaStream: MediaStream | undefined;
  videoClient: StreamVideoClient | undefined;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
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
    localMediaStream: undefined,
    videoClient: undefined,
    loopbackMyVideo: false,
    isAudioMuted: false,
    isVideoMuted: false,
  },
  ['username', 'userImageUrl'],
);
