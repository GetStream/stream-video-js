import { describe, expect, it } from 'vitest';
import {
  watchCallSessionEnded,
  watchCallSessionParticipantJoined,
  watchCallSessionParticipantLeft,
  watchCallSessionStarted,
} from '../sessions';
import { CallState } from '../../store';

describe('call.session events', () => {
  it('should update the call metadata when a session starts', () => {
    const state = new CallState();
    const handler = watchCallSessionStarted(state);
    handler({
      type: 'call.session_started',
      call: {
        cid: 'cid',
        // @ts-ignore
        session: {
          id: 'session-id',
        },
      },
    });

    expect(state.metadata).toEqual({
      cid: 'cid',
      session: {
        id: 'session-id',
      },
    });
  });

  it('should update the call metadata when a session ends', () => {
    const state = new CallState();
    const handler = watchCallSessionEnded(state);
    handler({
      type: 'call.session_ended',
      call: {
        cid: 'cid',
        // @ts-ignore
        session: {
          id: 'session-id',
        },
      },
    });
    expect(state.metadata).toEqual({
      cid: 'cid',
      session: {
        id: 'session-id',
      },
    });
  });

  it('should update the call metadata when a participant joins', () => {
    const state = new CallState();
    state.setMetadata({
      // @ts-ignore
      session: {
        participants: [],
        participants_count_by_role: {},
      },
    });
    const handler = watchCallSessionParticipantJoined(state);
    handler({
      type: 'call.session_participant_joined',
      // @ts-ignore
      user: {
        id: 'user-id',
        role: 'user',
      },
    });
    expect(state.metadata).toEqual({
      session: {
        participants: [
          {
            joined_at: expect.any(String),
            user: {
              id: 'user-id',
              role: 'user',
            },
          },
        ],
        participants_count_by_role: {
          user: 1,
        },
      },
    });
  });

  it('should update the call metadata when a participant leaves', () => {
    const state = new CallState();
    state.setMetadata({
      // @ts-ignore
      session: {
        participants: [
          {
            joined_at: '2021-01-01T00:00:00.000Z',
            // @ts-ignore
            user: {
              id: 'user-id',
              role: 'user',
            },
          },
        ],
        participants_count_by_role: {
          user: 1,
        },
      },
    });
    const handler = watchCallSessionParticipantLeft(state);
    handler({
      type: 'call.session_participant_left',
      // @ts-ignore
      user: {
        id: 'user-id',
        role: 'user',
      },
    });
    expect(state.metadata).toEqual({
      session: {
        participants: [],
        participants_count_by_role: {
          user: 0,
        },
      },
    });
  });
});
