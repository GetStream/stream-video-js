import { describe, expect, it, vi } from 'vitest';
import { Call } from '../../Call';
import { Dispatcher } from '../../rtc';
import { CallState } from '../../store';
import {
  watchConnectionQualityChanged,
  watchLiveEnded,
  watchParticipantCountChanged,
  watchPinsUpdated,
} from '../internal';
import {
  ConnectionQuality,
  ErrorCode,
} from '../../gen/video/sfu/models/models';

describe('internal events', () => {
  it('handles connectionQualityChanged', () => {
    const state = new CallState();
    const dispatcher = new Dispatcher();
    state.setParticipants([
      // @ts-expect-error incomplete data
      { sessionId: 'session-1', connectionQuality: ConnectionQuality.POOR },
    ]);

    watchConnectionQualityChanged(dispatcher, state);

    dispatcher.dispatch({
      eventPayload: {
        oneofKind: 'connectionQualityChanged',
        // @ts-expect-error incomplete data
        connectionQualityChanged: {
          connectionQualityUpdates: [
            {
              sessionId: 'session-1',
              connectionQuality: ConnectionQuality.EXCELLENT,
            },
          ],
        },
      },
    });
    expect(state.participants).toEqual([
      {
        sessionId: 'session-1',
        connectionQuality: ConnectionQuality.EXCELLENT,
      },
    ]);
  });

  it('handles healthCheckResponse', () => {
    const state = new CallState();
    const dispatcher = new Dispatcher();
    state.setParticipantCount(0);
    state.setAnonymousParticipantCount(0);

    watchParticipantCountChanged(dispatcher, state);

    dispatcher.dispatch({
      eventPayload: {
        oneofKind: 'healthCheckResponse',
        // @ts-expect-error incomplete data
        healthCheckResponse: { participantCount: { total: 5, anonymous: 2 } },
      },
    });
    expect(state.participantCount).toBe(5);
    expect(state.anonymousParticipantCount).toBe(2);
  });

  it('handles liveEnded', () => {
    const dispatcher = new Dispatcher();

    const state = new CallState();
    state.setBackstage(false);

    const call = {
      permissionsContext: { hasPermission: () => false },
      leave: vi.fn().mockResolvedValue(undefined),
      logger: vi.fn(),
      state,
    } as unknown as Call;

    watchLiveEnded(dispatcher, call);

    dispatcher.dispatch({
      eventPayload: {
        oneofKind: 'error',
        // @ts-expect-error incomplete data
        error: { code: ErrorCode.LIVE_ENDED },
      },
    });
    expect(call.leave).toHaveBeenCalled();
    expect(call.state.backstage).toBe(true);
  });

  it('handles liveEnded when user has permission to stay in backstage', () => {
    const dispatcher = new Dispatcher();
    const call = {
      permissionsContext: { hasPermission: () => true },
      leave: vi.fn().mockResolvedValue(undefined),
      logger: vi.fn(),
    } as unknown as Call;

    watchLiveEnded(dispatcher, call);

    dispatcher.dispatch({
      eventPayload: {
        oneofKind: 'error',
        // @ts-expect-error incomplete data
        error: { code: ErrorCode.LIVE_ENDED },
      },
    });
    expect(call.leave).not.toHaveBeenCalled();
  });

  it('handles pinUpdated', () => {
    const state = new CallState();
    state.setParticipants([
      // @ts-expect-error incomplete data
      { userId: 'u1', sessionId: 'session-1', pin: { isLocalPin: false } },
      // @ts-expect-error incomplete data
      { userId: 'u2', sessionId: 'session-2', pin: { isLocalPin: false } },
    ]);
    const update = watchPinsUpdated(state);
    update({ pins: [{ userId: 'u1', sessionId: 'session-1' }] });
    expect(state.participants).toEqual([
      {
        userId: 'u1',
        sessionId: 'session-1',
        pin: { isLocalPin: false, pinnedAt: expect.any(Number) },
      },
      { userId: 'u2', sessionId: 'session-2', pin: undefined },
    ]);
  });
});
