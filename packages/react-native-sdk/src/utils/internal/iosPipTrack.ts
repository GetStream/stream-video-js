import {
  type Call,
  DebounceType,
  type VideoTrackType,
} from '@stream-io/video-client';
import { BehaviorSubject } from 'rxjs';

export type PipTrack = { sessionId: string; trackType: VideoTrackType };

/**
 * The track currently rendered by the native iOS Picture in Picture window,
 * per Call instance. While set, the window's bounds are the demand of that
 * track and the inline views of the same track stop requesting their layout.
 */
const tracks = new WeakMap<Call, BehaviorSubject<PipTrack | undefined>>();

export const getIosPipTrack$ = (call: Call) => {
  let track$ = tracks.get(call);
  if (!track$) {
    track$ = new BehaviorSubject<PipTrack | undefined>(undefined);
    tracks.set(call, track$);
  }
  return track$;
};

export const setIosPipTrack = (call: Call, track: PipTrack | undefined) => {
  const track$ = getIosPipTrack$(call);
  const previous = track$.getValue();
  if (previous) {
    // Clear before opening the gate: mounted inline views replay their layout
    // synchronously on the gate change and overwrite this. If none is mounted,
    // the cleared demand stands.
    call.state.updateParticipantTracks(previous.trackType, {
      [previous.sessionId]: { dimension: undefined },
    });
    call.trackSubscriptionManager.apply(DebounceType.MEDIUM);
  }
  track$.next(track);
};
