import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../../utility';
import { theme } from '../../../theme';
import { ParticipantViewProps } from './ParticipantView';

export type ParticipantVideoFallbackProps = Pick<
  ParticipantViewProps,
  'participant'
>;

export const ParticipantVideoFallback = ({
  participant,
}: ParticipantVideoFallbackProps) => {
  const { name, image, userId } = participant;
  const participantLabel = name ?? userId;

  // Display the Participant name/user id if the image isn't present.
  return (
    <View style={styles.container}>
      {!image ? (
        <Text style={styles.label}>{participantLabel}</Text>
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
    backgroundColor: theme.light.disabled,
    ...StyleSheet.absoluteFillObject,
  },
  label: {
    ...theme.fonts.bodyBold,
    color: theme.light.static_white,
  },
});
