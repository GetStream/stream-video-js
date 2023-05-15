import { useEffect, useState } from 'react';
import { StreamReaction } from '@stream-io/video-client';
import { StyleSheet, Text, View } from 'react-native';
import { useCall } from '@stream-io/video-react-bindings';
import { theme } from '../theme';
import { StreamVideoRN } from '../utils';

export type ReactionProps = {
  reaction: StreamReaction;
  sessionId: string;
  hideAfterTimeoutInMs?: number;
};

export const ParticipantReaction = (props: ReactionProps) => {
  const { supportedReactions } = StreamVideoRN.config;
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
  }, [call, hideAfterTimeoutInMs, sessionId]);

  const { emoji_code } = reaction;

  if (!isShowing || !emoji_code) return null;

  const currentReaction = supportedReactions.find(
    (supportedReaction) => supportedReaction.emoji_code === reaction.emoji_code,
  );

  if (typeof currentReaction?.icon !== 'string') {
    return (
      <View style={styles.container}>
        <View style={[styles.svgContainerStyle, theme.icon.md]}>
          {currentReaction?.icon}
        </View>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Text style={styles.reaction}>{currentReaction.icon}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
  },
  reaction: {
    fontSize: 20,
  },
  svgContainerStyle: {},
});
