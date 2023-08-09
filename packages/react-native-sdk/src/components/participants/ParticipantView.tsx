import React, { ComponentType, useEffect, useRef } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import {
  CallingState,
  SfuModels,
  StreamVideoParticipant,
  VisibilityState,
} from '@stream-io/video-client';
import { useCall, useCallCallingState } from '@stream-io/video-react-bindings';
import { Z_INDEX } from '../../constants';
import { theme } from '../../theme';
import { palette } from '../../theme/constants';
import {
  ParticipantNetworkQualityIndicator as DefaultParticipantNetworkQualityIndicator,
  ParticipantNetworkQualityIndicatorProps,
} from './ParticipantNetworkQualityIndicator';
import {
  ParticipantReaction as DefaultParticipantReaction,
  ParticipantReactionProps,
} from './ParticipantReaction';
import {
  ParticipantLabel as DefaultParticipantLabel,
  ParticipantLabelProps,
} from './ParticipantLabel';
import {
  ParticipantVideo as DefaultParticipantVideo,
  ParticipantVideoProps,
} from './ParticipantVideo';
import { ParticipantVideoPlaceholderProps } from './ParticipantVideoPlaceholder';

export type ParticipantVideoType = 'video' | 'screen';

/**
 * Props to be passed for the Participant component.
 */
export type ParticipantViewProps = {
  /**
   * The participant that will be displayed
   */
  participant: StreamVideoParticipant;
  /**
   * The video kind that will be displayed
   */
  videoMode: ParticipantVideoType;
  /**
   * Any custom style to be merged with the participant view
   */
  containerStyle?: StyleProp<ViewStyle>;

  /**
   * When set to false, the video stream will not be shown even if it is available.
   */
  muteVideo?: boolean;
  /**
   * Component to customize the Label of the participant.
   */
  ParticipantLabel?: ComponentType<ParticipantLabelProps>;
  /**
   * Component to customize the reaction container of the participant.
   */
  ParticipantReaction?: ComponentType<ParticipantReactionProps>;
  /**
   * Component to customize the video component of the participant.
   */
  ParticipantVideo?: ComponentType<ParticipantVideoProps>;
  /**
   * Component to customize the video placeholder of the participant, when the video is disabled.
   */
  ParticipantVideoPlaceholder?: ComponentType<ParticipantVideoPlaceholderProps>;
  /**
   * Component to customize the network quality indicator of the participant.
   */
  ParticipantNetworkQualityIndicator?: ComponentType<ParticipantNetworkQualityIndicatorProps>;
};

/**
 * A component that renders the participants' video track or screenShare track
 * and additional info. By an absence of a video track or when muteVideo is truthy,
 * only an avatar and audio track will be rendered.
 */
export const ParticipantView = (props: ParticipantViewProps) => {
  const {
    participant,
    videoMode,
    muteVideo = false,
    ParticipantLabel = DefaultParticipantLabel,
    ParticipantReaction = DefaultParticipantReaction,
    ParticipantVideo = DefaultParticipantVideo,
    ParticipantNetworkQualityIndicator = DefaultParticipantNetworkQualityIndicator,
    ParticipantVideoPlaceholder,
  } = props;

  const call = useCall();
  const callingState = useCallCallingState();
  const hasJoinedCall = callingState === CallingState.JOINED;
  const pendingVideoLayoutRef = useRef<SfuModels.VideoDimension>();
  const subscribedVideoLayoutRef = useRef<SfuModels.VideoDimension>();
  const {
    isSpeaking,
    publishedTracks,
    sessionId,
    userId,
    viewportVisibilityState,
  } = participant;
  const isPublishingVideoTrack = publishedTracks.includes(
    videoMode === 'video'
      ? SfuModels.TrackType.VIDEO
      : SfuModels.TrackType.SCREEN_SHARE,
  );

  /**
   * This effect updates the participant's viewportVisibilityState
   * Additionally makes sure that when this view becomes visible again, the layout to subscribe is known
   */
  useEffect(() => {
    if (!call) {
      return;
    }
    if (!muteVideo) {
      if (viewportVisibilityState !== VisibilityState.VISIBLE) {
        call.state.updateParticipant(sessionId, (p) => ({
          ...p,
          viewportVisibilityState: VisibilityState.VISIBLE,
        }));
      }
    } else {
      if (viewportVisibilityState !== VisibilityState.INVISIBLE) {
        call.state.updateParticipant(sessionId, (p) => ({
          ...p,
          viewportVisibilityState: VisibilityState.INVISIBLE,
        }));
      }
      if (subscribedVideoLayoutRef.current) {
        // when video is enabled again, we want to use the last subscribed dimension to resubscribe
        pendingVideoLayoutRef.current = subscribedVideoLayoutRef.current;
        subscribedVideoLayoutRef.current = undefined;
      }
    }
  }, [sessionId, viewportVisibilityState, muteVideo, call]);

  useEffect(() => {
    if (!hasJoinedCall && subscribedVideoLayoutRef.current) {
      // when call is joined again, we want to use the last subscribed dimension to resubscribe
      pendingVideoLayoutRef.current = subscribedVideoLayoutRef.current;
      subscribedVideoLayoutRef.current = undefined;
    }
  }, [hasJoinedCall]);

  /**
   * This effect updates the subscription either
   * 1. when video tracks are published and was unpublished before
   * 2. when the view's visibility changes
   * 3. when call was rejoined
   */
  useEffect(() => {
    // NOTE: We only want to update the subscription if the pendingVideoLayoutRef is set
    const updateIsNeeded = pendingVideoLayoutRef.current;
    if (!updateIsNeeded || !call || !isPublishingVideoTrack || !hasJoinedCall) {
      return;
    }

    // NOTE: When the view is not visible, we want to subscribe to audio only.
    // We unsubscribe their video by setting the dimension to undefined
    const dimension = !muteVideo ? pendingVideoLayoutRef.current : undefined;

    call.updateSubscriptionsPartial(videoMode, {
      [sessionId]: { dimension },
    });

    if (dimension) {
      subscribedVideoLayoutRef.current = pendingVideoLayoutRef.current;
      pendingVideoLayoutRef.current = undefined;
    }
  }, [
    call,
    isPublishingVideoTrack,
    videoMode,
    sessionId,
    muteVideo,
    hasJoinedCall,
  ]);

  useEffect(() => {
    return () => {
      subscribedVideoLayoutRef.current = undefined;
      pendingVideoLayoutRef.current = undefined;
    };
  }, [videoMode, sessionId]);

  const onLayout: React.ComponentProps<typeof View>['onLayout'] = (event) => {
    const dimension = {
      width: Math.trunc(event.nativeEvent.layout.width),
      height: Math.trunc(event.nativeEvent.layout.height),
    };

    // NOTE: If the participant hasn't published a video track yet,
    // or the view is not viewable, we store the dimensions and handle it
    // when the track is published or the video is enabled.
    if (!call || !isPublishingVideoTrack || muteVideo || !hasJoinedCall) {
      pendingVideoLayoutRef.current = dimension;
      return;
    }

    // NOTE: We don't want to update the subscription if the dimension hasn't changed
    if (
      subscribedVideoLayoutRef.current?.width === dimension.width &&
      subscribedVideoLayoutRef.current?.height === dimension.height
    ) {
      return;
    }

    call.updateSubscriptionsPartial(videoMode, {
      [sessionId]: {
        dimension,
      },
    });
    subscribedVideoLayoutRef.current = dimension;
    pendingVideoLayoutRef.current = undefined;
  };

  const isScreenSharing = videoMode === 'screen';
  const applySpeakerStyle = isSpeaking && !isScreenSharing;
  const speakerStyle = applySpeakerStyle && styles.isSpeaking;

  return (
    <View
      style={[styles.containerBase, props.containerStyle, speakerStyle]}
      testID={`participant-${userId}`}
      accessibilityValue={{
        text: isSpeaking
          ? 'participant-is-speaking'
          : 'participant-is-not-speaking',
      }}
      onLayout={onLayout}
    >
      <View style={styles.topView}>
        <ParticipantReaction participant={participant} />
      </View>
      <ParticipantVideo
        muteVideo={muteVideo}
        participant={participant}
        videoMode={videoMode}
        ParticipantVideoPlaceholder={ParticipantVideoPlaceholder}
      />
      <View style={styles.bottomView}>
        <ParticipantLabel participant={participant} videoMode={videoMode} />
        <ParticipantNetworkQualityIndicator participant={participant} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  containerBase: {
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.padding.xs,
    borderColor: palette.grey800,
    borderWidth: 2,
  },
  topView: {
    alignSelf: 'flex-start',
    zIndex: Z_INDEX.IN_FRONT,
  },
  bottomView: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: Z_INDEX.IN_FRONT,
  },
  isSpeaking: {
    borderColor: theme.light.primary,
    borderWidth: 2,
  },
});
