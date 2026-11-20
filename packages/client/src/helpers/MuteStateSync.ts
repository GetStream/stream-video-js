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
 * is published there yet. A state whose request fails, as its SFU client
 * closed, is kept the same way, unless a newer one replaced it.
 *
 * Requests are sent one at a time, in the order the states were reported,
 * and only to the session they were reported in.
 */
export class MuteStateSync {
  private readonly lockKey: string;
  private readonly state: CallState;
  private readonly getSfuClient: () => StreamSfuClient | undefined;
  private readonly isPublishing: (trackType: TrackType) => boolean;
  private pending = new Map<TrackType, boolean>();
  private pendingSessionId: string | undefined;
  private revisions = new Map<TrackType, number>();

  constructor(
    cid: string,
    state: CallState,
    getSfuClient: () => StreamSfuClient | undefined,
    isPublishing: (trackType: TrackType) => boolean,
  ) {
    this.lockKey = `muteState.${cid}`;
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
    for (const trackType of trackTypes) {
      this.revisions.set(trackType, (this.revisions.get(trackType) ?? 0) + 1);
    }
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

  /**
   * Keeps the given mute state for `flush()`, if it still belongs to the
   * current session. Returns the kept track types.
   */
  private requeue = (
    sessionId: string,
    muted: boolean,
    trackTypes: TrackType[],
  ) => {
    if (this.getSfuClient()?.sessionId !== sessionId) return [];
    this.dropPendingOfOtherSessions(sessionId);
    this.pendingSessionId = sessionId;
    for (const trackType of trackTypes) {
      this.pending.set(trackType, muted);
    }
    return trackTypes;
  };

  private send = async (muted: boolean, trackTypes: TrackType[]) => {
    const sessionId = this.getSfuClient()?.sessionId;
    if (trackTypes.length === 0 || !sessionId) return;
    const revisions = trackTypes.map((t) => this.revisions.get(t));
    const resend = await withoutConcurrency(this.lockKey, async () => {
      const sfuClient = this.getSfuClient();
      // the session changed while this request was queued
      if (!sfuClient || sfuClient.sessionId !== sessionId) return [];
      try {
        await sfuClient.updateMuteStates(
          trackTypes.map((trackType) => ({ trackType, muted })),
        );
        return [];
      } catch (err) {
        const requeued = this.requeue(
          sfuClient.sessionId,
          muted,
          trackTypes.filter((t, i) => this.revisions.get(t) === revisions[i]),
        );
        // the call reconnected before this request failed, so the flush
        // after the reconnect didn't see this state
        const reconnected =
          this.state.callingState === CallingState.JOINED &&
          this.getSfuClient() !== sfuClient;
        if (requeued.length > 0 && reconnected) return requeued;
        throw err;
      }
    });
    if (resend.length > 0) await this.flush(...resend);
  };
}
