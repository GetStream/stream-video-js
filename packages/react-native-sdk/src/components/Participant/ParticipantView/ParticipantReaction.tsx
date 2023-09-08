import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useCall } from '@stream-io/video-react-bindings';
import { Z_INDEX, defaultEmojiReactions } from '../../../constants';
import { ParticipantViewProps } from './ParticipantView';
import { useTheme } from '../../../contexts/ThemeContext';
import { CallContentProps } from '../../Call';

/**
 * Props for the ParticipantReaction component.
 */
export type ParticipantReactionProps = Pick<
  ParticipantViewProps,
  'participant'
> &
  Pick<CallContentProps, 'reactions'> & {
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
  reactions = defaultEmojiReactions,
  hideAfterTimeoutInMs = 5500,
}: ParticipantReactionProps) => {
  const { reaction, sessionId } = participant;
  const call = useCall();
  const {
    theme: {
      typefaces,
      variants: { iconSizes },
      participantReaction,
    },
  } = useTheme();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
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
    reactions.find(
      (supportedReaction) =>
        supportedReaction.emoji_code === reaction.emoji_code,
    );

  return (
    <View
      style={[
        styles.container,
        {
          height: iconSizes.md,
          width: iconSizes.md,
        },
        participantReaction.container,
      ]}
    >
      <Text style={[participantReaction.reaction, typefaces.heading6]}>
        {currentReaction?.icon}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    zIndex: Z_INDEX.IN_FRONT,
  },
});
