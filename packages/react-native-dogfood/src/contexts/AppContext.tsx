import { MediaStream } from 'react-native-webrtc';
import createStoreContext from './createStoreContext';

interface AppGlobalStore {
  meetingCallID: string;
  ringingCallID: string;
  ringingUsers: string[];
  username: string;
  userImageUrl: string;
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
    localMediaStream: undefined,
    loopbackMyVideo: false,
    cameraBackFacingMode: false,
  },
  ['username', 'userImageUrl'],
);
