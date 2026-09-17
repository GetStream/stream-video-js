import {
  type Call,
  DebounceType,
  SfuModels,
  type VideoTrackType,
} from '@stream-io/video-client';
import { BehaviorSubject, distinctUntilChanged, map } from 'rxjs';

type PipTrackKey = { sessionId: string; trackType: VideoTrackType };
type PipOwner = PipTrackKey & { window: IosPipVideoWindow };
const toTrackKey = (key: PipTrackKey) => `${key.trackType}/${key.sessionId}`;

/** Geometry belongs to one native window, independently of its selected track. */
export class IosPipVideoWindow {
  readonly dimensions$ = new BehaviorSubject<
    SfuModels.VideoDimension | undefined
  >(undefined);
  isReleased = false;
  private demand: IosPipVideoDemand;
  private releaseTrack: (() => void) | undefined;

  constructor(demand: IosPipVideoDemand) {
    this.demand = demand;
  }

  setBounds = (dimension: SfuModels.VideoDimension | undefined) => {
    if (this.isReleased || !dimension) return;
    const width = Math.trunc(dimension.width);
    const height = Math.trunc(dimension.height);
    if (!Number.isFinite(width) || !Number.isFinite(height)) return;
    if (width <= 0 || height <= 0) return;
    const current = this.dimensions$.getValue();
    if (current?.width === width && current.height === height) return;
    this.dimensions$.next({ width, height });
  };

  own = (key: PipTrackKey) => {
    if (this.isReleased) return () => {};
    this.releaseTrack?.();
    this.releaseTrack = this.demand.own(this, key);
    return this.releaseTrack;
  };

  release = () => {
    if (this.isReleased) return;
    this.isReleased = true;
    this.releaseTrack?.();
    this.dimensions$.next(undefined);
  };
}

/** Gates the existing TrackSubscriber writers; does not duplicate SFU policy. */
class IosPipVideoDemand {
  private call: Call;
  private owner$ = new BehaviorSubject<PipOwner | undefined>(undefined);
  private inlineConsumers = new Map<string, number>();

  constructor(call: Call) {
    this.call = call;
  }

  claimWindow = () => new IosPipVideoWindow(this);

  canWrite$ = (key: PipTrackKey, window?: IosPipVideoWindow) =>
    this.owner$.pipe(
      map((owner) => {
        const ownsTrack = !!owner && toTrackKey(owner) === toTrackKey(key);
        return window ? ownsTrack && owner?.window === window : !ownsTrack;
      }),
      distinctUntilChanged(),
    );

  registerInlineConsumer = (key: PipTrackKey) => {
    const trackKey = toTrackKey(key);
    this.inlineConsumers.set(
      trackKey,
      (this.inlineConsumers.get(trackKey) ?? 0) + 1,
    );
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const count = (this.inlineConsumers.get(trackKey) ?? 1) - 1;
      if (count) this.inlineConsumers.set(trackKey, count);
      else this.inlineConsumers.delete(trackKey);
    };
  };

  own = (window: IosPipVideoWindow, key: PipTrackKey) => {
    const previous = this.owner$.getValue();
    // A replaced window can neither write nor reclaim ownership on a later
    // participant update. Restore inline geometry before the new window claims
    // the track, in case it starts before its first bounds event.
    if (previous && previous.window !== window) previous.window.release();
    const owner = { ...key, window };
    this.owner$.next(owner);
    return () => {
      if (this.owner$.getValue() !== owner) return;
      // Inline subscribers immediately replay their latest cached geometry.
      this.owner$.next(undefined);
      this.releaseDemand(key);
    };
  };

  private releaseDemand = (key: PipTrackKey) => {
    // React may unmount the inline siblings after the PiP parent. Check again
    // after that commit, without changing ordinary inline-unmount behavior.
    if (this.inlineConsumers.has(toTrackKey(key))) {
      queueMicrotask(() => this.dropIfUnused(key));
    } else {
      this.dropIfUnused(key);
    }
  };

  private dropIfUnused = (key: PipTrackKey) => {
    const trackKey = toTrackKey(key);
    const owner = this.owner$.getValue();
    if (owner && toTrackKey(owner) === trackKey) return;
    if (this.inlineConsumers.has(trackKey)) return;
    this.call.state.updateParticipantTracks(key.trackType, {
      [key.sessionId]: { dimension: undefined },
    });
    this.call.trackSubscriptionManager.apply(DebounceType.MEDIUM);
  };
}

const demands = new WeakMap<Call, IosPipVideoDemand>();

export const getIosPipVideoDemand = (call: Call) => {
  let demand = demands.get(call);
  if (!demand) {
    demand = new IosPipVideoDemand(call);
    demands.set(call, demand);
  }
  return demand;
};
