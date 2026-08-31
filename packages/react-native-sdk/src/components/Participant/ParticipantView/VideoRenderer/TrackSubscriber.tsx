import { useEffect } from 'react';
import {
  Call,
  CallingState,
  DebounceType,
  SfuModels,
  StateStore,
  hasScreenShare,
  hasVideo,
  type VideoTrackType,
} from '@stream-io/video-client';

type TrackSubscriberProps = {
  participantSessionId: string;
  call: Call;
  trackType: VideoTrackType;
  isVisible: boolean;
  /**
   * The dimensions of the view rendering the track, owned by the parent so that
   * the last reported layout survives a remount of this component.
   */
  dimensionsStore: StateStore<{
    dimensions: SfuModels.VideoDimension | undefined;
  }>;
};

/**
 * This component is used to subscribe to the video + audio track of the participant in the following cases:
 * 1. When the participant starts publishing the video track
 * 2. When the participant changes the video track dimensions
 * 3. When the participant becomes visible
 * 4. On joined callingState, this handles reconnection

 * This component is used to unsubscribe to video track and subscribe only to the audio track of the participant (by passing undefined dimensions) in the following cases:
 * 1. When the participant stops publishing the video track
 * 2. When the participant becomes invisible
*/
const TrackSubscriber = (props: TrackSubscriberProps) => {
  const { call, participantSessionId, trackType, isVisible, dimensionsStore } =
    props;

  useEffect(() => {
    const requestTrackWithDimensions = (
      debounceType: DebounceType,
      dimension: SfuModels.VideoDimension | undefined,
    ) => {
      if (dimension && (dimension.width === 0 || dimension.height === 0)) {
        // ignore 0x0 dimensions. this can happen when the video element
        // is not visible (e.g., has display: none).
        // we treat this as "unsubscription" as we don't want to keep
        // consuming bandwidth for a video that is not visible on the screen.
        dimension = undefined;
      }
      call.state.updateParticipantTracks(trackType, {
        [participantSessionId]: { dimension },
      });
      call.trackSubscriptionManager.apply(debounceType);
    };

    // What we last acted on, so an unrelated store change does not re-request
    // the track. `undefined` for `isPublishing` means the participant is not in
    // the call yet - distinct from `false`: on the initial join and after a
    // reconnect the participant arrives after this component mounts, and
    // treating "not there yet" as "not publishing" would unsubscribe the track
    // before it was ever requested.
    let lastDimension: SfuModels.VideoDimension | undefined;
    let lastIsPublishing: boolean | undefined;
    let lastIsJoined: boolean | undefined;

    const sync = () => {
      const state = call.state.store.getLatestValue();
      // constant-time lookup; scanning the participant array here would make a
      // single update cost O(participants x tiles) in a large call
      const participant = state.participantsBySessionId[participantSessionId];
      const isJoined = state.callingState === CallingState.JOINED;
      const isPublishing = !participant
        ? undefined
        : trackType === 'videoTrack'
          ? hasVideo(participant)
          : hasScreenShare(participant);
      const { dimensions: dimension } = dimensionsStore.getLatestValue();

      if (
        dimension === lastDimension &&
        isPublishing === lastIsPublishing &&
        isJoined === lastIsJoined
      ) {
        return;
      }
      lastDimension = dimension;
      lastIsPublishing = isPublishing;
      lastIsJoined = isJoined;

      if (!isJoined) return;
      // the participant has not appeared in the call state yet
      if (isPublishing === undefined) return;

      if (!isVisible || !isPublishing) {
        requestTrackWithDimensions(DebounceType.MEDIUM, undefined);
      } else if (dimension) {
        requestTrackWithDimensions(DebounceType.IMMEDIATE, dimension);
      }
    };

    // Two stores, both synchronous: `sync` reads what it needs from each, so
    // either one changing is simply a reason to re-check. Call state is
    // filtered first: every tile subscribes to the whole store, so without
    // this an unrelated write (stats, captions) wakes all of them.
    let lastIndex: unknown;
    let lastCallingState: unknown;
    const unsubscribeCallState = call.state.store.subscribe((state) => {
      if (
        state.participantsBySessionId === lastIndex &&
        state.callingState === lastCallingState
      ) {
        return;
      }
      lastIndex = state.participantsBySessionId;
      lastCallingState = state.callingState;
      sync();
    });
    const unsubscribeDimensions = dimensionsStore.subscribe(sync);

    return () => {
      unsubscribeCallState();
      unsubscribeDimensions();
    };
  }, [call, participantSessionId, trackType, isVisible, dimensionsStore]);

  return null;
};

TrackSubscriber.displayName = 'TrackSubscriber';

export default TrackSubscriber;
