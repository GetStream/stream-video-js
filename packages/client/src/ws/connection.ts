import { StreamWebSocketClient } from './StreamWebSocketClient';
import type { StreamWSClient } from './types';
import { CreateUserRequest } from '../gen/video_coordinator_rpc/coordinator_service';

export const createSocketConnection = async (
  endpoint: string,
  token: string,
  user: CreateUserRequest,
): Promise<StreamWSClient> => {
  const wsClient = new StreamWebSocketClient(endpoint, token, user);
  await wsClient.ensureAuthenticated();
  console.log('Authenticated!');

  return wsClient;
};
