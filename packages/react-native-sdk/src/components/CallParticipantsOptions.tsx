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
          <Avatar radius={theme.avatar.xs} participant={participant} />

          <Text style={styles.name}>
            {generateParticipantTitle(participant.userId) +
              (participant.isLoggedInUser ? ' (You)' : '')}
          </Text>
        </View>

        <Pressable
          style={styles.svgContainerStyle}
          onPress={onCloseParticipantOptions}
        >
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
              <View style={[styles.svgContainerStyle, theme.icon.sm]}>
                {option.icon}
              </View>
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
    marginLeft: theme.margin.sm,
    ...theme.fonts.subtitleBold,
  },
  svgContainerStyle: {},
  menu: {
    backgroundColor: theme.light.bars,
    width: '80%',
    borderRadius: 15,
  },
  participantInfo: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.padding.md,
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  options: {},
  option: {
    paddingHorizontal: theme.padding.md,
    paddingVertical: theme.padding.sm,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    marginLeft: theme.margin.md,
    color: theme.light.text_high_emphasis,
    ...theme.fonts.subtitle,
  },
  borderBottom: {
    borderBottomColor: theme.light.borders,
    borderBottomWidth: 1,
  },
});
