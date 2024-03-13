import createStoreContext from './createStoreContext';

export type AppMode = 'Meeting' | 'Call' | 'Audio-Room' | 'LiveStream' | 'None';
export type AppEnvironment = 'pronto' | 'demo' | 'None';

type AppGlobalStore = {
  userId: string;
  userImageUrl?: string;
  userName: string;
  appMode: AppMode;
  appEnvironment: AppEnvironment;
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
    appEnvironment: 'None',
    chatLabelNoted: false,
  },
  ['appEnvironment', 'userId', 'userName', 'userImageUrl', 'appMode'],
);
