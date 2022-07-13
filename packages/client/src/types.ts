export type UserIdentifier = {
  userId: string;
  token: string | (() => string);
};

export type StreamVideoClientOptions = {
  baseUrl?: string;
  sendJson?: boolean;
  user: UserIdentifier;
};
