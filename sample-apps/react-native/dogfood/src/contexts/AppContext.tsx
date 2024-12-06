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
  callId?: string;
  appEnvironment: AppEnvironment;
  chatLabelNoted?: boolean;
  themeMode: ThemeMode;
  localIpAddress: string;
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
    callId: Math.random().toString(36).substring(6),
    appEnvironment:
      (REACT_NATIVE_DOGFOOD_APP_ENVIRONMENT as AppEnvironment) || 'demo',
    chatLabelNoted: false,
    themeMode: 'dark',
    useLocalSfu: false,
    localIpAddress: '127.0.0.1',
  },
  [
    'apiKey',
    'appEnvironment',
    'callId',
    'userId',
    'userName',
    'userImageUrl',
    'appMode',
    'themeMode',
  ],
);
