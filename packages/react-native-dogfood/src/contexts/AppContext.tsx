import createStoreContext from './createStoreContext';

type AppGlobalStore = {
  username: string;
  userImageUrl?: string;
  appMode: 'Meeting' | 'Call' | 'None';
};

export const {
  Provider: AppGlobalContextProvider,
  useStoreValue: useAppGlobalStoreValue,
  useStoreSetState: useAppGlobalStoreSetState,
} = createStoreContext<AppGlobalStore>(
  {
    username: '',
    userImageUrl: '',
    appMode: 'None',
  },
  ['username', 'userImageUrl', 'appMode'],
);
