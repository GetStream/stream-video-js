import { decodeBase64, UserResponse } from 'stream-chat';

// import type { StreamChatType } from '../types/chat';

// <StreamChatType>
export const userFromToken = (token?: string): UserResponse | null => {
  if (!token) return null;
  const fragments = token.split('.');
  if (fragments.length !== 3) {
    return null;
  }
  const [, b64Payload] = fragments;
  const payload = decodeBase64(b64Payload);
  const { user_id, ...userData } = JSON.parse(payload);

  return {
    ...userData,
    id: user_id,
    teams: [],
  };
};
