import { useEffect, useState } from 'react';
import { Call, StreamReaction } from '@stream-io/video-client';
import clsx from 'clsx';

export type ReactionProps = {
  reaction: StreamReaction;
  sessionId: string;
  call: Call;
  hideAfterTimeoutInMs?: number;
};

export const defaultEmojiReactions: Record<string, string> = {
  ':like:': '👍',
  ':raise-hand:': '✋',
  ':fireworks:': '🎉',
};

export const Reaction = (props: ReactionProps) => {
  const { reaction, sessionId, call, hideAfterTimeoutInMs = 3500 } = props;
  const [isShowing, setIsShowing] = useState(false);
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (reaction) {
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
  return (
    <div
      className={clsx(
        'str-video__reaction',
        isShowing && 'str-video__reaction--visible',
      )}
    >
      <span className="str-video__reaction__emoji">
        {emoji_code && defaultEmojiReactions[emoji_code]}
      </span>
    </div>
  );
};
