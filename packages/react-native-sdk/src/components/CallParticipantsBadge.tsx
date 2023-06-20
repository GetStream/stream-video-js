import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Participants } from '../icons';
import { useParticipantCount } from '@stream-io/video-react-bindings';
import { theme } from '../theme';
import { CallParticipantsInfoView } from './CallParticipantsInfoView';
import { A11yButtons } from '../constants/A11yLabels';

export const CallParticipantsBadge = () => {
  const participantCount = useParticipantCount();
  const [isCallParticipantsViewVisible, setIsCallParticipantsViewVisible] =
    useState<boolean>(false);

  const onOpenCallParticipantsInfoView = useCallback(() => {
    setIsCallParticipantsViewVisible(true);
  }, [setIsCallParticipantsViewVisible]);

  return (
    <Pressable
      onPress={onOpenCallParticipantsInfoView}
      accessibilityLabel={A11yButtons.PARTICIPANTS_INFO}
      style={styles.container}
    >
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{participantCount}</Text>
      </View>
      <View style={theme.icon.md}>
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
  container: { padding: theme.padding.sm },
  badge: {
    backgroundColor: theme.light.text_low_emphasis,
    borderRadius: theme.rounded.xl,
    paddingVertical: theme.padding.xs,
    paddingHorizontal: theme.padding.sm,
    position: 'absolute',
    right: 0,
    top: -theme.spacing.sm,
    zIndex: 2,
  },
  badgeText: {
    color: theme.light.static_white,
    ...theme.fonts.caption,
  },
});
