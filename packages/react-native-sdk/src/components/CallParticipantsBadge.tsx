import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Participants } from '../icons';
import { useParticipants } from '@stream-io/video-react-bindings';
import { theme } from '../theme';
interface CallParticipantsBadgeProps {
  /**
   * Handler called when the participants info button is pressed in the active call screen.
   */
  onOpenCallParticipantsInfoView: () => void;
}

export const CallParticipantsBadge = ({
  onOpenCallParticipantsInfoView,
}: CallParticipantsBadgeProps) => {
  const participants = useParticipants();

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
    </Pressable>
  );
};

const styles = StyleSheet.create({
  participantIcon: {
    position: 'absolute',
    right: 20,
    top: Platform.OS === 'ios' ? 35 : 10,
    zIndex: 2,
  },
  svgContainerStyle: {},
  badge: {
    backgroundColor: theme.light.text_low_emphasis,
    borderRadius: 30,
    padding: theme.padding.xs,
    position: 'relative',
    left: 10,
    top: 5,
    zIndex: 4,
  },
  badgeText: {
    color: theme.light.static_white,
    textAlign: 'center',
    ...theme.fonts.caption,
  },
});
