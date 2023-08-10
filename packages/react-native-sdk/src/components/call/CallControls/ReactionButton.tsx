import { Restricted } from '@stream-io/video-react-bindings';
import React, { useState } from 'react';
import { CallControlsButton } from './CallControlsButton';
import { OwnCapability } from '@stream-io/video-client';
import { ButtonTestIds } from '../../../constants/TestIds';
import { theme } from '../../../theme';
import { Reaction } from '../../../icons';
import { ReactionsPicker } from '../ReactionsPicker';
import { StreamVideoRN } from '../../../utils';
import { LayoutChangeEvent, LayoutRectangle, StyleSheet } from 'react-native';

/**
 * Props for the Reaction button
 */
export type ReactionButtonProps = {
  /**
   * Handler to be called when the reaction button is pressed.
   */
  onPressHandler?: () => void;
};

/**
 * Button to display the list of Reactions supported in the call.
 * On press, it opens a view that can be used to send Reaction.
 */
export const ReactionButton = ({ onPressHandler }: ReactionButtonProps) => {
  const [showReactionsPicker, setShowReactionsPicker] =
    useState<boolean>(false);
  const [reactionsButtonLayoutRectangle, setReactionsButtonLayoutRectangle] =
    useState<LayoutRectangle>();

  // This is for the reaction popup
  const onReactionsButtonLayout = (event: LayoutChangeEvent) => {
    const layout = event.nativeEvent.layout;
    setReactionsButtonLayoutRectangle((prev) => {
      if (
        prev &&
        prev.width === layout.width &&
        prev.height === layout.height &&
        prev.x === layout.x &&
        prev.y === layout.y
      ) {
        return prev;
      }
      return layout;
    });
  };

  const reactionButtonHandler = () => {
    if (onPressHandler) {
      onPressHandler();
      return;
    }
    setShowReactionsPicker(true);
  };

  return (
    <>
      <Restricted requiredGrants={[OwnCapability.CREATE_REACTION]}>
        <CallControlsButton
          testID={ButtonTestIds.REACTION}
          onPress={reactionButtonHandler}
          color={theme.light.static_white}
          style={styles.button}
          onLayout={onReactionsButtonLayout}
        >
          <Reaction color={theme.light.static_black} />
        </CallControlsButton>
      </Restricted>
      {showReactionsPicker && (
        <ReactionsPicker
          reactions={StreamVideoRN.getConfig().supportedReactions}
          reactionsButtonLayoutRectangle={reactionsButtonLayoutRectangle}
          onRequestedClose={() => {
            setShowReactionsPicker(false);
          }}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    // For iOS
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,

    // For android
    elevation: 6,
  },
  svgContainerStyle: {
    paddingTop: theme.padding.xs,
  },
});
