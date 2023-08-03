import React, { useEffect, useRef } from 'react';
import {
  LayoutRectangle,
  Pressable,
  StyleSheet,
  Text,
  Animated,
  Easing,
} from 'react-native';
import { StreamVideoConfig } from '../../utils/StreamVideoRN/types';

interface Props {
  reactions: StreamVideoConfig['supportedReactions'];
  reactionsButtonLayoutRectangle?: LayoutRectangle;
  onRequestedClose: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
    // the top padding
    TOP_PADDING +
    // take margins into account
    REACTION_MARGIN_BOTTOM * reactions.length +
    // the size of the reaction icon items
    reactionItemSize * reactions.length +
    // the size of the reaction button (to show transparent background)
    size;
  const reactionsPopupStyle = {
    // we should show the popup right above the reactions button
    top: (reactionsButtonLayoutRectangle?.y ?? 0) - popupHeight + size,
    // from the same side horizontal coordinate of the reactions button
    left: reactionsButtonLayoutRectangle?.x,
    // the width of the popup should be the same as the reactions button
    width: size,
    height: popupHeight,
    // the popup should be rounded as the reactions button
    borderRadius: size / 2,
  };

  const elasticAnimRef = useRef(new Animated.Value(0.5)); // Initial value for scale: 0.5

  useEffect(() => {
    Animated.timing(elasticAnimRef.current, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
      easing: Easing.elastic(3),
    }).start();
  }, []);

  const reactionItemStyle = {
    height: reactionItemSize,
    width: reactionItemSize,
    borderRadius: reactionItemSize / 2,
    transform: [
      {
        scaleY: elasticAnimRef.current,
      },
      {
        scaleX: elasticAnimRef.current,
      },
    ],
  };

  return (
    <Pressable
      style={[styles.reactionsPopup, reactionsPopupStyle]}
      onPress={onRequestedClose}
    >
      {reactions.map((reaction) => (
        <AnimatedPressable
          key={reaction.emoji_code}
          style={[styles.reactionItem, reactionItemStyle]}
          onPress={() => {
            onRequestedClose();
          }}
        >
          <Text style={styles.reactionText}>{reaction.icon}</Text>
        </AnimatedPressable>
      ))}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  reactionsPopup: {
    position: 'absolute',
    alignItems: 'center',
    backgroundColor: '#000000E6',
    paddingTop: TOP_PADDING,
  },
  reactionItem: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: REACTION_MARGIN_BOTTOM,
  },
  reactionText: {
    fontSize: 24,
  },
});
