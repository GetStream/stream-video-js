import { StreamVideoClient } from '@stream-io/video-client';
import createStoreContext from './createStoreContext';

interface AppGlobalStore {
  meetingCallID: string;
  ringingCallID: string;
  ringingUsers: string[];
  username: string;
  userImageUrl: string;
  videoClient: StreamVideoClient | undefined;
  isAudioMuted: boolean;
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
    loopbackMyVideo: false,
    isAudioMuted: false,
  },
  ['username', 'userImageUrl'],
);
