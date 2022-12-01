import { describe, it, vi, beforeEach, expect } from 'vitest';
import { StreamVideoClient } from './StreamVideoClient';
import { createSocketConnection } from './ws';

describe('StreamVideoClient', () => {
  let client: StreamVideoClient;

  beforeEach(() => {
    vi.mock('./rpc/createClient', () => {
      return {
        createCoordinatorClient: vi.fn(),
        withHeaders: vi.fn(),
      };
    });
    vi.mock('./ws/connection', () => {
      return {
        createSocketConnection: vi.fn(),
      };
    });
    client = new StreamVideoClient('123', {
      token: 'abc',
    });
  });

  it('should connect', async () => {
    const user = {
      id: 'marcelo',
      name: 'marcelo',
      role: 'admin',
      teams: ['team-1, team-2'],
      imageUrl: '/profile.png',
      customJson: new Uint8Array(),
    };
    const apiKey = '123';
    const token = 'abc';
    await client.connect(apiKey, token, user);

    expect(createSocketConnection).toHaveBeenCalledWith(
      expect.anything(),
      apiKey,
      token,
      user,
    );
  });
});
