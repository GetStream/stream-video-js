import React, { useEffect, useRef } from 'react';
import {
  LayoutRectangle,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { StreamVideoConfig } from '../../utils/StreamVideoRN/types';
import { useCall } from '@stream-io/video-react-bindings';
import { SendReactionRequest } from '@stream-io/video-client';
import { theme } from '../../theme';
import { ComponentTestIds } from '../../constants/TestIds';

interface Props {
  reactions: StreamVideoConfig['supportedReactions'];
  reactionsButtonLayoutRectangle?: LayoutRectangle;
  onRequestedClose: () => void;
}

const TOP_PADDING = 4;
const REACTION_MARGIN_BOTTOM = 4;

export const ReactionsPicker = ({
  reactions,
  reactionsButtonLayoutRectangle,
  onRequestedClose,
}: Props) => {
  const call = useCall();
  const size = reactionsButtonLayoutRectangle?.width ?? 0;
  const reactionItemSize = size * 0.8;

  const popupHeight =
    // the top padding
    TOP_PADDING +
    // take margins into account
    REACTION_MARGIN_BOTTOM * reactions.length +
    // the size of the reaction icon items (same size as reactions button * amount of reactions)
    reactionItemSize * reactions.length;

  const reactionsPopupStyle = {
    // we should show the popup right above the reactions button and not top of it
    top: (reactionsButtonLayoutRectangle?.y ?? 0) - popupHeight,
    // from the same side horizontal coordinate of the reactions button
    left: reactionsButtonLayoutRectangle?.x,
    // the width of the popup should be the same as the reactions button
    width: size,
    height: popupHeight,
    // the popup should be rounded as the reactions button
    borderTopStartRadius: size / 2,
    borderTopEndRadius: size / 2,
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
  };

  const reactionsButtonDimmerStyle = {
    ...styles.reactionsButtonDimmer,
    height: size,
    width: size,
    // we should show the popup right on top of the reactions button
    top: reactionsButtonLayoutRectangle?.y ?? 0 - popupHeight + size,
    // from the same side horizontal coordinate of the reactions button
    left: reactionsButtonLayoutRectangle?.x,
  };

  const onClose = (reaction?: SendReactionRequest) => {
    if (reaction) {
      call?.sendReaction(reaction).catch((e) => {
        console.error(e, reaction);
      });
    }
    Animated.timing(elasticAnimRef.current, {
      toValue: 0.2,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.linear,
    }).start(onRequestedClose);
  };

  return (
    <>
      <Pressable
        testID={ComponentTestIds.REACTIONS_PICKER}
        style={[styles.reactionsPopup, reactionsPopupStyle]}
        onPress={() => {
          onClose();
        }}
      >
        {/* all the reactions */}
        {reactions.map((reaction) => (
          <Pressable
            key={reaction.emoji_code}
            style={[styles.reactionItem, reactionItemStyle]}
            onPress={() => {
              onClose({
                type: reaction.type,
                custom: reaction.custom,
                emoji_code: reaction.emoji_code,
              });
            }}
          >
            <Animated.Text
              style={[
                styles.reactionText,
                {
                  transform: [
                    {
                      scaleY: elasticAnimRef.current,
                    },
                    {
                      scaleX: elasticAnimRef.current,
                    },
                  ],
                },
              ]}
            >
              {reaction.icon}
            </Animated.Text>
          </Pressable>
        ))}
      </Pressable>
      {/* a square view with 50% opacity that semi hides the reactions button */}
      <Pressable style={reactionsButtonDimmerStyle} onPress={() => onClose()} />
    </>
  );
};

const styles = StyleSheet.create({
  reactionsPopup: {
    position: 'absolute',
    alignItems: 'center',
    backgroundColor: theme.light.static_grey,
    paddingTop: TOP_PADDING,
  },
  reactionsButtonDimmer: {
    position: 'absolute',
    backgroundColor: theme.light.static_grey,
    opacity: 0.5,
  },
  reactionItem: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: REACTION_MARGIN_BOTTOM,
    // temporary background color until we have theming
    backgroundColor: theme.light.overlay,
  },
  reactionText: {
    fontSize: 18.5,
  },
});
