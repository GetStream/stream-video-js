import {
  type Call,
  DebounceType,
  SfuModels,
  type VideoTrackType,
} from '@stream-io/video-client';
import { BehaviorSubject, distinctUntilChanged, map, Observable } from 'rxjs';

/**
 * Identifies the remote track a surface renders.
 */
export type PipTrackKey = {
  sessionId: string;
  trackType: VideoTrackType;
};

/**
 * A registration that its holder gives back when it goes away. Idempotent.
 */
export type PipDemandHandle = {
  release: () => void;
};

const toTrackKey = (key: PipTrackKey) => `${key.trackType}/${key.sessionId}`;

/**
 * Truncates the logical points reported by the native window to the integer
 * dimensions the SFU is asked for. Sizes that describe no visible surface are
 * rejected, so that a cached valid size survives them.
 */
const toValidDimension = (
  dimension: SfuModels.VideoDimension | undefined,
): SfuModels.VideoDimension | undefined => {
  if (!dimension) return undefined;
  const width = Math.trunc(dimension.width);
  const height = Math.trunc(dimension.height);
  if (!Number.isFinite(width) || !Number.isFinite(height)) return undefined;
  if (width <= 0 || height <= 0) return undefined;
  return { width, height };
};

/**
 * One native Picture in Picture window, from its creation until it is disposed.
 *
 * Its laid out bounds are the demand of the track it renders, so they are
 * handed to a `TrackSubscriber` of that track. They belong to this window: a
 * replacement window starts without them instead of resurrecting them.
 */
export class IosPipVideoWindow {
  /** the bounds of the window, consumed as the demand of the selected track */
  readonly dimensions$: BehaviorSubject<SfuModels.VideoDimension | undefined>;
  private demand: IosPipVideoDemand;
  private ownerships: Set<PipDemandHandle>;
  private isReleased: boolean = false;

  constructor(demand: IosPipVideoDemand) {
    this.demand = demand;
    this.dimensions$ = new BehaviorSubject<
      SfuModels.VideoDimension | undefined
    >(undefined);
    this.ownerships = new Set();
  }

  /**
   * Reports the laid out bounds of the window. Invalid sizes and repetitions
   * are ignored, so that they neither drop nor re-request the subscription.
   */
  setBounds = (dimension: SfuModels.VideoDimension | undefined) => {
    const next = toValidDimension(dimension);
    if (this.isReleased || !next) return;
    const current = this.dimensions$.getValue();
    if (
      current &&
      current.width === next.width &&
      current.height === next.height
    )
      return;
    this.dimensions$.next(next);
  };

  /**
   * Makes this window the owner of the demand of the given track, muting the
   * inline views that render it. The demand is restored to them, or given up,
   * when the returned handle is released.
   */
  own = (key: PipTrackKey): PipDemandHandle => {
    if (this.isReleased) return { release: () => {} };
    const owned = this.demand.own(key);
    const ownership: PipDemandHandle = {
      release: () => {
        this.ownerships.delete(ownership);
        owned.release();
      },
    };
    this.ownerships.add(ownership);
    return ownership;
  };

  /**
   * Disposes the window: its bounds stop being valid geometry and whatever it
   * still owns is released. Idempotent.
   */
  release = () => {
    if (this.isReleased) return;
    this.isReleased = true;
    for (const ownership of [...this.ownerships]) ownership.release();
    this.dimensions$.next(undefined);
  };
}

/**
 * Arbitrates the automatic video subscription demand between the native
 * Picture in Picture window of a call and the inline participant views.
 *
 * Both write through the same `TrackSubscriber`, so this only decides who may
 * write for a given track: while the native window renders it, the inline
 * views behind it - which keep their own, hidden and possibly much larger
 * layout - must not overwrite its bounds.
 *
 * This is internal plumbing: it never touches the public incoming video
 * settings, which keep overriding whatever is requested here.
 */
export class IosPipVideoDemand {
  private call: Call;
  private owners: Map<string, object> = new Map();
  private inlineConsumers: Map<string, number> = new Map();
  private ownedTrackKeys$: BehaviorSubject<ReadonlySet<string>> =
    new BehaviorSubject<ReadonlySet<string>>(new Set());

  constructor(call: Call) {
    this.call = call;
  }

  /**
   * Announces a new native Picture in Picture window of this call.
   */
  claimWindow = () => new IosPipVideoWindow(this);

  /**
   * Whether the native window currently owns the demand of the given track.
   */
  isOwnedByPip$ = (key: PipTrackKey): Observable<boolean> => {
    const trackKey = toTrackKey(key);
    return this.ownedTrackKeys$.pipe(
      map((owned) => owned.has(trackKey)),
      distinctUntilChanged(),
    );
  };

  /**
   * Records a mounted inline view of the track. This is presence only - the
   * view keeps requesting its own dimensions - and tells the native window
   * whether releasing a track leaves a consumer behind.
   */
  registerInlineConsumer = (key: PipTrackKey): PipDemandHandle => {
    const trackKey = toTrackKey(key);
    this.inlineConsumers.set(
      trackKey,
      (this.inlineConsumers.get(trackKey) ?? 0) + 1,
    );
    let isReleased = false;
    return {
      release: () => {
        if (isReleased) return;
        isReleased = true;
        const consumers = (this.inlineConsumers.get(trackKey) ?? 1) - 1;
        if (consumers > 0) {
          this.inlineConsumers.set(trackKey, consumers);
        } else {
          this.inlineConsumers.delete(trackKey);
        }
      },
    };
  };

  /**
   * Gives the ownership of a track to a native window. Internal to
   * {@link IosPipVideoWindow}.
   */
  own = (key: PipTrackKey): PipDemandHandle => {
    const trackKey = toTrackKey(key);
    const token = {};
    this.owners.set(trackKey, token);
    this.emitOwnedTrackKeys();
    return {
      release: () => {
        // a disposed window must not release the ownership of the window that
        // replaced it, nor the one of a newer selection.
        if (this.owners.get(trackKey) !== token) return;
        this.owners.delete(trackKey);
        // a mounted inline view requests its own, current demand again here.
        this.emitOwnedTrackKeys();
        if (!this.inlineConsumers.has(trackKey)) this.dropDemand(key);
      },
    };
  };

  private emitOwnedTrackKeys = () => {
    this.ownedTrackKeys$.next(new Set(this.owners.keys()));
  };

  private dropDemand = ({ sessionId, trackType }: PipTrackKey) => {
    // no view renders the track anymore: give up the demand the native window
    // introduced or masked, with the debounce of an inline unsubscription.
    this.call.state.updateParticipantTracks(trackType, {
      [sessionId]: { dimension: undefined },
    });
    this.call.trackSubscriptionManager.apply(DebounceType.MEDIUM);
  };
}

const demands = new WeakMap<Call, IosPipVideoDemand>();

/**
 * Returns the Picture in Picture demand of the given call, creating it on first
 * use. Keying by the call object keeps successive calls - even with the same
 * cid - strictly isolated from each other.
 */
export const getIosPipVideoDemand = (call: Call) => {
  let demand = demands.get(call);
  if (!demand) {
    demand = new IosPipVideoDemand(call);
    demands.set(call, demand);
  }
  return demand;
};
