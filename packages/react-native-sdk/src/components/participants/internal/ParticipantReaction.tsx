import React, { useEffect, useState } from 'react';
import { StreamReaction } from '@stream-io/video-client';
import { StyleSheet, Text, View } from 'react-native';
import { useCall } from '@stream-io/video-react-bindings';
import { theme } from '../../../theme';
import { StreamVideoRN } from '../../../utils';

export type ReactionProps = {
  reaction?: StreamReaction;
  sessionId: string;
  hideAfterTimeoutInMs?: number;
};

export const ParticipantReaction = (props: ReactionProps) => {
  const { supportedReactions } = StreamVideoRN.getConfig();
  const { reaction, sessionId, hideAfterTimeoutInMs = 5500 } = props;
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

  return (
    <View style={[styles.svgContainerStyle, theme.icon.md]}>{component}</View>
  );
};

const styles = StyleSheet.create({
  reaction: {
    ...theme.fonts.heading6,
  },
  svgContainerStyle: {},
});
