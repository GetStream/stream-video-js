import { StreamVideoParticipant } from '@stream-io/video-client';
import { Cross } from '../icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { generateParticipantTitle } from '../utils';
import { useCallback } from 'react';
import { Avatar } from './Avatar';
import { theme } from '../theme';
type CallParticipantType = {
  title: string;
  icon: JSX.Element;
};

const options: CallParticipantType[] = [];

type CallParticipantOptionsType = {
  participant: StreamVideoParticipant;
  setSelectedParticipant: React.Dispatch<
    React.SetStateAction<StreamVideoParticipant | undefined>
  >;
};

export const CallParticipantOptions = (props: CallParticipantOptionsType) => {
  const { participant, setSelectedParticipant } = props;

  const onCloseParticipantOptions = useCallback(() => {
    setSelectedParticipant(undefined);
  }, [setSelectedParticipant]);

  return (
    <View style={styles.menu}>
      <View style={styles.participantInfo}>
        <View style={styles.userInfo}>
          <Avatar radius={50} participant={participant} />

          <Text style={styles.name}>
            {generateParticipantTitle(participant.userId) +
              (participant.isLoggedInUser ? ' (You)' : '')}
          </Text>
        </View>

        <Pressable style={styles.icon} onPress={onCloseParticipantOptions}>
          <Cross color={theme.light.primary} />
        </Pressable>
      </View>
      <View style={styles.options}>
        {options.map((option, index) => {
          return (
            <Pressable
              style={[
                index < options.length - 1 ? styles.borderBottom : null,
                styles.option,
              ]}
              key={option.title}
            >
              <View style={styles.icon}>{option.icon}</View>
              <Text style={styles.title}>{option.title}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  name: {
    marginLeft: 10,
    ...theme.fonts.subtitleBold,
  },
  avatar: {
    height: 50,
    width: 50,
    borderRadius: 50,
  },
  icon: {
    height: 20,
    width: 20,
  },
  menu: {
    backgroundColor: theme.light.bars,
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: 'auto',
    marginBottom: 'auto',
    width: '80%',
    borderRadius: 15,
  },
  participantInfo: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  options: {},
  option: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    marginLeft: 20,
    color: theme.light.text_high_emphasis,
    ...theme.fonts.subtitle,
  },
  borderBottom: {
    borderBottomColor: theme.light.borders,
    borderBottomWidth: 1,
  },
});
