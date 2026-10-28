import { BehaviorSubject, map, shareReplay } from 'rxjs';
import {
  type AppVisibility,
  type AppVisibilitySource,
  DebounceType,
} from '../types';
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

/**
 * How long the app must stay hidden before incoming video is paused. Rides
 * out short trips away from the call, such as a notification shade, a
 * permission prompt or picture-in-picture starting after the app is hidden.
 */
const hiddenPauseDelayMs = 3000;

/**
 * A pause timer firing later than this past its deadline ran after the
 * JavaScript was suspended (iOS does it while hidden), most likely as the
 * app returns. Hidden pages that keep running fire timers at most ~1s late.
 */
const lateTimerToleranceMs = 2000;

/** How long to wait for a visibility report after a late pause timer. */
const lateTimerRecheckMs = 1000;

const trackTypeOf = {
  videoTrack: TrackType.VIDEO,
  screenShareTrack: TrackType.SCREEN_SHARE,
} as const;

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
 * - Pauses remote video subscriptions (camera and screen share) while
 *   the app is hidden, see `watchVisibility`.
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

  private visibilitySource: AppVisibilitySource | undefined;
  private pauseWhenHidden = true;
  /** set while incoming video is paused, to the visibility it paused for */
  private pausedFor: Extract<AppVisibility, { hidden: true }> | undefined;
  private pendingPause: ReturnType<typeof setTimeout> | undefined;

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
    this.cancelPendingPause();
  };

  /**
   * The current SFU subscription list, computed from `CallState`
   * participants and the override state. Used by:
   *
   * - `apply()` to push to the SFU each time the set changes.
   * - `Call.getReconnectDetails` to include the subscription list in
   *   the reconnect payload.
   *
   * While incoming video is paused (see `watchVisibility`), camera and
   * screen share video are left out, except for the one still on screen
   * in picture-in-picture. Screen share audio is kept.
   */
  get subscriptions(): TrackSubscriptionDetails[] {
    const subscriptions: TrackSubscriptionDetails[] = [];
    // Use getParticipantsSnapshot() to bypass the observable pipeline
    // and avoid stale data caused by shareReplay with no active subscribers
    const participants = this.callState.getParticipantsSnapshot();
    const overrides = this.overridesSubject.getValue();
    const pausedFor = this.pausedFor;
    const isWanted = (sessionId: string, trackType: TrackType) => {
      if (!pausedFor) return true;
      const { shownTrack } = pausedFor;
      return (
        shownTrack?.sessionId === sessionId &&
        trackTypeOf[shownTrack.trackType] === trackType
      );
    };
    for (const p of participants) {
      if (p.isLocalParticipant) continue;
      // NOTE: audio tracks don't have to be requested explicitly
      // as the SFU will implicitly subscribe us to all of them,
      // once they become available.
      if (
        isWanted(p.sessionId, TrackType.VIDEO) &&
        p.videoDimension &&
        hasVideo(p)
      ) {
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
      if (
        isWanted(p.sessionId, TrackType.SCREEN_SHARE) &&
        p.screenShareDimension &&
        hasScreenShare(p)
      ) {
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
   * Starts pausing incoming video while the app is hidden, as reported by
   * `source`. Video is paused once the app stays hidden for a few seconds,
   * and resumed right away when it becomes visible again, unless disabled
   * with `setPauseWhenHidden(false)`. A video shown in picture-in-picture
   * stays subscribed.
   *
   * @returns a function that stops watching and drops the pause state.
   */
  watchVisibility = (source: AppVisibilitySource) => {
    this.visibilitySource = source;
    const stopWatching = source.watch(this.syncVideoPause);
    this.syncVideoPause();
    return () => {
      stopWatching();
      if (this.visibilitySource !== source) return;
      this.visibilitySource = undefined;
      this.cancelPendingPause();
      this.pausedFor = undefined;
    };
  };

  /**
   * Enables or disables pausing incoming video while the app is hidden.
   * Called by `Call.setPauseIncomingVideoWhenHidden`.
   */
  setPauseWhenHidden = (enabled: boolean) => {
    this.pauseWhenHidden = enabled;
    this.syncVideoPause();
  };

  private getHiddenVisibility = () => {
    if (!this.pauseWhenHidden) return;
    const visibility = this.visibilitySource?.getVisibility();
    return visibility?.hidden ? visibility : undefined;
  };

  private syncVideoPause = () => {
    const hidden = this.getHiddenVisibility();
    if (!hidden) {
      this.cancelPendingPause();
      if (!this.pausedFor) return;
      this.pausedFor = undefined;
      this.tracer.trace('incomingVideo.resumed', null);
      this.apply(0);
      return;
    }

    if (!this.pausedFor) {
      if (!this.pendingPause) this.schedulePause(hiddenPauseDelayMs);
      return;
    }

    // already paused: follow the video shown in picture-in-picture
    const shown = this.pausedFor.shownTrack;
    const nextShown = hidden.shownTrack;
    if (
      shown?.sessionId === nextShown?.sessionId &&
      shown?.trackType === nextShown?.trackType
    ) {
      return;
    }
    this.pausedFor = hidden;
    this.apply(0);
  };

  private schedulePause = (delayMs: number) => {
    const deadline = Date.now() + delayMs;
    this.pendingPause = setTimeout(() => {
      this.pendingPause = undefined;
      if (Date.now() - deadline > lateTimerToleranceMs) {
        this.schedulePause(lateTimerRecheckMs);
        return;
      }
      // read again: some changes, such as picture-in-picture of a video
      // inside a shadow root, are not reported
      const hidden = this.getHiddenVisibility();
      if (!hidden) return;
      this.pausedFor = hidden;
      this.tracer.trace('incomingVideo.paused', hidden.shownTrack ?? null);
      this.apply(0);
    }, delayMs);
  };

  private cancelPendingPause = () => {
    clearTimeout(this.pendingPause);
    this.pendingPause = undefined;
  };

  /**
   * Pushes `subscriptions` to the SFU. Debounced by `debounceType`
   * (SLOW by default). Multiple rapid calls coalesce into one RPC.
   * Passing `0` fires synchronously.
   */
  apply = (debounceType: DebounceType | 0 = DebounceType.SLOW) => {
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
