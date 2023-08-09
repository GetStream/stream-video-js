import React, { ComponentType } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { StreamVideoParticipant } from '@stream-io/video-client';
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
import { ParticipantVideoFallbackProps } from './ParticipantVideoFallback';
import {
  VideoRenderer as DefaultVideoRenderer,
  VideoRendererProps,
} from './VideoRenderer';

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
   *
   * @default false
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
  VideoRenderer?: ComponentType<VideoRendererProps>;
  /**
   * Component to customize the video fallback of the participant, when the video is disabled.
   */
  ParticipantVideoFallback?: ComponentType<ParticipantVideoFallbackProps>;
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
    muteVideo,
    ParticipantLabel = DefaultParticipantLabel,
    ParticipantReaction = DefaultParticipantReaction,
    VideoRenderer = DefaultVideoRenderer,
    ParticipantNetworkQualityIndicator = DefaultParticipantNetworkQualityIndicator,
    ParticipantVideoFallback,
  } = props;

  const { isSpeaking, userId } = participant;

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
    >
      <ParticipantReaction participant={participant} />
      <VideoRenderer
        muteVideo={muteVideo}
        participant={participant}
        videoMode={videoMode}
        ParticipantVideoFallback={ParticipantVideoFallback}
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
    justifyContent: 'space-between',
    padding: theme.padding.xs,
    borderColor: palette.grey800,
    borderWidth: 2,
  },
  bottomView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  isSpeaking: {
    borderColor: theme.light.primary,
    borderWidth: 2,
  },
});
