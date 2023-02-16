export type UserType = {
  id: string;
  name: string;
  imageUrl: string;
  token: string;
};

export type NavigationStackParamsList = {
  CallLobbyScreen: {callId: string};
  ActiveCallScreen: undefined;
  CallParticipantsInfoScreen: undefined;
  JoinMeetingScreen: undefined;
};

export type VideoProps = {
  user?: UserType;
  token?: string;
};
