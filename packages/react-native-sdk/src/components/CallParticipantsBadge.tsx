import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Participants } from '../icons';
import { useParticipants } from '@stream-io/video-react-bindings';

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
      <View style={styles.icon}>
        <Participants color="#fff" />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  participantIcon: {
    position: 'absolute',
    right: 20,
    top: 40,
    zIndex: 2,
  },
  icon: { height: 24, width: 27 },
  badge: {
    backgroundColor: '#72767E',
    borderRadius: 30,
    padding: 4,
    position: 'relative',
    left: 10,
    top: 5,
    zIndex: 4,
  },
  badgeText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
