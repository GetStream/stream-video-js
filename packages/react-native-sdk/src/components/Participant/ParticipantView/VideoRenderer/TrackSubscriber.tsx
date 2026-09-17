import { useEffect } from 'react';
import { Platform } from 'react-native';
import {
  Call,
  CallingState,
  DebounceType,
  hasScreenShare,
  hasVideo,
  SfuModels,
  type StreamVideoParticipant,
  type VideoTrackType,
} from '@stream-io/video-client';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
  map,
} from 'rxjs';
import { getIosVideoSubscriptionDemand } from '../../../../utils/internal/IosVideoSubscriptionDemand';

type TrackSubscriberProps = {
  participantSessionId: string;
  call: Call;
  trackType: VideoTrackType;
  isVisible: boolean;
  /**
   * The dimensions of the view rendering the track, owned by the parent so that
   * the last reported layout survives a remount of this component.
   */
  dimensions$: BehaviorSubject<SfuModels.VideoDimension | undefined>;
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
 *
 * On iOS the request is not made directly: the demand of this view is registered
 * with the call's demand coordinator, which merges it with the demand of the
 * other surfaces rendering the same track - most notably the native Picture in
 * Picture window, whose bounds take precedence while it is active.
*/
const TrackSubscriber = (props: TrackSubscriberProps) => {
  const { call, participantSessionId, trackType, isVisible, dimensions$ } =
    props;

  useEffect(() => {
    const isPublishingTrack$ = call.state.participants$.pipe(
      map((ps) => ps.find((p) => p.sessionId === participantSessionId)),
      filter((p): p is StreamVideoParticipant => !!p),
      distinctUntilKeyChanged('publishedTracks'),
      map((p) =>
        trackType === 'videoTrack' ? hasVideo(p) : hasScreenShare(p),
      ),
      distinctUntilChanged(),
    );
    if (Platform.OS === 'ios') {
      // on iOS this view is only one of the surfaces that can render the track:
      // the native Picture in Picture window owns the dimensions of the track it
      // renders, so the demand of this view is merged in by the coordinator.
      const handle = getIosVideoSubscriptionDemand(call).registerInline({
        sessionId: participantSessionId,
        trackType,
      });
      const iosSubscription = combineLatest([
        dimensions$,
        isPublishingTrack$,
      ]).subscribe(([dimension, isPublishing]) => {
        handle.update({ dimension, eligible: isVisible && isPublishing });
      });
      return () => {
        iosSubscription.unsubscribe();
        handle.release();
      };
    }

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

    const isJoinedState$ = call.state.callingState$.pipe(
      map((callingState) => callingState === CallingState.JOINED),
    );

    const subscription = combineLatest([
      dimensions$,
      isPublishingTrack$,
      isJoinedState$,
    ]).subscribe(([dimension, isPublishing, isJoined]) => {
      if (isJoined) {
        if (!isVisible || !isPublishing) {
          requestTrackWithDimensions(DebounceType.MEDIUM, undefined);
        } else if (dimension) {
          requestTrackWithDimensions(DebounceType.IMMEDIATE, dimension);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [call, participantSessionId, trackType, isVisible, dimensions$]);

  return null;
};

TrackSubscriber.displayName = 'TrackSubscriber';

export default TrackSubscriber;
