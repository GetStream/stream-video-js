import { FC, useCallback } from 'react';
import classnames from 'classnames';
import { StreamReaction, useCall } from '@stream-io/video-react-sdk';

import { usePanelContext } from '../../contexts/PanelContext';

import styles from './ReactionsPanel.module.css';

export const defaultEmojiReactions: Record<
  string,
  { emoji: string; label: string; custom: object; type: string }
> = {
  ':raise-hand:': {
    emoji: '✋',
    label: 'Raise hand',
    custom: {},
    type: 'raised-hand',
  },
  ':like:': {
    emoji: '👍',
    label: 'Like',
    custom: {},
    type: 'reaction',
  },
  ':dislike:': {
    emoji: '👎',
    label: 'Dislike',
    custom: {},
    type: 'reaction',
  },
  ':fireworks:': {
    emoji: '🎉',
    label: 'Fireworks',
    custom: {},
    type: 'reaction',
  },
  ':heart:': {
    emoji: '❤️',
    label: 'Heart',
    custom: {},
    type: 'reaction',
  },
  ':smile:': {
    emoji: '😀',
    label: 'Smile',
    custom: {},
    type: 'reaction',
  },
};

export type Props = {
  className?: string;
};

export const ReactionsPanel: FC<Props> = ({ className }) => {
  const activeCall = useCall();

  const { toggleHide } = usePanelContext();

  const sendReaction = useCallback(
    (reaction: StreamReaction) => {
      toggleHide('reaction');
      activeCall?.sendReaction(reaction);
    },
    [activeCall, toggleHide],
  );

  const rootClassname = classnames(styles.root, className);

  return (
    <div className={rootClassname}>
      <ul className={styles.list}>
        {Object.keys(defaultEmojiReactions).map((key) => (
          <li
            key={key}
            className={styles.item}
            onClick={() =>
              sendReaction({
                type: defaultEmojiReactions[key].type,
                emoji_code: key,
                custom: defaultEmojiReactions[key].custom,
              })
            }
          >
            {defaultEmojiReactions[key].emoji}
            <span className={styles.label}>
              {defaultEmojiReactions[key].label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
