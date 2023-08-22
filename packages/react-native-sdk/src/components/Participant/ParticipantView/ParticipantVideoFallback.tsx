import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../../utility';
import { ParticipantViewProps } from './ParticipantView';
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
    theme: { colors, typefaces, participantVideoFallback },
  } = useTheme();
  const { name, image, userId } = participant;
  const participantLabel = name ?? userId;

  // Display the Participant name/user id if the image isn't present.
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.static_grey,
        },
        participantVideoFallback.container,
      ]}
    >
      {!image ? (
        <Text
          style={[
            {
              color: colors.static_white,
            },
            typefaces.bodyBold,
            participantVideoFallback.label,
          ]}
        >
          {participantLabel}
        </Text>
      ) : (
        <Avatar participant={participant} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    ...StyleSheet.absoluteFillObject,
  },
});
