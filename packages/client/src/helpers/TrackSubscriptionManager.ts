import { BehaviorSubject, map, shareReplay } from 'rxjs';
import { DebounceType } from '../types';
import type { TrackSubscriptionDetails } from '../gen/video/sfu/signal_rpc/signal';
import { TrackType, VideoDimension } from '../gen/video/sfu/models/models';
import { CallState } from '../store';
import { getCurrentValue, setCurrentValue } from '../store/rxUtils';
import type { StreamSfuClient } from '../StreamSfuClient';
import { videoLoggerSystem } from '../logger';
import { Tracer } from '../stats';
import {
  hasScreenShare,
  hasScreenShareAudio,
  hasVideo,
} from './participantUtils';

/**
 * Per-participant (or global) video-subscription override.
 *
 * - `{ enabled: true, dimension }`: request video at a specific
 *   resolution. If set globally, applies to every remote participant
 *   that doesn't have a per-session override.
 * - `{ enabled: false }`: unsubscribe from video entirely. The SFU
 *   sends nothing; bandwidth is saved.
 */
export type VideoTrackSubscriptionOverride =
  | {
      enabled: true;
      dimension: VideoDimension;
    }
  | { enabled: false };

/** Symbol key for the "applies to all participants" override slot. */
const globalOverrideKey = Symbol('globalOverrideKey');

/**
 * Map of per-session overrides plus one optional global override under
 * the `globalOverrideKey` symbol slot.
 */
export interface VideoTrackSubscriptionOverrides {
  [sessionId: string]: VideoTrackSubscriptionOverride | undefined;
  [globalOverrideKey]?: VideoTrackSubscriptionOverride;
}

/**
 * Owns the SFU-side video-subscription machinery for a `Call`:
 *
 * - Holds the per-session / global override state in a
 *   `BehaviorSubject<VideoTrackSubscriptionOverrides>`.
 * - Derives the SFU subscription list from `CallState` participants +
 *   current overrides via the `subscriptions` getter.
 * - Debounces and pushes the list to the SFU through
 *   `sfuClient.updateSubscriptions`.
 * - Exposes `incomingVideoSettings$`: a consumer-friendly projection of
 *   the override state for React hooks.
 *
 * Owned by `DynascaleManager` as `readonly trackSubscriptionManager`.
 * `DynascaleManager.bindVideoElement` triggers `apply()` on every
 * dimension / visibility change.
 */
export class TrackSubscriptionManager {
  private logger = videoLoggerSystem.getLogger('TrackSubscriptionManager');
  private callState: CallState;
  private tracer: Tracer;

  private sfuClient: StreamSfuClient | undefined;
  private pendingUpdate: NodeJS.Timeout | null = null;

  private overridesSubject =
    new BehaviorSubject<VideoTrackSubscriptionOverrides>({});

  overrides$ = this.overridesSubject.asObservable();

  /**
   * Consumer-friendly projection of the override state. Used by the
   * `useIncomingVideoSettings()` React hook.
   */
  incomingVideoSettings$ = this.overrides$.pipe(
    map((overrides) => {
      const { [globalOverrideKey]: globalSettings, ...participants } =
        overrides;
      return {
        enabled: globalSettings?.enabled !== false,
        preferredResolution: globalSettings?.enabled
          ? globalSettings.dimension
          : undefined,
        participants: Object.fromEntries(
          Object.entries(participants).map(
            ([sessionId, participantOverride]) => [
              sessionId,
              {
                enabled: participantOverride?.enabled !== false,
                preferredResolution: participantOverride?.enabled
                  ? participantOverride.dimension
                  : undefined,
              },
            ],
          ),
        ),
        isParticipantVideoEnabled: (sessionId: string) =>
          overrides[sessionId]?.enabled ??
          overrides[globalOverrideKey]?.enabled ??
          true,
      };
    }),
    shareReplay(1),
  );

  /**
   * Constructs new TrackSubscriptionManager instance.
   *
   * @param callState the call state.
   * @param tracer the tracer to use.
   */
  constructor(callState: CallState, tracer: Tracer) {
    this.tracer = tracer;
    this.callState = callState;
  }

  /**
   * Sets the SFU client used by `apply()` to push subscription updates.
   * Called by the owner on call join; cleared on leave.
   */
  setSfuClient = (sfuClient: StreamSfuClient | undefined) => {
    this.sfuClient = sfuClient;
  };

  /**
   * Cancels any pending debounced subscription push. Idempotent.
   */
  dispose = () => {
    if (this.pendingUpdate) {
      clearTimeout(this.pendingUpdate);
      this.pendingUpdate = null;
    }
  };

  /**
   * The current SFU subscription list, computed from `CallState`
   * participants and the override state. Used by:
   *
   * - `apply()` to push to the SFU each time the set changes.
   * - `Call.getReconnectDetails` to include the subscription list in
   *   the reconnect payload.
   */
  get subscriptions(): TrackSubscriptionDetails[] {
    const subscriptions: TrackSubscriptionDetails[] = [];
    // Use getParticipantsSnapshot() to bypass the observable pipeline
    // and avoid stale data caused by shareReplay with no active subscribers
    const participants = this.callState.getParticipantsSnapshot();
    const overrides = this.overridesSubject.getValue();
    for (const p of participants) {
      if (p.isLocalParticipant) continue;
      // NOTE: audio tracks don't have to be requested explicitly
      // as the SFU will implicitly subscribe us to all of them,
      // once they become available.
      if (p.videoDimension && hasVideo(p)) {
        const override = overrides[p.sessionId] ?? overrides[globalOverrideKey];

        if (override?.enabled !== false) {
          subscriptions.push({
            userId: p.userId,
            sessionId: p.sessionId,
            trackType: TrackType.VIDEO,
            dimension: override?.dimension ?? p.videoDimension,
          });
        }
      }
      if (p.screenShareDimension && hasScreenShare(p)) {
        subscriptions.push({
          userId: p.userId,
          sessionId: p.sessionId,
          trackType: TrackType.SCREEN_SHARE,
          dimension: p.screenShareDimension,
        });
      }
      if (hasScreenShareAudio(p)) {
        subscriptions.push({
          userId: p.userId,
          sessionId: p.sessionId,
          trackType: TrackType.SCREEN_SHARE_AUDIO,
        });
      }
    }
    return subscriptions;
  }

  get overrides() {
    return getCurrentValue(this.overrides$);
  }

  /**
   * Sets video-subscription overrides. Called by
   * `Call.setIncomingVideoEnabled` and
   * `Call.setPreferredIncomingVideoResolution`.
   *
   * - `sessionIds` omitted → applies `override` globally (or clears the
   *   global override if `override` is `undefined`).
   * - `sessionIds` provided → applies `override` to each listed session.
   */
  setOverrides = (
    override: VideoTrackSubscriptionOverride | undefined,
    sessionIds?: string[],
  ) => {
    this.tracer.trace('setOverrides', [override, sessionIds]);
    if (!sessionIds) {
      return setCurrentValue(
        this.overridesSubject,
        override ? { [globalOverrideKey]: override } : {},
      );
    }

    return setCurrentValue(this.overridesSubject, (overrides) => ({
      ...overrides,
      ...Object.fromEntries(sessionIds.map((id) => [id, override])),
    }));
  };

  /**
   * Pushes `subscriptions` to the SFU. Debounced by `debounceType`
   * (SLOW by default). Multiple rapid calls coalesce into one RPC.
   * Passing `0` fires synchronously.
   */
  apply = (debounceType: DebounceType = DebounceType.SLOW) => {
    if (this.pendingUpdate) {
      clearTimeout(this.pendingUpdate);
    }

    const updateSubscriptions = () => {
      this.pendingUpdate = null;
      this.sfuClient
        ?.updateSubscriptions(this.subscriptions)
        .catch((err: unknown) => {
          this.logger.debug(`Failed to update track subscriptions`, err);
        });
    };

    if (debounceType) {
      this.pendingUpdate = setTimeout(updateSubscriptions, debounceType);
    } else {
      updateSubscriptions();
    }
  };
}
