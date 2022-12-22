import {UserInput} from '@stream-io/video-client';

export type LocalAttachmentType = Record<string, unknown>;
export type LocalChannelType = Record<string, unknown>;
export type LocalCommandType = string;
export type LocalEventType = Record<string, unknown>;
export type LocalMessageType = Record<string, unknown>;
export type LocalReactionType = Record<string, unknown>;
export type LocalUserType = Record<string, unknown> & {id: string} & UserInput;

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
  user: StreamChatGenerics['userType'];
  token: string;
};
