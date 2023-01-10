import {decodeBase64, UserResponse} from 'stream-chat';
import type {StreamChatGenerics} from '../types';

export const userFromToken = (
  token?: string,
): UserResponse<StreamChatGenerics> | undefined => {
  if (!token) {
    return;
  }
  const fragments = token.split('.');
  if (fragments.length !== 3) {
    return;
  }
  const b64Payload = fragments[1];
  const payload = decodeBase64(b64Payload);
  const {user_id, ...userData} = JSON.parse(payload);

  return {
    ...userData,
    id: user_id,
    teams: [],
  };
};
