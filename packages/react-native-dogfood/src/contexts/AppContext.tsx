import createStoreContext from './createStoreContext';
import { v4 as uuidv4 } from 'uuid';

interface AppGlobalStore {
  username: string;
  userImageUrl?: string;
  loopbackMyVideo: boolean;
  callId: string;
  callType: string;
  appMode: 'Meeting' | 'Ringing' | 'None';
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
    callId: uuidv4().toLowerCase(),
    callType: 'default',
  },
  ['username', 'userImageUrl', 'appMode'],
);
