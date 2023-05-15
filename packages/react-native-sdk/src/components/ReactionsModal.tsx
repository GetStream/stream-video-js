import { StreamReaction } from '@stream-io/video-client';
import { Pressable, StyleSheet, View, Text, Modal } from 'react-native';

import { theme } from '../theme';
import { useCallback } from 'react';
import { useCall } from '@stream-io/video-react-bindings';
import { StreamVideoRN } from '../utils';
import { Cross } from '../icons';

type ReactionModalType = {
  isReactionModalActive: boolean;
  setIsReactionModalActive: React.Dispatch<React.SetStateAction<boolean>>;
};

export const ReactionModal = (props: ReactionModalType) => {
  const { isReactionModalActive, setIsReactionModalActive } = props;
  const onCloseReactionsModal = useCallback(() => {
    setIsReactionModalActive(false);
  }, [setIsReactionModalActive]);
  const call = useCall();
  const { supportedReactions } = StreamVideoRN.config;

  const sendReaction = async (reaction: StreamReaction) => {
    await call?.sendReaction(reaction);
    setIsReactionModalActive(false);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isReactionModalActive}
      onRequestClose={onCloseReactionsModal}
    >
      <View style={styles.container}>
        <View style={styles.menu}>
          <View style={styles.reactions}>
            {supportedReactions.map((reaction) => (
              <Pressable
                onPress={() => sendReaction(reaction)}
                key={reaction.emoji_code}
                style={styles.reaction}
              >
                <Text>
                  {reaction.emoji_code &&
                    supportedReactions.find(
                      (supportedReaction) =>
                        supportedReaction.emoji_code === reaction.emoji_code,
                    )?.icon}
                </Text>
              </Pressable>
            ))}
            <Pressable
              style={[styles.closeIcon, theme.icon.sm]}
              onPress={onCloseReactionsModal}
            >
              <Cross color={theme.light.primary} />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
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
  reaction: {
    marginHorizontal: theme.margin.md,
  },
  svgContainerStyle: {},
  closeIcon: {
    marginLeft: theme.margin.md,
  },
});
