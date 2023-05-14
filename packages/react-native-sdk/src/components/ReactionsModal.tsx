import { StreamReaction } from '@stream-io/video-client';
import { Pressable, StyleSheet, View, Text } from 'react-native';

import { theme } from '../theme';
import { useCallback } from 'react';
import { useCall } from '@stream-io/video-react-bindings';
import { defaultEmojiReactions } from '../constants';

const reactions: StreamReaction[] = [
  {
    type: 'reaction',
    emoji_code: ':like:',
    custom: {},
  },
  {
    type: 'raised-hand',
    emoji_code: ':raise-hand:',
    custom: {},
  },
  {
    type: 'reaction',
    emoji_code: ':fireworks:',
    custom: {},
  },
  { type: 'reaction', emoji_code: ':heart:', custom: {} },
  { type: 'reaction', emoji_code: ':rocket:', custom: {} },
];

type ReactionModalType = {
  setReactionModal: React.Dispatch<React.SetStateAction<boolean>>;
};

export const ReactionModal = (props: ReactionModalType) => {
  const { setReactionModal } = props;
  const onCloseReactionsModal = useCallback(() => {
    setReactionModal(false);
  }, [setReactionModal]);
  const call = useCall();

  const sendReaction = async (reaction: StreamReaction) => {
    await call?.sendReaction(reaction);
  };

  return (
    <Pressable
      style={[styles.container, StyleSheet.absoluteFill]}
      onPress={onCloseReactionsModal}
    >
      <View style={styles.menu}>
        <View style={styles.reactions}>
          {reactions.map((reaction) => (
            <Pressable
              onPress={() => sendReaction(reaction)}
              key={reaction.emoji_code}
            >
              <Text>
                {reaction.emoji_code &&
                  defaultEmojiReactions[reaction.emoji_code]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    paddingHorizontal: theme.padding.xl,
    zIndex: 5,
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
