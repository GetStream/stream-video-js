import { useEffect, useState } from 'react';
import { StreamReaction } from '@stream-io/video-client';
import clsx from 'clsx';

export type ReactionProps = {
  reaction: StreamReaction;
  hideAfterTimeoutInMs?: number;
};

export const defaultEmojiReactions = {
  ':like:': '👍',
  ':raise-hand:': '✋',
  ':fireworks:': '🎉',
};

export const Reaction = (props: ReactionProps) => {
  const { reaction, hideAfterTimeoutInMs = 3500 } = props;
  const [isShowing, setIsShowing] = useState(false);
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (reaction) {
      setIsShowing(true);
      timeoutId = setTimeout(() => {
        setIsShowing(false);
      }, hideAfterTimeoutInMs);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [hideAfterTimeoutInMs, reaction]);

  return (
    <div
      className={clsx(
        'str-video__reaction',
        isShowing && 'str-video__reaction--visible',
      )}
    >
      <span className="str-video__reaction__emoji">
        {defaultEmojiReactions[reaction.emoji_code]}
      </span>
    </div>
  );
};
