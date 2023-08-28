import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Participants } from '../../../icons';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { Z_INDEX } from '../../../constants';
import { CallTopViewProps } from '..';
import { ButtonTestIds } from '../../../constants/TestIds';
import { useTheme } from '../../../contexts/ThemeContext';

/**
 * Props for the ParticipantsInfoBadge component.
 */
export type ParticipantsInfoBadgeProps = Pick<
  CallTopViewProps,
  'onParticipantInfoPress'
>;

/**
 * Badge that shows the number of participants in the call.
 * When pressed, it opens the ParticipantsInfoList.
 */
export const ParticipantsInfoBadge = ({
  onParticipantInfoPress,
}: ParticipantsInfoBadgeProps) => {
  const {
    theme: {
      colors,
      participantInfoBadge,
      typefaces,
      variants: { iconSizes },
    },
  } = useTheme();
  const { useParticipantCount } = useCallStateHooks();
  const participantCount = useParticipantCount();

  return (
    <Pressable
      onPress={onParticipantInfoPress}
      style={({ pressed }) => [
        styles.container,
        { opacity: pressed ? 0.2 : 1 },
        participantInfoBadge.container,
      ]}
      disabled={!onParticipantInfoPress}
      testID={ButtonTestIds.PARTICIPANTS_INFO}
    >
      <View
        style={[
          { height: iconSizes.md, width: iconSizes.md },
          participantInfoBadge.participantsIconContainer,
        ]}
      >
        <Participants color={colors.static_white} />
      </View>
      <View
        style={[
          styles.participantCountContainer,
          {
            backgroundColor: colors.text_low_emphasis,
          },
          participantInfoBadge.participantCountContainer,
        ]}
      >
        <Text
          style={[
            styles.participantCountText,
            {
              color: colors.static_white,
            },
            typefaces.subtitle,
            participantInfoBadge.participantsCountText,
          ]}
        >
          {participantCount}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  participantCountContainer: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRadius: 30,
    zIndex: Z_INDEX.IN_FRONT,
    bottom: 12,
    right: 12,
  },
  participantCountText: {
    includeFontPadding: false,
    textAlign: 'center',
  },
});
