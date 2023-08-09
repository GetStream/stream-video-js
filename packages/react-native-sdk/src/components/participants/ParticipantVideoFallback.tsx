import React from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../utility';
import { StreamVideoParticipant } from '@stream-io/video-client';
import { theme } from '../../theme';

export type ParticipantVideoFallbackProps = {
  /**
   * The participant whose info will be displayed.
   */
  participant: StreamVideoParticipant;
  /**
   * Invoked on mount and layout changes with
   * {nativeEvent: { layout: {x, y, width, height}}}.
   */
  onLayout?: ((event: LayoutChangeEvent) => void) | undefined;
};

export const ParticipantVideoFallback = ({
  participant,
  onLayout,
}: ParticipantVideoFallbackProps) => {
  const { name, image, userId } = participant;
  const participantLabel = name ?? userId;

  // Display the Participant name/user id if the image isn't present.
  return (
    <View style={styles.container} onLayout={onLayout}>
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
