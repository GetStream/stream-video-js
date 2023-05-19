export type NavigationStackParamsList = {
  JoinMeetingScreen: undefined;
  MeetingScreen: {callId: string};
};

export type UserType = {
  id: string;
  name: string;
  imageUrl: string;
  custom: {
    token: string;
  };
};

export type ScreenTypes =
  | 'lobby'
  | 'error-join'
  | 'error-leave'
  | 'loading'
  | 'active-call';
