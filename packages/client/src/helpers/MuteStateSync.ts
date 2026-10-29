import { TrackType } from '../gen/video/sfu/models/models';
import { CallingState, CallState } from '../store';
import type { StreamSfuClient } from '../StreamSfuClient';
import { withoutConcurrency } from './concurrency';

/**
 * Reports the mute state of the local tracks to the SFU.
 *
 * While the call isn't JOINED, the SFU may be unreachable, and a request
 * would retry until its SFU client closes, losing the update. The latest
 * state of each track type is kept instead, and sent by `flush()` once the
 * call is JOINED again. The kept state belongs to the session it was
 * reported in: a new session (a rejoin, a new join) drops it, as nothing
 * is published there yet.
 */
export class MuteStateSync {
  private readonly cid: string;
  private readonly state: CallState;
  private readonly getSfuClient: () => StreamSfuClient | undefined;
  private readonly isPublishing: (trackType: TrackType) => boolean;
  private pending = new Map<TrackType, boolean>();
  private pendingSessionId: string | undefined;

  constructor(
    cid: string,
    state: CallState,
    getSfuClient: () => StreamSfuClient | undefined,
    isPublishing: (trackType: TrackType) => boolean,
  ) {
    this.cid = cid;
    this.state = state;
    this.getSfuClient = getSfuClient;
    this.isPublishing = isPublishing;
  }

  /**
   * Sends the mute state of the given track types, or keeps it for
   * `flush()` while the call isn't JOINED.
   */
  notify = async (muted: boolean, ...trackTypes: TrackType[]) => {
    const sessionId = this.getSfuClient()?.sessionId;
    if (!sessionId) return;
    this.dropPendingOfOtherSessions(sessionId);
    if (this.state.callingState !== CallingState.JOINED) {
      this.pendingSessionId = sessionId;
      for (const trackType of trackTypes) {
        this.pending.set(trackType, muted);
      }
      return;
    }
    for (const trackType of trackTypes) {
      this.pending.delete(trackType);
    }
    await this.send(muted, trackTypes);
  };

  /**
   * Sends the kept mute state of the given track types, or of all of them
   * when none are given. A track type kept as unmuted is sent as muted if
   * it is no longer published. Kept for later if the call isn't JOINED.
   */
  flush = async (...trackTypes: TrackType[]) => {
    if (this.state.callingState !== CallingState.JOINED) return;
    const sessionId = this.getSfuClient()?.sessionId;
    if (!sessionId) return;
    this.dropPendingOfOtherSessions(sessionId);

    const muted: TrackType[] = [];
    const unmuted: TrackType[] = [];
    const types = trackTypes.length > 0 ? trackTypes : [...this.pending.keys()];
    for (const trackType of types) {
      const value = this.pending.get(trackType);
      if (value === undefined) continue;
      this.pending.delete(trackType);
      if (value || !this.isPublishing(trackType)) {
        muted.push(trackType);
      } else {
        unmuted.push(trackType);
      }
    }
    await Promise.all([this.send(true, muted), this.send(false, unmuted)]);
  };

  private dropPendingOfOtherSessions = (sessionId: string) => {
    if (this.pendingSessionId === sessionId) return;
    this.pending.clear();
    this.pendingSessionId = undefined;
  };

  private send = async (muted: boolean, trackTypes: TrackType[]) => {
    if (trackTypes.length === 0) return;
    const key = `muteState.${this.cid}.${trackTypes.join('-')}`;
    await withoutConcurrency(key, async () => {
      const sfuClient = this.getSfuClient();
      if (!sfuClient) return;
      await sfuClient.updateMuteStates(
        trackTypes.map((trackType) => ({ trackType, muted })),
      );
    });
  };
}
