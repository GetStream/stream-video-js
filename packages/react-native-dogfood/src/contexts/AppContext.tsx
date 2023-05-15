import { StreamVideoClient } from '@stream-io/video-client';
import createStoreContext from './createStoreContext';

interface AppGlobalStore {
  username?: string;
  userImageUrl?: string;
  loopbackMyVideo: boolean;
  callId: string;
  callType: string;
  appMode: 'Meeting' | 'Ringing' | 'None';
  client: StreamVideoClient | undefined;
}

export const {
  Provider: AppGlobalContextProvider,
  useStoreValue: useAppGlobalStoreValue,
  useStoreSetState: useAppGlobalStoreSetState,
} = createStoreContext<AppGlobalStore>(
  {
    username: undefined,
    userImageUrl: '',
    loopbackMyVideo: false,
    appMode: 'Meeting',
    callId: '',
    callType: 'default',
    client: undefined,
  },
  ['username', 'userImageUrl', 'appMode'],
);
