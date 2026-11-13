import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../theme';
import { RecordCall, ScreenShare, Verified } from '../../icons';
import {
  useCallStateHooks,
  useToggleCallRecording,
} from '@stream-io/video-react-bindings';
import { hasScreenShare } from '@stream-io/video-client';

type DurationTextPart = { text: string; highlight: boolean };

/**
 * Colons and leading zeros (including an all-zero duration) use the highlight
 * style. Once a non-zero digit appears, remaining digits stay on the primary
 * text style. e.g. `00:33` → highlight `00:`, primary `33`.
 */
const getDurationTextParts = (formatted: string): DurationTextPart[] => {
  const parts: DurationTextPart[] = [];
  let seenSignificantDigit = false;

  for (const char of formatted) {
    const highlight = char === ':' || (char === '0' && !seenSignificantDigit);
    if (char >= '1' && char <= '9') {
      seenSignificantDigit = true;
    }

    const last = parts[parts.length - 1];
    if (last && last.highlight === highlight) {
      last.text += char;
    } else {
      parts.push({ text: char, highlight });
    }
  }

  return parts;
};

const getIcons = (
  isE2eeEnabled: boolean,
  isCallRecordingInProgress: boolean,
  hasPublishedScreenShare: boolean,
  semantics: Theme['semantics'],
  iconSize: number,
) => {
  const icons: React.ReactNode[] = [];
  if (isE2eeEnabled) {
    icons.push(
      <Verified key="e2ee" color={semantics.accentSuccess} size={iconSize} />,
    );
  }
  if (isCallRecordingInProgress) {
    icons.push(
      <RecordCall
        key="recording"
        color={semantics.accentError}
        size={iconSize}
      />,
    );
  }
  if (hasPublishedScreenShare) {
    icons.push(
      <ScreenShare
        key="screenShare"
        color={semantics.accentPrimary}
        size={iconSize}
      />,
    );
  }
  return icons;
};

/**
 * Props for the DurationIndicator component.
 */
export type DurationIndicatorProps = {
  /**
   * The duration to render, already formatted — e.g. `01:23`.
   */
  duration: string;
  /**
   * Rendered before the duration: a recording dot, a screen-share icon, etc.
   */
  icon?: React.ReactNode;
  /**
   * Renders colons and leading zeros with the `textHighlight` style, so `00:33`
   * shows `00:` dimmed.
   *
   * @default true
   */
  highlightLeadingZeros?: boolean;
  /**
   * Overrides the styles, which otherwise come from the
   * `callDurationIndicator` theme slot.
   */
  style?: {
    container?: StyleProp<ViewStyle>;
    text?: StyleProp<TextStyle>;
    textHighlight?: StyleProp<TextStyle>;
  };
};

/**
 * Renders a duration with an optional leading icon. It holds no timing logic of
 * its own — the caller formats the value — which is what lets both the in-call
 * indicator and the livestream badge share it.
 */
export const DurationIndicator = ({
  duration,
  icon: iconProp,
  highlightLeadingZeros = true,
  style,
}: DurationIndicatorProps) => {
  const {
    theme: { callDurationIndicator, semantics, components },
  } = useTheme();

  const { useLocalParticipant, useE2eeEnabled } = useCallStateHooks();
  const { isCallRecordingInProgress } = useToggleCallRecording();
  const localParticipant = useLocalParticipant();
  const isE2eeEnabled = useE2eeEnabled();
  const hasPublishedScreenShare =
    localParticipant && hasScreenShare(localParticipant);

  const containerStyle = style?.container ?? callDurationIndicator.container;
  const textStyle = style?.text ?? callDurationIndicator.text;
  const textHighlightStyle =
    style?.textHighlight ?? callDurationIndicator.textHighlight;

  const durationParts = highlightLeadingZeros
    ? getDurationTextParts(duration)
    : [{ text: duration, highlight: false }];

  const icons = getIcons(
    isE2eeEnabled,
    isCallRecordingInProgress,
    !!hasPublishedScreenShare,
    semantics,
    components.iconSizeMd,
  );

  return (
    <View style={[styles.container, containerStyle]}>
      {iconProp ??
        (icons.length > 0 && <View style={styles.icons}>{icons}</View>)}
      <Text style={textStyle}>
        {durationParts.map((part, index) => (
          <Text
            key={index}
            style={part.highlight ? textHighlightStyle : undefined}
          >
            {part.text}
          </Text>
        ))}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
