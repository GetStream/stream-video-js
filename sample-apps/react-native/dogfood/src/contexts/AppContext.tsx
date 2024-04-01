import createStoreContext from './createStoreContext';

export type AppMode = 'Meeting' | 'Call' | 'Audio-Room' | 'LiveStream' | 'None';
export type AppEnvironment = 'pronto' | 'demo' | 'None';

type AppGlobalStore = {
  apiKey: string;
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
    apiKey: '',
    userId: '',
    userImageUrl: '',
    userName: '',
    appMode: 'None',
    appEnvironment: 'None',
    chatLabelNoted: false,
  },
  ['apiKey', 'appEnvironment', 'userId', 'userName', 'userImageUrl', 'appMode'],
);
