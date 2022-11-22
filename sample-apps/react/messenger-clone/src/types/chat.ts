import type { UR, LiteralStringForUnion } from 'stream-chat';
import { UserInput } from '@stream-io/video-client';

export type AttachmentType = UR;
export type ChannelType = UR & { subtitle?: string };
export type CommandType = LiteralStringForUnion;
export type EventType = UR;
export type MessageType = UR;
export type ReactionType = UR;
export type UserType = UR & { id: string } & UserInput;

export type StreamChatType = {
  attachmentType: AttachmentType;
  channelType: ChannelType;
  commandType: CommandType;
  eventType: EventType;
  messageType: MessageType;
  reactionType: ReactionType;
  userType: UserType;
};
