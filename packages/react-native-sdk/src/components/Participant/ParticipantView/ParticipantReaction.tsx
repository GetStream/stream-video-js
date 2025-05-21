import React, { useEffect, useMemo } from 'react';
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
  const styles = useStyles();
  const {
    theme: { typefaces, participantReaction },
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
    supportedReactions.find(
      (supportedReaction) =>
        supportedReaction.emoji_code === reaction.emoji_code,
    );

  return (
    currentReaction?.icon != null && (
      <View style={[styles.container, participantReaction.container]}>
        <View style={styles.reaction}>
          <Text style={[participantReaction.reaction, typefaces.heading6]}>
            {currentReaction?.icon}
          </Text>
        </View>
      </View>
    )
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          zIndex: Z_INDEX.IN_FRONT,
        },
        reaction: {
          borderRadius: theme.variants.borderRadiusSizes.sm,
          backgroundColor: theme.colors.sheetOverlay,
          alignSelf: 'flex-end',
          marginRight: theme.variants.spacingSizes.md,
          marginTop: theme.variants.spacingSizes.md,
          height: theme.variants.roundButtonSizes.md,
          width: theme.variants.roundButtonSizes.md,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [theme],
  );
};
