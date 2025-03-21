import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  type LayoutRectangle,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useCall } from '@stream-io/video-react-bindings';
import { getLogger, type SendReactionRequest } from '@stream-io/video-client';
import { ComponentTestIds } from '../../../../constants/TestIds';
import { useTheme } from '../../../../contexts/ThemeContext';
import type { ReactionsButtonProps } from '../ReactionsButton';
import { defaultEmojiReactions } from '../../../../constants';

type ReactionPickerProps = Pick<ReactionsButtonProps, 'supportedReactions'> & {
  reactionsButtonLayoutRectangle?: LayoutRectangle;
  onRequestedClose: () => void;
};

export const ReactionsPicker = ({
  supportedReactions = defaultEmojiReactions,
  reactionsButtonLayoutRectangle,
  onRequestedClose,
}: ReactionPickerProps) => {
  const {
    theme: { colors, reactionsPicker, variants },
  } = useTheme();
  const styles = useStyles();
  const call = useCall();
  const size = reactionsButtonLayoutRectangle?.width ?? 0;
  const reactionItemSize = size * 0.8;

  const popupHeight =
    // the top padding
    variants.spacingSizes.xs +
    // take margins into account
    variants.spacingSizes.xs * supportedReactions.length +
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
        const logger = getLogger(['ReactionsPicker']);
        logger('error', 'Error on onClose-sendReaction', e, reaction);
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
            backgroundColor: colors.sheetSecondary,
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
              { backgroundColor: colors.buttonSecondary },
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
            backgroundColor: colors.sheetSecondary,
          },
          reactionsPicker.reactionsButtonDimmer,
        ]}
        onPress={() => onClose()}
      />
    </>
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        reactionsPopup: {
          position: 'absolute',
          alignItems: 'center',
          paddingTop: theme.variants.spacingSizes.xs,
        },
        reactionsButtonDimmer: {
          position: 'absolute',
          opacity: 0.5,
        },
        reactionItem: {
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: theme.variants.spacingSizes.xs,
        },
        reactionText: {
          fontSize: 18.5,
        },
      }),
    [theme],
  );
};
