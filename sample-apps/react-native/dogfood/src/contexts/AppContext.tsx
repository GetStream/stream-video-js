import createStoreContext from './createStoreContext';

export type AppMode =
  'Meeting' | 'Call' | 'Audio-Room' | 'LiveStream' | 'TestRecording' | 'None';
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
  devMode?: boolean;
  /** Passphrase or hex keys for end-to-end encryption; empty means E2EE off. */
  e2eeKeyInput: string;
  coordinatorBaseUrl?: string;
  disableRingStatePolling?: boolean;
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
    appEnvironment: 'demo',
    chatLabelNoted: false,
    themeMode: 'dark',
    useLocalSfu: false,
    localIpAddress: '127.0.0.1',
    devMode: false,
    e2eeKeyInput: '',
    coordinatorBaseUrl: '',
    disableRingStatePolling: false,
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
    'devMode',
    'e2eeKeyInput',
    'coordinatorBaseUrl',
    'disableRingStatePolling',
  ],
);
