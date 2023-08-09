import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../utility';
import { StreamVideoParticipant } from '@stream-io/video-client';
import { theme } from '../../theme';

export type ParticipantVideoPlaceholderProps = {
  participant: StreamVideoParticipant;
};

export const ParticipantVideoPlaceholder = ({
  participant,
}: ParticipantVideoPlaceholderProps) => {
  const { name, image, userId } = participant;
  const participantLabel = name ?? userId;

  // Display the Participant name/user id if the image isn't present.
  if (!image) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>{participantLabel}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Avatar participant={participant} />
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
