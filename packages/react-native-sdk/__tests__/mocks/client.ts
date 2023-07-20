import { OwnUserResponse, StreamVideoClient } from '@stream-io/video-client';

const apiKey = 'API_KEY';
const simulateUserConnection = (
  client: StreamVideoClient,
  user: OwnUserResponse,
) => {
  client.streamClient._setUser(user);
};

export const mockClientWithUser = (
  user: Partial<OwnUserResponse> = {},
): StreamVideoClient => {
  const client = new StreamVideoClient(apiKey);
  simulateUserConnection(client, {
    created_at: '',
    custom: {},
    devices: [
      {
        id: '123',
        created_at: '',
        push_provider: '',
      },
    ],
    role: '',
    teams: ['teamA'],
    updated_at: '',
    id: 'test-user-id',
    ...user,
  });
  return client;
};
