import {
  nowNs,
  OwnUserResponse,
  StreamVideoClient,
} from '@stream-io/video-client';

const apiKey = 'API_KEY';
const simulateUserConnection = (
  client: StreamVideoClient,
  user: Partial<OwnUserResponse>,
) => {
  client.streamClient._setUser(user as OwnUserResponse);
};

export const mockClientWithUser = (
  user: Partial<OwnUserResponse> = {},
): StreamVideoClient => {
  const client = new StreamVideoClient(apiKey);
  simulateUserConnection(client, {
    created_at: nowNs(),
    custom: {},
    devices: [
      {
        id: '123',
        created_at: nowNs(),
        push_provider: '',
        user_id: '',
      },
    ],
    role: '',
    teams: ['teamA'],
    updated_at: nowNs(),
    id: 'test-user-id',
    ...user,
  });
  return client;
};
