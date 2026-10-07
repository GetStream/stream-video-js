import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { BadNetwork, MicOff, Pin, VideoSlash } from '../../icons';
import { SpeechIndicator } from '../Participant/ParticipantView/SpeechIndicator';
import { Z_INDEX } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Props for the StatusLabel component.
 */
export type StatusLabelProps = {
  /**
   * The text rendered in the label.
   */
  label?: string;
  /**
   * Rendered before the label — the screen-share indicator, for example.
   * Replaced by a spinner while `isConnecting` is true.
   */
  leadingIcon?: React.ReactNode;
  /**
   * Shows a spinner in place of the leading icon.
   */
  isConnecting?: boolean;
  isAudioMuted?: boolean;
  isVideoMuted?: boolean;
  isTrackPaused?: boolean;
  isPinned?: boolean;
  isSpeaking?: boolean;
  /**
   * The speech indicator doubles as the "microphone on" affordance, so it is
   * only rendered while the participant is unmuted. Set to false to leave it
   * out entirely.
   *
   * @default true
   */
  showSpeechIndicator?: boolean;
  testID?: string;
};

/**
 * The presentational label shown over a participant's video: a name (or any
 * text), an optional leading icon, and the audio/video/network/pin status
 * icons. It derives nothing itself — every value is passed in, which is what
 * lets it back both a live participant and the pre-join preview, where no
 * tracks exist yet.
 */
export const StatusLabel = ({
  label,
  leadingIcon,
  isConnecting = false,
  isAudioMuted = false,
  isVideoMuted = false,
  isTrackPaused = false,
  isPinned = false,
  isSpeaking = false,
  showSpeechIndicator = true,
  testID,
}: StatusLabelProps) => {
  const {
    theme: {
      components,
      primitives,
      semantics,
      participantLabel: { container, userNameLabel, iconContainer },
    },
  } = useTheme();

  const iconColor = semantics.textOnAccent;
  const iconSize = components.iconSizeSm;

  const showSpeech = showSpeechIndicator && !isAudioMuted;
  const hasStatusIcons =
    isAudioMuted || isVideoMuted || isTrackPaused || isPinned || showSpeech;

  return (
    <View style={[styles.container, container]} testID={testID}>
      {isConnecting ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        leadingIcon
      )}
      {label && (
        <Text
          style={[styles.userNameLabel, userNameLabel]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {label}
        </Text>
      )}
      {hasStatusIcons && (
        <View
          style={[
            styles.iconContainer,
            iconContainer,
            { paddingRight: isAudioMuted ? primitives.spacingXxs : 0 },
          ]}
        >
          {isAudioMuted && <MicOff color={iconColor} size={iconSize} />}
          {isVideoMuted && <VideoSlash color={iconColor} size={iconSize} />}
          {isTrackPaused && <BadNetwork color={iconColor} size={iconSize} />}
          {isPinned && <Pin color={iconColor} size={iconSize} />}
          {showSpeech && <SpeechIndicator isSpeaking={isSpeaking} />}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: Z_INDEX.IN_FRONT,
  },
  userNameLabel: {
    flexShrink: 1,
  },
  iconContainer: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});
