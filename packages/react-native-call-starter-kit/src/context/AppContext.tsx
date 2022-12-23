import createStoreContext from './createStoreContext';

interface AppGlobalStore {
  userId: string;
  userToken: string;
  userImageUrl: string;
}

export const {
  Provider: AppGlobalContextProvider,
  useStoreValue: useAppGlobalStoreValue,
  useStoreSetState: useAppGlobalStoreSetState,
} = createStoreContext<AppGlobalStore>(
  {
    userId: '',
    userToken: '',
    userImageUrl: '',
  },
  ['userId', 'userImageUrl', 'userToken'],
);
