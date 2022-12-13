import { MemberInput } from '@stream-io/video-client';
import createStoreContext from './createStoreContext';

interface AppGlobalStore {
  meetingCallID: string;
  ringingCallID: string;
  ringingUsers: MemberInput[];
  username: string;
  userImageUrl: string;
  loopbackMyVideo: boolean;
  appMode: 'Meeting' | 'Ringing' | 'None';
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
    loopbackMyVideo: false,
    appMode: 'None',
  },
  ['username', 'userImageUrl', 'appMode'],
);
