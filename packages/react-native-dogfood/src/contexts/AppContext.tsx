import { StreamVideoClient } from '@stream-io/video-client';
import createStoreContext from './createStoreContext';

interface AppGlobalStore {
  username: string;
  userImageUrl?: string;
  loopbackMyVideo: boolean;
  callId: string;
  callType: string;
  appMode: 'Meeting' | 'Call' | 'Guest' | 'None';
  client: StreamVideoClient | undefined;
}

export const {
  Provider: AppGlobalContextProvider,
  useStoreValue: useAppGlobalStoreValue,
  useStoreSetState: useAppGlobalStoreSetState,
} = createStoreContext<AppGlobalStore>(
  {
    username: '',
    userImageUrl: '',
    loopbackMyVideo: false,
    appMode: 'None',
    callId: '',
    callType: 'default',
    client: undefined,
  },
  ['username', 'userImageUrl', 'appMode'],
);
