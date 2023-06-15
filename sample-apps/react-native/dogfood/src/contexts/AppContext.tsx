import createStoreContext from './createStoreContext';

export type AppMode = 'Meeting' | 'Call' | 'None';

type AppGlobalStore = {
  username: string;
  userImageUrl?: string;
  loopbackMyVideo: boolean;
  appMode: AppMode;
};

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
