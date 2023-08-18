import React, { ComponentType } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { StreamVideoParticipant } from '@stream-io/video-client';
import { theme } from '../../../theme';
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
  ParticipantVideoFallback as DefaultParticipantVideoFallback,
  ParticipantVideoFallbackProps,
} from './ParticipantVideoFallback';
import {
  VideoRenderer as DefaultVideoRenderer,
  VideoRendererProps,
} from './VideoRenderer';

export type ParticipantVideoType = 'video' | 'screen';

export type ParticipantViewComponentProps = {
  /**
   * Component to customize the Label of the participant.
   */
  ParticipantLabel?: ComponentType<ParticipantLabelProps> | null;
  /**
   * Component to customize the reaction container of the participant.
   */
  ParticipantReaction?: ComponentType<ParticipantReactionProps> | null;
  /**
   * Component to customize the video fallback of the participant, when the video is disabled.
   */
  ParticipantVideoFallback?: ComponentType<ParticipantVideoFallbackProps> | null;
  /**
   * Component to customize the network quality indicator of the participant.
   */
  ParticipantNetworkQualityIndicator?: ComponentType<ParticipantNetworkQualityIndicatorProps> | null;
  /**
   * Component to customize the video component of the participant.
   */
  VideoRenderer?: ComponentType<VideoRendererProps> | null;
};

/**
 * Props to be passed for the Participant component.
 */
export type ParticipantViewProps = ParticipantViewComponentProps & {
  /**
   * The participant that will be displayed.
   */
  participant: StreamVideoParticipant;
  /**
   * The video kind that will be displayed.
   */
  videoMode: ParticipantVideoType;
  /**
   * Custom style to be merged with the participant view.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * When set to false, the video stream will not be shown even if it is available.
   *
   * @default true
   */
  isVisible?: boolean;
};

/**
 * A component that renders the participants' video track or screenShare track
 * and additional info. By an absence of a video track or when isVisible is truthy,
 * only an avatar and audio track will be rendered.
 */
export const ParticipantView = ({
  participant,
  videoMode,
  isVisible = true,
  style,
  ParticipantLabel = DefaultParticipantLabel,
  ParticipantReaction = DefaultParticipantReaction,
  VideoRenderer = DefaultVideoRenderer,
  ParticipantNetworkQualityIndicator = DefaultParticipantNetworkQualityIndicator,
  ParticipantVideoFallback = DefaultParticipantVideoFallback,
}: ParticipantViewProps) => {
  const { isSpeaking, userId } = participant;
  const isScreenSharing = videoMode === 'screen';
  const applySpeakerStyle = isSpeaking && !isScreenSharing;
  const speakerStyle = applySpeakerStyle && styles.isSpeaking;

  return (
    <View
      style={[styles.container, style, speakerStyle]}
      testID={
        isSpeaking
          ? `participant-${userId}-is-speaking`
          : `participant-${userId}-is-not-speaking`
      }
    >
      {ParticipantReaction && <ParticipantReaction participant={participant} />}
      {VideoRenderer && (
        <VideoRenderer
          isVisible={isVisible}
          participant={participant}
          videoMode={videoMode}
          ParticipantVideoFallback={ParticipantVideoFallback}
        />
      )}
      <View style={styles.bottomView}>
        {ParticipantLabel && (
          <ParticipantLabel participant={participant} videoMode={videoMode} />
        )}
        {ParticipantNetworkQualityIndicator && (
          <ParticipantNetworkQualityIndicator participant={participant} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    padding: theme.padding.xs,
    overflow: 'hidden',
    margin: 2,
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
