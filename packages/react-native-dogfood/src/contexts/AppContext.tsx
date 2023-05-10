import createStoreContext from './createStoreContext';

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
    callId: '',
    callType: 'default',
  },
  ['username', 'userImageUrl', 'appMode'],
);
