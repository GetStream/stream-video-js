import createStoreContext from './createStoreContext';

interface AppGlobalStore {
  meetingCallID: string;
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
    username: '',
    userImageUrl: '',
    loopbackMyVideo: false,
    appMode: 'None',
  },
  ['username', 'userImageUrl', 'appMode'],
);
