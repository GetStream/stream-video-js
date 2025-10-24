export type GuestMeetingScreenParams = {
  guestUserId: string;
  callId: string;
  mode: 'guest' | 'anonymous';
};

export type LoginStackParamList = {
  LoginScreen: undefined;
};

export type MeetingStackParamList = {
  JoinMeetingScreen: undefined;
  MeetingScreen: { callId: string };
  GuestModeScreen: { callId: string };
  GuestMeetingScreen: GuestMeetingScreenParams;
  ChatScreen: { callId: string };
};

export type CallStackParamList = {
  JoinCallScreen: undefined;
};

export type LiveStreamParamList = {
  LiveStreamChoose: undefined;
  JoinLiveStream: { mode: 'host' | 'viewer'; scannedCallId?: string };
  HostLiveStream: { callId: string };
  ViewerLiveStream: { callId: string };
  QRScanner: { onScan: (callId: string) => void };
};

export type RTMPParamList = {
  RTMPBroadcast: undefined;
};

export type AppModeParamList = {
  ChooseAppModeScreen: undefined;
};

export type RootStackParamList = {
  Meeting: undefined;
  Call: undefined;
  AudioRoom: undefined;
  ChooseAppMode: undefined;
  LiveStream: undefined;
  RTMP: undefined;
};

export type ScreenTypes =
  | 'lobby'
  | 'error-join'
  | 'error-leave'
  | 'active-call'
  | 'loading';
