import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar } from '../../utility';
import { type ParticipantViewProps } from './ParticipantView';
import { useTheme } from '../../../contexts/ThemeContext';

/**
 * Props for the ParticipantVideoFallback component.
 */
export type ParticipantVideoFallbackProps = Pick<
  ParticipantViewProps,
  'participant'
>;

/**
 * This component is used to customize the video fallback of the participant, when the video is disabled.
 */
export const ParticipantVideoFallback = ({
  participant,
}: ParticipantVideoFallbackProps) => {
  const {
    theme: { participantVideoFallback },
  } = useTheme();

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        styles.container,
        participantVideoFallback.container,
      ]}
    >
      <Avatar user={participant} style={participantVideoFallback.avatar} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
