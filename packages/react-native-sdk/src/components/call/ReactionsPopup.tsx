import React from 'react';
import { LayoutRectangle, Pressable, StyleSheet, Text } from 'react-native';
import { StreamVideoConfig } from '../../utils/StreamVideoRN/types';

interface Props {
  reactions: StreamVideoConfig['supportedReactions'];
  reactionsButtonLayoutRectangle?: LayoutRectangle;
  onRequestedClose: () => void;
}

const TOP_PADDING = 4;
const REACTION_MARGIN_BOTTOM = 4;

export const ReactionsPopup = ({
  reactions,
  reactionsButtonLayoutRectangle,
  onRequestedClose,
}: Props) => {
  // we assume a minimum size of 48 * 48 -- the normal size of a tap target
  const size = Math.max(48, reactionsButtonLayoutRectangle?.width ?? 0);
  const reactionItemSize = size * 0.9; // 90% of the size of the reactions button
  const popupHeight =
    REACTION_MARGIN_BOTTOM * reactions.length +
    reactionItemSize * reactions.length +
    size +
    TOP_PADDING;
  const reactionsPopupStyle = {
    top: (reactionsButtonLayoutRectangle?.y ?? 0) - popupHeight + size,
    left: reactionsButtonLayoutRectangle?.x,
    width: size,
    height: popupHeight,
    borderRadius: size / 2,
  };
  const reactionItemStyle = {
    height: reactionItemSize,
    width: reactionItemSize,
    borderRadius: reactionItemSize / 2,
  };
  return (
    <Pressable
      style={[styles.reactionsPopup, reactionsPopupStyle]}
      onPress={onRequestedClose}
    >
      {reactions.map((reaction) => (
        <Pressable
          key={reaction.emoji_code}
          style={(state) => [
            styles.reactionItem,
            reactionItemStyle,
            state.pressed ? { opacity: 0.2 } : null,
          ]}
          onPress={() => {
            onRequestedClose();
          }}
        >
          <Text style={styles.reactionText}>{reaction.icon}</Text>
        </Pressable>
      ))}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  reactionsPopup: {
    position: 'absolute',
    alignItems: 'center',
    // justifyContent: 'space-evenly',
    // justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.9)',
    paddingTop: TOP_PADDING,
  },
  reactionItem: {
    // backgroundColor: 'rgba(36,38,42)',
    // backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: REACTION_MARGIN_BOTTOM,
  },
  reactionText: {
    fontSize: 24,
  },
});
