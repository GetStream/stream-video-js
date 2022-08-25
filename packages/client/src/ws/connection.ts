import { UserInput } from '../gen/user_v1/user';
import { StreamWebSocketClient } from './StreamWebSocketClient';
import type { StreamWSClient } from './types';

export const createSocketConnection = async (
  endpoint: string,
  apiKey: string,
  token: string,
  user: UserInput,
): Promise<StreamWSClient> => {
  const wsClient = new StreamWebSocketClient(endpoint, apiKey, token, user);
  await wsClient.ensureAuthenticated();

  return wsClient;
};
