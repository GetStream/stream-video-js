import { describe, expect, it, vi } from 'vitest';
import { fromPartial } from '@total-typescript/shoehorn';
import { Call } from '../../Call';
import { Dispatcher } from '../../rtc';
import { CallState } from '../../store';
import { noopComparator } from '../../sorting';
import {
  watchConnectionQualityChanged,
  watchInboundStateNotification,
  watchLiveEnded,
  watchParticipantCountChanged,
  watchPinsUpdated,
} from '../internal';
import {
  ConnectionQuality,
  ErrorCode,
  TrackType,
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
        connectionQualityChanged: {
          connectionQualityUpdates: [
            fromPartial({
              sessionId: 'session-1',
              connectionQuality: ConnectionQuality.EXCELLENT,
            }),
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
      state: new CallState(),
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
      fromPartial({
        userId: 'u1',
        sessionId: 'session-1',
        publishedTracks: [],
      }),
      fromPartial({
        userId: 'u2',
        sessionId: 'session-2',
        publishedTracks: [],
      }),
    ]);

    watchPinsUpdated(state)({
      pins: [{ userId: 'u1', sessionId: 'session-1' }],
    });

    expect(state.participants).toEqual([
      {
        userId: 'u1',
        sessionId: 'session-1',
        pin: { isLocalPin: false, pinnedAt: expect.any(Number) },
        publishedTracks: [],
      },
      {
        userId: 'u2',
        sessionId: 'session-2',
        pin: undefined,
        publishedTracks: [],
      },
    ]);
  });

  it('handles InboundStateNotification', () => {
    const state = new CallState();
    state.setSortParticipantsBy(noopComparator());
    state.setParticipants([
      // @ts-expect-error incomplete data
      { sessionId: 'session-1' },
      // @ts-expect-error incomplete data
      { sessionId: 'session-2' },
    ]);

    const update = watchInboundStateNotification(state);
    update({
      inboundVideoStates: [
        {
          userId: '1',
          sessionId: 'session-1',
          trackType: TrackType.VIDEO,
          paused: true,
        },
        {
          userId: '2',
          sessionId: 'session-2',
          trackType: TrackType.VIDEO,
          paused: false,
        },
      ],
    });
    expect(
      state.findParticipantBySessionId('session-1')?.pausedTracks,
    ).toContain(TrackType.VIDEO);
    expect(
      state.findParticipantBySessionId('session-2')?.pausedTracks,
    ).not.toContain(TrackType.VIDEO);

    update({
      inboundVideoStates: [
        {
          userId: '2',
          sessionId: 'session-2',
          trackType: TrackType.VIDEO,
          paused: true,
        },
      ],
    });
    expect(
      state.findParticipantBySessionId('session-1')?.pausedTracks,
    ).toContain(TrackType.VIDEO);
    expect(
      state.findParticipantBySessionId('session-2')?.pausedTracks,
    ).toContain(TrackType.VIDEO);

    update({
      inboundVideoStates: [
        {
          userId: '1',
          sessionId: 'session-1',
          trackType: TrackType.VIDEO,
          paused: false,
        },
        {
          userId: '2',
          sessionId: 'session-2',
          trackType: TrackType.VIDEO,
          paused: false,
        },
      ],
    });
    expect(
      state.findParticipantBySessionId('session-1')?.pausedTracks,
    ).not.toContain(TrackType.VIDEO);
    expect(
      state.findParticipantBySessionId('session-2')?.pausedTracks,
    ).not.toContain(TrackType.VIDEO);
  });
});
