import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useCall } from '@stream-io/video-react-bindings';
import { theme } from '../../../theme';
import { StreamVideoRN } from '../../../utils';
import { Z_INDEX } from '../../../constants';
import { ParticipantViewProps } from './ParticipantView';

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
export const ParticipantReaction = (props: ParticipantReactionProps) => {
  const { supportedReactions } = StreamVideoRN.getConfig();
  const { participant, hideAfterTimeoutInMs = 5500 } = props;
  const { reaction, sessionId } = participant;
  const call = useCall();
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
      component = <Text style={styles.reaction}>{currentReaction.icon}</Text>;
    }
  }

  return <View style={[styles.container, theme.icon.md]}>{component}</View>;
};

const styles = StyleSheet.create({
  reaction: {
    ...theme.fonts.heading6,
  },
  container: {
    alignSelf: 'flex-start',
    zIndex: Z_INDEX.IN_FRONT,
  },
});
