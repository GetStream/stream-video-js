import { FC, useEffect, useState } from 'react';
import { Call, StreamReaction } from '@stream-io/video-react-sdk';
import classnames from 'classnames';

import styles from './Reaction.module.css';

export type Props = {
  className?: string;
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

export const Reaction: FC<Props> = ({
  className,
  reaction,
  sessionId,
  call,
  hideAfterTimeoutInMs = 5000,
}) => {
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

  const rootClassNames = classnames(
    styles.root,
    {
      [styles.showing]: isShowing,
    },
    className,
  );

  return (
    <div className={rootClassNames}>
      <span className={styles.emoji}>
        {emoji_code && defaultEmojiReactions[emoji_code]}
      </span>
    </div>
  );
};
