import {UserInput} from '@stream-io/video-client';

export type UserType = {
  id: string;
  name: string;
  imageUrl: string;
  token: string;
};

export type NavigationStackParamsList = {
  CallLobbyScreen: undefined;
  ActiveCallScreen: undefined;
  CallParticipantsInfoScreen: undefined;
};

export type LocalUserType = UserInput;

export type VideoProps = {
  user?: UserType;
  token?: string;
};
