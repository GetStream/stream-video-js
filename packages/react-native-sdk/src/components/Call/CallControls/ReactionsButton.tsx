import { Restricted } from '@stream-io/video-react-bindings';
import React, { useState } from 'react';
import { CallControlsButton } from './CallControlsButton';
import { OwnCapability } from '@stream-io/video-client';
import { ButtonTestIds } from '../../../constants/TestIds';
import { Reaction } from '../../../icons';
import { ReactionsPicker } from './internal/ReactionsPicker';
import { LayoutChangeEvent, LayoutRectangle } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { StreamReactionType } from '../CallContent';

/**
 * Props for the Reaction button
 */
export type ReactionsButtonProps = {
  /**
   * Supported Reactions to be sent while in the call.
   */
  reactions?: StreamReactionType[];
  /**
   * Handler to be called when the reaction button is pressed.
   */
  onPressHandler?: () => void;
};

/**
 * Button to display the list of Reactions supported in the call.
 * On press, it opens a view that can be used to send Reaction.
 */
export const ReactionsButton = ({
  reactions,
  onPressHandler,
}: ReactionsButtonProps) => {
  const [showReactionsPicker, setShowReactionsPicker] =
    useState<boolean>(false);
  const [reactionsButtonLayoutRectangle, setReactionsButtonLayoutRectangle] =
    useState<LayoutRectangle>();
  const {
    theme: { colors },
  } = useTheme();
  // This is for the reaction picker
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

  const reactionsButtonHandler = () => {
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
          onPress={reactionsButtonHandler}
          onLayout={onReactionsButtonLayout}
        >
          <Reaction color={colors.static_black} />
        </CallControlsButton>
      </Restricted>
      {showReactionsPicker && (
        <ReactionsPicker
          reactions={reactions}
          reactionsButtonLayoutRectangle={reactionsButtonLayoutRectangle}
          onRequestedClose={() => {
            setShowReactionsPicker(false);
          }}
        />
      )}
    </>
  );
};
