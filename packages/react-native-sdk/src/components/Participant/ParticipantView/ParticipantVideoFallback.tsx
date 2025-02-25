import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
    theme: { colors, typefaces, participantVideoFallback },
  } = useTheme();
  const { name, image, userId } = participant;
  const participantLabel = name ?? userId;

  // Display the Participant name/user id if the image isn't present.
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.sheetTertiary },
        participantVideoFallback.container,
      ]}
    >
      {!image ? (
        <Text
          style={[
            { color: colors.textPrimary },
            typefaces.bodyBold,
            participantVideoFallback.label,
          ]}
        >
          {participantLabel}
        </Text>
      ) : (
        <Avatar
          participant={participant}
          style={{
            container: participantVideoFallback.avatarContainer,
            image: participantVideoFallback.avatarImage,
            text: participantVideoFallback.avatarText,
          }}
        />
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
