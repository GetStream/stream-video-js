import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useCall } from '@stream-io/video-react-bindings';
import { StreamVideoRN } from '../../../utils';
import { Z_INDEX } from '../../../constants';
import { ParticipantViewProps } from './ParticipantView';
import { useTheme } from '../../../contexts/ThemeContext';

/**
 * Props for the ParticipantReaction component.
 */
export type ParticipantReactionProps = Pick<
  ParticipantViewProps,
  'participant'
> & {
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
  hideAfterTimeoutInMs = 5500,
}: ParticipantReactionProps) => {
  const { supportedReactions } = StreamVideoRN.getConfig();
  const { reaction, sessionId } = participant;
  const call = useCall();
  const {
    theme: {
      typefaces,
      variants: { iconSizes },
      participantReaction,
    },
  } = useTheme();
  const [isShowing, setIsShowing] = useState<boolean>(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (call) {
      setIsShowing(true);
      timeoutId = setTimeout(() => {
        setIsShowing(false);
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

  let component;
  if (isShowing) {
    if (typeof currentReaction?.icon !== 'string') {
      component = currentReaction?.icon;
    } else {
      component = (
        <Text style={[participantReaction.reaction, typefaces.heading6]}>
          {currentReaction.icon}
        </Text>
      );
    }
  }

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
      {component}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    zIndex: Z_INDEX.IN_FRONT,
  },
});
