import { useEffect, useState } from 'react';
import { StreamReaction } from '@stream-io/video-client';
import { defaultEmojiReactions } from '../constants';
import { StyleSheet, Text, View } from 'react-native';
import { useCall } from '@stream-io/video-react-bindings';
import { theme } from '../theme';

export type ReactionProps = {
  reactionMappings?: Record<string, string | JSX.Element>;
  reaction: StreamReaction;
  sessionId: string;
  hideAfterTimeoutInMs?: number;
};

export const ParticipantReaction = (props: ReactionProps) => {
  const {
    reactionMappings = defaultEmojiReactions,
    reaction,
    sessionId,
    hideAfterTimeoutInMs = 5500,
  } = props;
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

  if (typeof reactionMappings[emoji_code] !== 'string') {
    return (
      <View style={styles.container}>
        <View style={[styles.svgContainerStyle, theme.icon.md]}>
          {reactionMappings[emoji_code]}
        </View>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Text style={styles.reaction}>{reactionMappings[emoji_code]}</Text>
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
