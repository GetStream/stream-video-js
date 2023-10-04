import React, { useEffect, useRef } from 'react';
import {
  LayoutRectangle,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { useCall } from '@stream-io/video-react-bindings';
import { SendReactionRequest } from '@stream-io/video-client';
import { ComponentTestIds } from '../../../../constants/TestIds';
import { useTheme } from '../../../../contexts/ThemeContext';
import { ReactionsButtonProps } from '../ReactionsButton';
import { defaultEmojiReactions } from '../../../../constants';

type ReactionPickerProps = Pick<ReactionsButtonProps, 'supportedReactions'> & {
  reactionsButtonLayoutRectangle?: LayoutRectangle;
  onRequestedClose: () => void;
};

const TOP_PADDING = 4;
const REACTION_MARGIN_BOTTOM = 4;

export const ReactionsPicker = ({
  supportedReactions = defaultEmojiReactions,
  reactionsButtonLayoutRectangle,
  onRequestedClose,
}: ReactionPickerProps) => {
  const {
    theme: { colors, reactionsPicker },
  } = useTheme();
  const call = useCall();
  const size = reactionsButtonLayoutRectangle?.width ?? 0;
  const reactionItemSize = size * 0.8;

  const popupHeight =
    // the top padding
    TOP_PADDING +
    // take margins into account
    REACTION_MARGIN_BOTTOM * supportedReactions.length +
    // the size of the reaction icon items (same size as reactions button * amount of reactions)
    reactionItemSize * supportedReactions.length;

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
        style={[
          styles.reactionsPopup,
          reactionsPopupStyle,
          {
            backgroundColor: colors.static_grey,
          },
          reactionsPicker.reactionsPopup,
        ]}
        onPress={() => {
          onClose();
        }}
      >
        {/* all the reactions */}
        {supportedReactions.map((supportedReaction) => (
          <Pressable
            key={supportedReaction.emoji_code}
            style={[
              styles.reactionItem,
              reactionItemStyle,
              {
                // temporary background color until we have theming
                backgroundColor: colors.overlay,
              },
              reactionsPicker.reactionItem,
            ]}
            onPress={() => {
              onClose({
                type: supportedReaction.type,
                custom: supportedReaction.custom,
                emoji_code: supportedReaction.emoji_code,
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
                reactionsPicker.reactionText,
              ]}
            >
              {supportedReaction.icon}
            </Animated.Text>
          </Pressable>
        ))}
      </Pressable>
      {/* a square view with 50% opacity that semi hides the reactions button */}
      <Pressable
        style={[
          reactionsButtonDimmerStyle,
          {
            backgroundColor: colors.static_grey,
          },
          reactionsPicker.reactionsButtonDimmer,
        ]}
        onPress={() => onClose()}
      />
    </>
  );
};

const styles = StyleSheet.create({
  reactionsPopup: {
    position: 'absolute',
    alignItems: 'center',
    paddingTop: TOP_PADDING,
  },
  reactionsButtonDimmer: {
    position: 'absolute',
    opacity: 0.5,
  },
  reactionItem: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: REACTION_MARGIN_BOTTOM,
  },
  reactionText: {
    fontSize: 18.5,
  },
});
