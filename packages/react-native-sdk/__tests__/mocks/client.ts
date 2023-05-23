import { StreamVideoClient, User } from '@stream-io/video-client';

const apiKey = 'API_KEY';

const simulateUserConnection = (client: StreamVideoClient, user: User) => {
  // TODO: SG: write content for this function
};

export const mockClientWithUser = (user: User): StreamVideoClient => {
  const client = new StreamVideoClient(apiKey);
  simulateUserConnection(client, user);
  return client;
};
