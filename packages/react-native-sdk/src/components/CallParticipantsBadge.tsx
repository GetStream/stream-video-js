import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Participants } from '../icons';
import { useParticipants } from '@stream-io/video-react-bindings';
import { theme } from '../theme';
import { useCallback, useState } from 'react';
import { CallParticipantsInfoView } from './CallParticipantsInfoView';

export const CallParticipantsBadge = () => {
  // We use here participants over participantsCount
  // because participantsCount is not updated in real time (update from SFU)
  const participants = useParticipants();
  const [isCallParticipantsViewVisible, setIsCallParticipantsViewVisible] =
    useState<boolean>(false);

  const onOpenCallParticipantsInfoView = useCallback(() => {
    setIsCallParticipantsViewVisible(true);
  }, [setIsCallParticipantsViewVisible]);

  return (
    <Pressable
      style={styles.participantIcon}
      onPress={onOpenCallParticipantsInfoView}
    >
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{participants.length}</Text>
      </View>
      <View style={[styles.svgContainerStyle, theme.icon.md]}>
        <Participants color={theme.light.static_white} />
      </View>
      <CallParticipantsInfoView
        isCallParticipantsViewVisible={isCallParticipantsViewVisible}
        setIsCallParticipantsViewVisible={setIsCallParticipantsViewVisible}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  participantIcon: {
    zIndex: 2,
  },
  svgContainerStyle: {},
  badge: {
    backgroundColor: theme.light.text_low_emphasis,
    borderRadius: theme.rounded.xl,
    padding: theme.padding.xs,
    position: 'relative',
    left: theme.spacing.lg,
    top: theme.spacing.lg,
    zIndex: 2,
  },
  badgeText: {
    color: theme.light.static_white,
    textAlign: 'center',
    ...theme.fonts.caption,
  },
});
