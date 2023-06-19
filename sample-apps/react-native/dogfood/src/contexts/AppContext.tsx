import createStoreContext from './createStoreContext';

export type AppMode = 'Meeting' | 'Call' | 'None';

type AppGlobalStore = {
  username: string;
  userImageUrl?: string;
  appMode: AppMode;
  chatLabelNoted?: boolean;
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
    chatLabelNoted: false,
  },
  ['username', 'userImageUrl', 'appMode'],
);
