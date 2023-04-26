import { StreamReaction } from '@stream-io/video-client';
import { Cross } from '../icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { theme } from '../theme';
import { useCallback } from 'react';
import { useActiveCall } from '@stream-io/video-react-bindings';
import { Text } from 'react-native';
import { defaultEmojiReactions } from '../constants';

const reactions: StreamReaction[] = [
  {
    type: 'reaction',
    emoji_code: ':like:',
    custom: {},
  },
  {
    // TODO OL: use `prompt` type?
    type: 'raised-hand',
    emoji_code: ':raise-hand:',
    custom: {},
  },
  {
    type: 'reaction',
    emoji_code: ':fireworks:',
    custom: {},
  },
];

type ReactionModalType = {
  setReactionModal: React.Dispatch<React.SetStateAction<boolean>>;
};

export const ReactionModal = (props: ReactionModalType) => {
  const { setReactionModal } = props;
  const onCloseParticipantOptions = useCallback(() => {
    setReactionModal(false);
  }, [setReactionModal]);
  const call = useActiveCall();

  const sendReaction = (reaction: StreamReaction) => {
    call?.sendReaction(reaction);
  };

  return (
    <View style={styles.container}>
      <View style={styles.menu}>
        <View style={styles.reactions}>
          {reactions.map((reaction) => (
            <Pressable onPress={() => sendReaction(reaction)}>
              <Text>
                {reaction.emoji_code &&
                  defaultEmojiReactions[reaction.emoji_code]}
              </Text>
            </Pressable>
          ))}
          <Pressable
            style={[styles.svgContainerStyle, theme.icon.sm]}
            onPress={onCloseParticipantOptions}
          >
            <Cross color={theme.light.primary} />
          </Pressable>
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
  reactions: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.padding.md,
  },
  svgContainerStyle: {},
});
