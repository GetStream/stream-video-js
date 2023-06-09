export type LocalAttachmentType = Record<string, unknown>;
export type LocalChannelType = Record<string, unknown>;
export type LocalCommandType = string;
export type LocalEventType = Record<string, unknown>;
export type LocalMessageType = Record<string, unknown>;
export type LocalReactionType = Record<string, unknown>;
export type LocalUserType = Record<string, unknown>;

export type UserType = {
  id: string;
  name: string;
  imageUrl: string;
  custom: {
    token: string;
  };
};

export type StreamChatGenerics = {
  attachmentType: LocalAttachmentType;
  channelType: LocalChannelType;
  commandType: LocalCommandType;
  eventType: LocalEventType;
  messageType: LocalMessageType;
  reactionType: LocalReactionType;
  userType: LocalUserType;
};

export type NavigationStackParamsList = {
  ChannelListScreen: undefined;
  ChannelScreen: undefined;
  ThreadScreen: undefined;
  IncomingCallScreen: undefined;
  OutgoingCallScreen: undefined;
  ActiveCallScreen: undefined;
};

export type VideoProps = {
  user: UserType;
  token: string;
};
