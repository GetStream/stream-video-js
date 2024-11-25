import { REACT_NATIVE_DOGFOOD_APP_ENVIRONMENT } from '@env';
import createStoreContext from './createStoreContext';

export type AppMode = 'Meeting' | 'Call' | 'Audio-Room' | 'LiveStream' | 'None';
export type ThemeMode = 'dark' | 'light';

type AppGlobalStore = {
  apiKey: string;
  userId: string;
  userImageUrl?: string;
  userName: string;
  appMode: AppMode;
  appEnvironment: AppEnvironment;
  chatLabelNoted?: boolean;
  themeMode: ThemeMode;
  useLocalSfu?: boolean;
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
    appEnvironment:
      (REACT_NATIVE_DOGFOOD_APP_ENVIRONMENT as AppEnvironment) || 'demo',
    chatLabelNoted: false,
    themeMode: 'dark',
    useLocalSfu: false,
  },
  [
    'apiKey',
    'appEnvironment',
    'userId',
    'userName',
    'userImageUrl',
    'appMode',
    'themeMode',
  ],
);
