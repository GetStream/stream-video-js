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

export const ParticipantReactions = (props: ReactionProps) => {
  const {
    reactionMappings = defaultEmojiReactions,
    reaction,
    sessionId,
    hideAfterTimeoutInMs = 5500,
  } = props;
  const call = useCall();
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (reaction && call) {
      setIsShowing(true);
      timeoutId = setTimeout(() => {
        setIsShowing(false);
        call.resetReaction(sessionId);
      }, hideAfterTimeoutInMs);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [call, hideAfterTimeoutInMs, reaction, sessionId]);

  const { emoji_code } = reaction;

  if (!emoji_code) return null;

  const renderEmoji =
    typeof reactionMappings[emoji_code] === 'string' ? (
      <Text style={styles.reaction}>{reactionMappings[emoji_code]}</Text>
    ) : (
      <View style={[styles.svgContainerStyle, theme.icon.md]}>
        {reactionMappings[emoji_code]}
      </View>
    );

  return isShowing ? <View style={styles.container}>{renderEmoji}</View> : null;
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
