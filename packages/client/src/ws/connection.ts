import { StreamWebSocketClient } from './StreamWebSocketClient';
import { UserRequest } from '../gen/video_models/models';
import type { StreamWSClient } from './types';

export const createSocketConnection = async (
  endpoint: string,
  token: string,
  user: UserRequest,
): Promise<StreamWSClient> => {
  const wsClient = new StreamWebSocketClient(endpoint, token, user);
  await wsClient.ensureAuthenticated();
  console.log('Authenticated!');

  // @ts-ignore
  return wsClient;
};
