import { StreamReaction } from '@stream-io/video-client';
import { Pressable, StyleSheet, View, Text, Modal } from 'react-native';
import { theme } from '../../theme';
import React, { useCallback } from 'react';
import { useCall } from '@stream-io/video-react-bindings';
import { StreamVideoRN } from '../../utils';
import { A11yComponents } from '../../constants/A11yLabels';

type ReactionModalType = {
  isReactionModalActive: boolean;
  setIsReactionModalActive: React.Dispatch<React.SetStateAction<boolean>>;
};

/**
 * A component that shows a list of reactions that can be sent in a call.
 */
export const ReactionModal = (props: ReactionModalType) => {
  const { isReactionModalActive, setIsReactionModalActive } = props;
  const onCloseReactionsModal = useCallback(() => {
    setIsReactionModalActive(false);
  }, [setIsReactionModalActive]);
  const call = useCall();
  const { supportedReactions } = StreamVideoRN.getConfig();

  const sendReaction = async (reaction: StreamReaction) => {
    await call?.sendReaction(reaction);
    setIsReactionModalActive(false);
  };

  return (
    <Modal
      accessibilityLabel={A11yComponents.REACTIONS_MODAL}
      animationType="slide"
      transparent={true}
      visible={isReactionModalActive}
      onRequestClose={onCloseReactionsModal}
    >
      <Pressable
        style={styles.container}
        onPress={() => setIsReactionModalActive(false)}
      >
        <View style={styles.menu} onStartShouldSetResponder={() => true}>
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
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.light.overlay,
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
