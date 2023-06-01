import createStoreContext from './createStoreContext';

interface AppGlobalStore {
  username: string;
  userImageUrl?: string;
  loopbackMyVideo: boolean;
  appMode: 'Meeting' | 'Call' | 'None';
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
  },
  ['username', 'userImageUrl', 'appMode'],
);
