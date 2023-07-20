import createStoreContext from './createStoreContext';

export type AppMode = 'Meeting' | 'Call' | 'Audio-Room' | 'None';

type AppGlobalStore = {
  userId: string;
  userImageUrl?: string;
  userName: string;
  appMode: AppMode;
  chatLabelNoted?: boolean;
};

export const {
  Provider: AppGlobalContextProvider,
  useStoreValue: useAppGlobalStoreValue,
  useStoreSetState: useAppGlobalStoreSetState,
} = createStoreContext<AppGlobalStore>(
  {
    userId: '',
    userImageUrl: '',
    userName: '',
    appMode: 'None',
    chatLabelNoted: false,
  },
  ['userId', 'userName', 'userImageUrl', 'appMode'],
);
