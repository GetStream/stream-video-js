import React, { useCallback, useState } from 'react';
import {
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Participants } from '../../icons';
import { useParticipantCount } from '@stream-io/video-react-bindings';
import { theme } from '../../theme';
import { ButtonTestIds } from '../../constants/TestIds';
import { Z_INDEX } from '../../constants';
import { ParticipantsInfoList } from './ParticipantsInfoList';

export type ParticipantsInfoBadgeProps = Pick<PressableProps, 'style'>;

/**
 * Badge that shows the number of participants in the call.
 * When pressed, it opens the ParticipantsInfoList.
 * @param style
 */
export const ParticipantsInfoBadge = ({
  style,
}: ParticipantsInfoBadgeProps) => {
  const participantCount = useParticipantCount();
  const [isCallParticipantsVisible, setIsCallParticipantsVisible] =
    useState<boolean>(false);

  const onOpenCallParticipantsInfo = useCallback(() => {
    setIsCallParticipantsVisible(true);
  }, [setIsCallParticipantsVisible]);

  return (
    <Pressable
      onPress={onOpenCallParticipantsInfo}
      testID={ButtonTestIds.PARTICIPANTS_INFO}
      style={style}
    >
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{participantCount}</Text>
      </View>
      <View style={theme.icon.md}>
        <Participants color={theme.light.static_white} />
      </View>
      <ParticipantsInfoList
        isCallParticipantsInfoVisible={isCallParticipantsVisible}
        setIsCallParticipantsInfoVisible={setIsCallParticipantsVisible}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: theme.light.text_low_emphasis,
    borderRadius: theme.rounded.xl,
    paddingVertical: theme.padding.xs,
    paddingHorizontal: theme.padding.sm,
    zIndex: Z_INDEX.IN_FRONT,
    top: theme.spacing.sm,
    left: theme.spacing.xl,
  },
  badgeText: {
    color: theme.light.static_white,
    textAlign: 'center',
    ...theme.fonts.caption,
  },
});
