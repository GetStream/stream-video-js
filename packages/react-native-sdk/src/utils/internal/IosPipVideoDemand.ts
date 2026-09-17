import {
  type Call,
  DebounceType,
  type VideoTrackType,
} from '@stream-io/video-client';
import { BehaviorSubject } from 'rxjs';

type PipTrack = { sessionId: string; trackType: VideoTrackType };
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
    // Clear before opening the gate: mounted inline views replay their layout.
    call.state.updateParticipantTracks(previous.trackType, {
      [previous.sessionId]: { dimension: undefined },
    });
    call.trackSubscriptionManager.apply(DebounceType.MEDIUM);
  }
  track$.next(track);
};
