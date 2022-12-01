import { describe, it, vi, beforeEach, expect } from 'vitest';
import { StreamVideoClient } from '../StreamVideoClient';
import { createSocketConnection } from '../ws';
import { StreamVideoParticipant } from '../rtc/types';
import { mock } from 'vitest-mock-extended';

describe('StreamVideoClient', () => {
  let client: StreamVideoClient;
  const getPinnedParticipants = () =>
    client.writeableStateStore.getCurrentValue(
      client.writeableStateStore.pinnedParticipants$,
    );

  beforeEach(() => {
    vi.mock('../rpc/createClient', () => {
      return {
        createCoordinatorClient: vi.fn(),
        withHeaders: vi.fn(),
      };
    });
    vi.mock('../ws/connection', () => {
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

  it('does not pin a participant ', async () => {
    client.setParticipantIsPinned('non-existing-essionid', true);

    const participantsInStore = client.writeableStateStore.getCurrentValue(
      client.writeableStateStore.pinnedParticipants$,
    );
    expect(participantsInStore).toHaveLength(0);
  });

  it('does pin one participant which populates pinnedParticipants', async () => {
    const p1 = mock<StreamVideoParticipant>({
      isPinned: false,
      sessionId: '123abc',
    });
    const p2 = mock<StreamVideoParticipant>({
      isPinned: false,
      sessionId: '456def',
    });
    let pinnedParticipants = getPinnedParticipants();
    expect(pinnedParticipants).toHaveLength(0);

    client.writeableStateStore.setCurrentValue(
      client.writeableStateStore.activeCallAllParticipantsSubject,
      [p1, p2],
    );

    client.setParticipantIsPinned(p2.sessionId, true);

    pinnedParticipants = getPinnedParticipants();
    expect(pinnedParticipants).toHaveLength(1);
    expect(pinnedParticipants[0].sessionId).toEqual(p2.sessionId);
  });
});
