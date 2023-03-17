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

  const showYouLabel = participant.isLoggedInUser;

  return (
    <View style={styles.container}>
      <View style={styles.menu}>
        <View style={styles.participantInfo}>
          <View style={styles.userInfo}>
            <Avatar radius={theme.avatar.xs} participant={participant} />

            <Text style={styles.name}>
              {generateParticipantTitle(participant.userId) +
                (showYouLabel ? ' (You)' : '')}
            </Text>
          </View>

          <Pressable
            style={[styles.svgContainerStyle, theme.icon.sm]}
            onPress={onCloseParticipantOptions}
          >
            <Cross color={theme.light.primary} />
          </Pressable>
        </View>
        <View style={styles.options}>
          {options.map((option, index) => {
            const applyBottomPadding =
              index < options.length - 1 ? styles.borderBottom : null;
            return (
              <Pressable
                style={[applyBottomPadding, styles.option]}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    paddingHorizontal: theme.padding.xl,
  },
  menu: {
    backgroundColor: theme.light.bars,
    borderRadius: theme.rounded.md,
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
  name: {
    marginLeft: theme.margin.sm,
    ...theme.fonts.subtitleBold,
  },
  svgContainerStyle: {},
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
