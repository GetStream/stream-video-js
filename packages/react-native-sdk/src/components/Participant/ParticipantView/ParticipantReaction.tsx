import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useCall } from '@stream-io/video-react-bindings';
import { defaultEmojiReactions, Z_INDEX } from '../../../constants';
import type { ParticipantViewProps } from './ParticipantView';
import { useTheme } from '../../../contexts/ThemeContext';
import type { CallContentProps } from '../../Call';

/**
 * Props for the ParticipantReaction component.
 */
export type ParticipantReactionProps = Pick<
  ParticipantViewProps,
  'participant'
> &
  Pick<CallContentProps, 'supportedReactions'> & {
    /**
     * The duration after which the reaction should disappear.
     *
     * @default 5500
     */
    hideAfterTimeoutInMs?: number;
  };

/**
 * This component is used to display the current participant reaction.
 */
export const ParticipantReaction = ({
  participant,
  supportedReactions = defaultEmojiReactions,
  hideAfterTimeoutInMs = 5500,
}: ParticipantReactionProps) => {
  const { reaction, sessionId } = participant;
  const call = useCall();
  const {
    theme: { participantReaction },
  } = useTheme();

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    if (call) {
      timeoutId = setTimeout(() => {
        call.resetReaction(sessionId);
      }, hideAfterTimeoutInMs);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [call, hideAfterTimeoutInMs, sessionId, reaction]);

  const currentReaction =
    reaction &&
    supportedReactions.find(
      (supportedReaction) =>
        supportedReaction.emoji_code === reaction.emoji_code,
    );

  return (
    currentReaction?.icon != null && (
      <View style={[styler.container, participantReaction.container]}>
        <Text style={participantReaction.reaction}>
          {currentReaction?.icon}
        </Text>
      </View>
    )
  );
};

const styler = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: Z_INDEX.IN_FRONT,
  },
});
