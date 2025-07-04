import React, { type ComponentType, useMemo } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import {
  type StreamVideoParticipant,
  type VideoTrackType,
} from '@stream-io/video-client';
import {
  ParticipantNetworkQualityIndicator as DefaultParticipantNetworkQualityIndicator,
  type ParticipantNetworkQualityIndicatorProps,
} from './ParticipantNetworkQualityIndicator';
import {
  ParticipantReaction as DefaultParticipantReaction,
  type ParticipantReactionProps,
} from './ParticipantReaction';
import {
  ParticipantLabel as DefaultParticipantLabel,
  type ParticipantLabelProps,
} from './ParticipantLabel';
import {
  ParticipantVideoFallback as DefaultParticipantVideoFallback,
  type ParticipantVideoFallbackProps,
} from './ParticipantVideoFallback';
import {
  VideoRenderer as DefaultVideoRenderer,
  type VideoRendererProps,
} from './VideoRenderer';
import { useTheme } from '../../../contexts/ThemeContext';
import type { CallContentProps } from '../../Call';

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
export type ParticipantViewProps = ParticipantViewComponentProps &
  Pick<CallContentProps, 'supportedReactions'> & {
    /**
     * The participant that will be displayed.
     */
    participant: StreamVideoParticipant;
    /**
     * The zOrder for the video that will be displayed.
     * For example, a video call
     * application usually needs a maximum of two zOrder values: 0 for the
     * remote video(s) which appear in the background, and 1 for the local
     * video(s) which appear above the remote video(s).
     * @default 0
     */
    videoZOrder?: number;
    /**
     * The video track that is to be displayed.
     */
    trackType?: VideoTrackType;
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
    /**
     * Represents how the video view fits within the parent view.
     *
     * In the fashion of https://www.w3.org/TR/html5/embedded-content-0.html#dom-video-videowidth and https://www.w3.org/TR/html5/rendering.html#video-object-fit, resembles the CSS style object-fit.
     */
    objectFit?: 'contain' | 'cover';
  };

/**
 * A component that renders the participants' video track or screenShare track
 * and additional info. By an absence of a video track or when isVisible is truthy,
 * only an avatar and audio track will be rendered.
 */
export const ParticipantView = ({
  participant,
  trackType = 'videoTrack',
  isVisible = true,
  style,
  ParticipantLabel = DefaultParticipantLabel,
  ParticipantReaction = DefaultParticipantReaction,
  VideoRenderer = DefaultVideoRenderer,
  ParticipantNetworkQualityIndicator = DefaultParticipantNetworkQualityIndicator,
  ParticipantVideoFallback = DefaultParticipantVideoFallback,
  objectFit,
  videoZOrder = 0,
  supportedReactions,
}: ParticipantViewProps) => {
  const {
    theme: { colors, participantView },
  } = useTheme();
  const { isSpeaking, userId } = participant;
  const styles = useStyles();
  const isScreenSharing = trackType === 'screenShareTrack';
  const applySpeakerStyle = isSpeaking && !isScreenSharing;
  const speakerStyle = applySpeakerStyle && [
    { borderColor: colors.buttonPrimary },
    participantView.highlightedContainer,
  ];

  return (
    <View
      style={[styles.container, style, speakerStyle]}
      testID={
        isSpeaking
          ? `participant-${userId}-is-speaking`
          : `participant-${userId}-is-not-speaking`
      }
    >
      {ParticipantReaction && (
        <ParticipantReaction
          participant={participant}
          supportedReactions={supportedReactions}
        />
      )}
      {VideoRenderer && (
        <VideoRenderer
          isVisible={isVisible}
          participant={participant}
          trackType={trackType}
          ParticipantVideoFallback={ParticipantVideoFallback}
          objectFit={objectFit}
          videoZOrder={videoZOrder}
        />
      )}
      <View
        style={[
          styles.footerContainer,
          participantView.footerContainer,
          !ParticipantLabel && styles.networkIndicatorOnly,
        ]}
      >
        {ParticipantLabel && (
          <ParticipantLabel participant={participant} trackType={trackType} />
        )}
        {ParticipantNetworkQualityIndicator && (
          <ParticipantNetworkQualityIndicator participant={participant} />
        )}
      </View>
    </View>
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          overflow: 'hidden',
          justifyContent: 'flex-end',
          borderRadius: theme.variants.borderRadiusSizes.md,
          borderWidth: 2,
          borderColor: 'transparent',
        },
        footerContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        networkIndicatorOnly: { justifyContent: 'flex-end' },
      }),
    [theme],
  );
};
