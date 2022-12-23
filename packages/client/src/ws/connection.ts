import { UserInput } from '../gen/video/coordinator/user_v1/user';
import { StreamWebSocketClient } from './StreamWebSocketClient';

export const createSocketConnection = async (
  endpoint: string,
  apiKey: string,
  token: string,
  user: UserInput,
): Promise<StreamWebSocketClient> => {
  const wsClient = new StreamWebSocketClient(endpoint, apiKey, token, user);
  await wsClient.connect();

  return wsClient;
};
