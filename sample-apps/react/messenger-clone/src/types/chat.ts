import type { LiteralStringForUnion, UR } from 'stream-chat';
import { User } from '@stream-io/video-react-sdk';

export type AttachmentType = UR;
export type ChannelType = UR & { subtitle?: string };
export type CommandType = LiteralStringForUnion;
export type EventType = UR;
export type MessageType = UR;
export type ReactionType = UR;
export type UserType = Omit<User, 'type'>;

export type StreamChatType = {
  attachmentType: AttachmentType;
  channelType: ChannelType;
  commandType: CommandType;
  eventType: EventType;
  messageType: MessageType;
  reactionType: ReactionType;
  userType: UserType;
};
