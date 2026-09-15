import React, { useState } from 'react';
import { type LayoutChangeEvent, type LayoutRectangle } from 'react-native';
import { Restricted } from '@stream-io/video-react-bindings';
import { OwnCapability } from '@stream-io/video-client';
import { ButtonTestIds } from '../../../../constants/TestIds';
import { Reaction, ControlButtonIcon } from '../../../../icons';
import { ReactionsPicker } from '../internal/ReactionsPicker';
import { type StreamReactionType } from '../../CallContent';
import { CallControlsButton } from '..';

/**
 * Props for the Reaction button
 */
export type ReactionsButtonProps = {
  /**
   * Supported Reactions to be sent while in the call.
   */
  supportedReactions?: StreamReactionType[];
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
  supportedReactions,
  onPressHandler,
}: ReactionsButtonProps) => {
  const [showReactionsPicker, setShowReactionsPicker] =
    useState<boolean>(false);
  const [reactionsButtonLayoutRectangle, setReactionsButtonLayoutRectangle] =
    useState<LayoutRectangle>();
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

  const onRequestedClose = () => {
    setShowReactionsPicker(false);
  };

  return (
    <>
      <Restricted requiredGrants={[OwnCapability.CREATE_REACTION]}>
        <CallControlsButton
          testID={ButtonTestIds.REACTION}
          onPress={reactionsButtonHandler}
          onLayout={onReactionsButtonLayout}
        >
          <ControlButtonIcon icon={Reaction} />
        </CallControlsButton>
      </Restricted>
      {showReactionsPicker && (
        <ReactionsPicker
          supportedReactions={supportedReactions}
          reactionsButtonLayoutRectangle={reactionsButtonLayoutRectangle}
          onRequestedClose={onRequestedClose}
        />
      )}
    </>
  );
};
