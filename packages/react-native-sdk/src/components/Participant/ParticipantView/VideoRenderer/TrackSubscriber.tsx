import { forwardRef, useImperativeHandle, useEffect, useMemo } from 'react';
import { LayoutChangeEvent } from 'react-native';
import {
  Call,
  CallingState,
  hasScreenShare,
  hasVideo,
  SfuModels,
  type VideoTrackType,
  DebounceType,
} from '@stream-io/video-client';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  distinctUntilKeyChanged,
  map,
  takeWhile,
} from 'rxjs';
export type TrackSubscriberHandle = {
  onLayoutUpdate: (event: LayoutChangeEvent) => void;
};

type TrackSubscriberProps = {
  participantSessionId: string;
  call: Call;
  trackType: VideoTrackType;
  isVisible: boolean;
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
const TrackSubscriber = forwardRef<TrackSubscriberHandle, TrackSubscriberProps>(
  (props, ref) => {
    const { call, participantSessionId, trackType, isVisible } = props;
    const dimensions$ = useMemo(() => {
      return new BehaviorSubject<SfuModels.VideoDimension | undefined>(
        undefined,
      );
    }, []);

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
        call.dynascaleManager.applyTrackSubscriptions(debounceType);
      };
      const isPublishingTrack$ = call.state.participants$.pipe(
        map((ps) => ps.find((p) => p.sessionId === participantSessionId)),
        takeWhile((p) => !!p),
        distinctUntilChanged(),
        distinctUntilKeyChanged('publishedTracks'),
        map((p) =>
          trackType === 'videoTrack' ? hasVideo(p) : hasScreenShare(p),
        ),
        distinctUntilChanged(),
      );
      const isJoinedState$ = call.state.callingState$.pipe(
        map((callingState) => callingState === CallingState.JOINED),
      );

      const subscription = combineLatest([
        dimensions$,
        isPublishingTrack$,
        isJoinedState$,
      ]).subscribe(([dimension, isPublishing, isJoined]) => {
        if (isJoined && isPublishing && !isVisible) {
          // the participant is publishing and we are not visible, so we unsubscribe from the video track
          requestTrackWithDimensions(DebounceType.FAST, undefined);
        } else if (isJoined && isPublishing && isVisible && dimension) {
          // the participant is publishing and we are visible and have valid dimensions, so we subscribe to the video track
          requestTrackWithDimensions(DebounceType.IMMEDIATE, dimension);
        } else if (isJoined && !isPublishing) {
          // the participant stopped publishing a track, so we unsubscribe from the video track
          requestTrackWithDimensions(DebounceType.FAST, undefined);
        }
        // if isPublishing but no dimension yet, we wait for dimensions
      });

      return () => {
        subscription.unsubscribe();
      };
    }, [call, participantSessionId, trackType, isVisible, dimensions$]);

    useImperativeHandle(
      ref,
      () => ({
        onLayoutUpdate: (event) => {
          const dimension = {
            width: Math.trunc(event.nativeEvent.layout.width),
            height: Math.trunc(event.nativeEvent.layout.height),
          };
          dimensions$.next(dimension);
        },
      }),
      [dimensions$],
    );

    return null;
  },
);

TrackSubscriber.displayName = 'TrackSubscriber';

export default TrackSubscriber;
