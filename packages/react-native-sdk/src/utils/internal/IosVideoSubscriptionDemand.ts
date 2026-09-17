import {
  type Call,
  CallingState,
  DebounceType,
  SfuModels,
  type VideoTrackType,
} from '@stream-io/video-client';
import { distinctUntilChanged, map } from 'rxjs';

/**
 * Identifies the remote track a surface renders.
 */
export type VideoDemandTrackKey = {
  sessionId: string;
  trackType: VideoTrackType;
};

/**
 * The demand of a single mounted inline view.
 */
export type InlineVideoDemand = {
  /** the laid out dimensions of the view, if it has been measured */
  dimension: SfuModels.VideoDimension | undefined;
  /** whether the view renders the track, i.e. it is visible and published */
  eligible: boolean;
};

/**
 * The registration of a single mounted inline view. Every registration is
 * independent: releasing one never removes the demand of another one.
 */
export type InlineVideoDemandHandle = {
  update: (demand: InlineVideoDemand) => void;
  release: () => void;
};

type EffectiveVideoDemand = {
  dimension: SfuModels.VideoDimension | undefined;
  /** whether an absent dimension means "no video needed" instead of "unknown" */
  unsubscribe: boolean;
};

type TrackDemandState = {
  sessionId: string;
  trackType: VideoTrackType;
  /** the demand of every mounted inline view, keyed by registration id */
  inline: Map<number, InlineVideoDemand>;
  /** the last valid automatic dimension computed for this track */
  lastValidDimension: SfuModels.VideoDimension | undefined;
};

const toTrackKey = (key: VideoDemandTrackKey) =>
  `${key.trackType}/${key.sessionId}`;

const isValidDimension = (
  dimension: SfuModels.VideoDimension | undefined,
): dimension is SfuModels.VideoDimension =>
  !!dimension &&
  Number.isFinite(dimension.width) &&
  Number.isFinite(dimension.height) &&
  dimension.width > 0 &&
  dimension.height > 0;

const isSameDimension = (
  a: SfuModels.VideoDimension | undefined,
  b: SfuModels.VideoDimension | undefined,
) => (!a || !b ? a === b : a.width === b.width && a.height === b.height);

/**
 * Coordinates the automatic video subscription dimensions of the iOS surfaces
 * of a single call.
 *
 * Inline views (participant tiles) register themselves and report their laid
 * out dimensions. The native Picture in Picture window is a separate owner: as
 * long as it is active, its own bounds drive the dimension of the track it
 * renders, so that hidden inline layouts cannot overwrite them. Releasing it
 * restores the current inline demand.
 *
 * This is internal plumbing - it never touches the public incoming video
 * settings, which keep overriding whatever is computed here.
 */
export class IosVideoSubscriptionDemand {
  private call: Call;
  private tracks: Map<string, TrackDemandState> = new Map();
  private pipTrackKey: string | undefined;
  private pipDimension: SfuModels.VideoDimension | undefined;
  private isJoined: boolean = false;
  private nextRegistrationId: number = 0;

  constructor(call: Call) {
    this.call = call;
    // the subscription lives as long as the call does: this coordinator is
    // only reachable through the call it belongs to.
    call.state.callingState$
      .pipe(
        map((callingState) => callingState === CallingState.JOINED),
        distinctUntilChanged(),
      )
      .subscribe((isJoined) => {
        this.isJoined = isJoined;
        if (isJoined) {
          this.reapplyAll();
        }
      });
  }

  /**
   * Registers a mounted inline view rendering the given track.
   */
  registerInline = (key: VideoDemandTrackKey): InlineVideoDemandHandle => {
    const trackKey = toTrackKey(key);
    const registrationId = this.nextRegistrationId++;
    this.getOrCreateTrack(trackKey, key).inline.set(registrationId, {
      dimension: undefined,
      eligible: false,
    });

    let released = false;
    return {
      update: (demand) => {
        const current = released ? undefined : this.tracks.get(trackKey);
        if (!current) return;
        current.inline.set(registrationId, demand);
        this.publish(trackKey, current);
      },
      release: () => {
        if (released) return;
        released = true;
        const current = this.tracks.get(trackKey);
        if (!current) return;
        current.inline.delete(registrationId);
        if (current.inline.size === 0 && this.pipTrackKey !== trackKey) {
          // nothing renders the track anymore: forget it, but leave its
          // subscription alone so that a remounting view does not interrupt it.
          this.tracks.delete(trackKey);
        } else {
          this.publish(trackKey, current);
        }
      },
    };
  };

  /**
   * Caches the latest laid out bounds of the native Picture in Picture window.
   * Invalid sizes are ignored, so that a cached valid size survives them.
   */
  setPipDimension = (dimension: SfuModels.VideoDimension | undefined) => {
    if (!isValidDimension(dimension)) return;
    if (isSameDimension(this.pipDimension, dimension)) return;
    this.pipDimension = dimension;
    this.publishPipTrack();
  };

  /**
   * Makes the native Picture in Picture window the owner of the given track,
   * releasing the track it owned before. The cached native bounds are reused
   * for the new selection.
   */
  acquirePip = (key: VideoDemandTrackKey) => {
    const trackKey = toTrackKey(key);
    if (this.pipTrackKey === trackKey) return;
    this.releasePip();
    this.getOrCreateTrack(trackKey, key);
    this.pipTrackKey = trackKey;
    this.publishPipTrack();
  };

  /**
   * Releases the native Picture in Picture ownership and restores the current
   * inline demand of the track it owned. Idempotent.
   */
  releasePip = () => {
    const trackKey = this.pipTrackKey;
    if (!trackKey) return;
    this.pipTrackKey = undefined;
    const state = this.tracks.get(trackKey);
    if (!state) return;
    this.publish(trackKey, state);
    if (state.inline.size === 0) {
      this.tracks.delete(trackKey);
    }
  };

  private getOrCreateTrack = (trackKey: string, key: VideoDemandTrackKey) => {
    let state = this.tracks.get(trackKey);
    if (!state) {
      state = {
        sessionId: key.sessionId,
        trackType: key.trackType,
        inline: new Map(),
        lastValidDimension: undefined,
      };
      this.tracks.set(trackKey, state);
    }
    return state;
  };

  private publishPipTrack = () => {
    const trackKey = this.pipTrackKey;
    const state = trackKey ? this.tracks.get(trackKey) : undefined;
    if (!trackKey || !state) return;
    this.publish(trackKey, state);
  };

  private reapplyAll = () => {
    for (const [trackKey, state] of this.tracks) {
      this.publish(trackKey, state, true);
    }
  };

  private computeEffectiveDemand = (
    trackKey: string,
    state: TrackDemandState,
  ): EffectiveVideoDemand => {
    if (this.pipTrackKey === trackKey) {
      // while the native window owns the track, a hidden inline layout must not
      // overwrite its bounds. Until they are known, keep the last valid demand
      // rather than inventing one.
      return {
        dimension: isValidDimension(this.pipDimension)
          ? this.pipDimension
          : state.lastValidDimension,
        unsubscribe: false,
      };
    }

    let merged: SfuModels.VideoDimension | undefined;
    let hasUnmeasuredView = false;
    for (const demand of state.inline.values()) {
      const { dimension } = demand;
      if (!demand.eligible) continue;
      if (!dimension) {
        hasUnmeasuredView = true;
        continue;
      }
      // an empty or invalid box means the view does not show the track, which
      // we treat as "no demand" rather than as unknown geometry.
      if (!isValidDimension(dimension)) continue;
      // simultaneously rendered views are all served by one subscription,
      // so it has to satisfy the largest demand on each axis.
      merged = merged
        ? {
            width: Math.max(merged.width, dimension.width),
            height: Math.max(merged.height, dimension.height),
          }
        : dimension;
    }
    if (merged) return { dimension: merged, unsubscribe: false };
    // a view that has not been laid out yet keeps the current demand, while a
    // hidden or unpublished track drops its subscription.
    return hasUnmeasuredView
      ? { dimension: state.lastValidDimension, unsubscribe: false }
      : { dimension: undefined, unsubscribe: true };
  };

  private getSubscribedDimension = (state: TrackDemandState) => {
    const participant = this.call.state
      .getParticipantsSnapshot()
      .find((p) => p.sessionId === state.sessionId);
    if (!participant) return undefined;
    return state.trackType === 'videoTrack'
      ? participant.videoDimension
      : participant.screenShareDimension;
  };

  private publish = (
    trackKey: string,
    state: TrackDemandState,
    force: boolean = false,
  ) => {
    if (!this.isJoined) return;
    const { dimension, unsubscribe } = this.computeEffectiveDemand(
      trackKey,
      state,
    );
    // update our own state before writing to the call state, whose observables
    // synchronously feed the registrations back into this coordinator.
    if (dimension) {
      state.lastValidDimension = dimension;
    } else if (!unsubscribe) {
      // no geometry is known yet: wait for it instead of requesting a
      // dimension that no surface actually needs.
      return;
    }
    const subscribed = this.getSubscribedDimension(state);
    if (!dimension && !subscribed) return;
    if (!force && isSameDimension(subscribed, dimension)) return;
    this.call.state.updateParticipantTracks(state.trackType, {
      [state.sessionId]: { dimension: dimension && { ...dimension } },
    });
    this.call.trackSubscriptionManager.apply(
      dimension ? DebounceType.IMMEDIATE : DebounceType.MEDIUM,
    );
  };
}

const coordinators = new WeakMap<Call, IosVideoSubscriptionDemand>();

/**
 * Returns the demand coordinator of the given call, creating it on first use.
 * Keying by the call object keeps successive calls - even with the same cid -
 * strictly isolated from each other.
 */
export const getIosVideoSubscriptionDemand = (call: Call) => {
  let coordinator = coordinators.get(call);
  if (!coordinator) {
    coordinator = new IosVideoSubscriptionDemand(call);
    coordinators.set(call, coordinator);
  }
  return coordinator;
};
