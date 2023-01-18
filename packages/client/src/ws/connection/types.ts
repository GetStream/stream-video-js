export type UR = Record<string, unknown>;

export type User = {
  id: string;
  anon?: boolean;
  name?: string;
  role?: string;
  teams?: string[];
  username?: string;
};

export type UserResponse = User & {
  banned?: boolean;
  created_at?: string;
  deactivated_at?: string;
  deleted_at?: string;
  // language?: TranslationLanguages | '';
  last_active?: string;
  online?: boolean;
  // push_notifications?: PushNotificationSettings;
  revoke_tokens_issued_before?: string;
  shadow_banned?: boolean;
  updated_at?: string;
};

export type OwnUserBase = {
  // channel_mutes: ChannelMute<StreamChatGenerics>[];
  // devices: Device<StreamChatGenerics>[];
  // mutes: Mute<StreamChatGenerics>[];
  total_unread_count: number;
  unread_channels: number;
  unread_count: number;
  invisible?: boolean;
  roles?: string[];
};

export type OwnUserResponse = UserResponse & OwnUserBase;

export type ConnectionOpen = {
  connection_id: string;
  cid?: string;
  created_at?: string;
  me?: OwnUserResponse;
  type?: string;
};

export type ConnectAPIResponse = Promise<void | ConnectionOpen>;

export type LogLevel = 'info' | 'error' | 'warn';
