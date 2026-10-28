import { BehaviorSubject, combineLatest, map, shareReplay } from 'rxjs';
import {
  type AppVisibility,
  type AppVisibilitySource,
  DebounceType,
  type VideoTrackType,
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

type PausedFor = Extract<AppVisibility, { hidden: true }>;

/** Tells whether a remote video was paused. */
export type PausedTrackFilter = (
  sessionId: string,
  trackType: VideoTrackType,
) => boolean;

const trackKey = (sessionId: string, trackType: VideoTrackType) =>
  `${sessionId}:${trackType}`;

/**
 * Whether a remote video is left out while paused for `pausedFor`: every
 * video except the one shown in picture-in-picture.
 */
const isPausedTrack = (
  pausedFor: PausedFor | undefined,
  sessionId: string,
  trackType: VideoTrackType,
) => {
  if (!pausedFor) return false;
  const { shownTrack } = pausedFor;
  return (
    shownTrack?.sessionId !== sessionId || shownTrack.trackType !== trackType
  );
};

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
  private pausedForSubject = new BehaviorSubject<PausedFor | undefined>(
    undefined,
  );
  /** resumed videos still waiting for their first fresh frame */
  private awaitingFreshFrameSubject = new BehaviorSubject<ReadonlySet<string>>(
    new Set(),
  );
  private resumeListeners = new Set<(wasPaused: PausedTrackFilter) => void>();
  private pendingPause: ReturnType<typeof setTimeout> | undefined;

  private overridesSubject =
    new BehaviorSubject<VideoTrackSubscriptionOverrides>({});

  overrides$ = this.overridesSubject.asObservable();

  /**
   * Consumer-friendly projection of the override state. Used by the
   * `useIncomingVideoSettings()` React hook.
   */
  incomingVideoSettings$ = combineLatest([
    this.overrides$,
    this.pausedForSubject,
    this.awaitingFreshFrameSubject,
  ]).pipe(
    map(([overrides, pausedFor, awaitingFreshFrame]) => {
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
        /**
         * Whether the participant's video is paused while the app is
         * hidden, or resumed but not showing a fresh frame yet. UIs show
         * the video placeholder meanwhile.
         */
        isParticipantVideoPaused: (
          sessionId: string,
          trackType: VideoTrackType = 'videoTrack',
        ) => {
          if (awaitingFreshFrame.has(trackKey(sessionId, trackType))) {
            return true;
          }
          if (!isPausedTrack(pausedFor, sessionId, trackType)) return false;
          return this.callState.localParticipant?.sessionId !== sessionId;
        },
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
    const pausedFor = this.pausedForSubject.getValue();
    for (const p of participants) {
      if (p.isLocalParticipant) continue;
      // NOTE: audio tracks don't have to be requested explicitly
      // as the SFU will implicitly subscribe us to all of them,
      // once they become available.
      if (
        !isPausedTrack(pausedFor, p.sessionId, 'videoTrack') &&
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
        !isPausedTrack(pausedFor, p.sessionId, 'screenShareTrack') &&
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
      this.pausedForSubject.next(undefined);
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

  /**
   * Registers a listener invoked right before paused incoming video
   * resumes, with a filter telling which videos were paused.
   *
   * @returns a function that unregisters the listener.
   */
  onBeforeResume = (listener: (wasPaused: PausedTrackFilter) => void) => {
    this.resumeListeners.add(listener);
    return () => {
      this.resumeListeners.delete(listener);
    };
  };

  /**
   * Marks a resumed video as waiting for its first fresh frame, or not.
   * `isParticipantVideoPaused` keeps reporting it as paused meanwhile.
   */
  setAwaitingFreshFrame = (
    sessionId: string,
    trackType: VideoTrackType,
    awaiting: boolean,
  ) => {
    const key = trackKey(sessionId, trackType);
    const current = this.awaitingFreshFrameSubject.getValue();
    if (current.has(key) === awaiting) return;
    const next = new Set(current);
    if (awaiting) next.add(key);
    else next.delete(key);
    this.awaitingFreshFrameSubject.next(next);
  };

  private getHiddenVisibility = () => {
    if (!this.pauseWhenHidden) return;
    const visibility = this.visibilitySource?.getVisibility();
    return visibility?.hidden ? visibility : undefined;
  };

  private syncVideoPause = () => {
    const hidden = this.getHiddenVisibility();
    const pausedFor = this.pausedForSubject.getValue();
    if (!hidden) {
      this.cancelPendingPause();
      if (!pausedFor) return;
      const wasPaused: PausedTrackFilter = (sessionId, trackType) =>
        isPausedTrack(pausedFor, sessionId, trackType);
      for (const listener of this.resumeListeners) listener(wasPaused);
      this.pausedForSubject.next(undefined);
      this.tracer.trace('incomingVideo.resumed', null);
      this.apply(0);
      return;
    }

    if (!pausedFor) {
      if (!this.pendingPause) this.schedulePause(hiddenPauseDelayMs);
      return;
    }

    // already paused: follow the video shown in picture-in-picture
    const shown = pausedFor.shownTrack;
    const nextShown = hidden.shownTrack;
    if (
      shown?.sessionId === nextShown?.sessionId &&
      shown?.trackType === nextShown?.trackType
    ) {
      return;
    }
    this.pausedForSubject.next(hidden);
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
      this.pausedForSubject.next(hidden);
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
