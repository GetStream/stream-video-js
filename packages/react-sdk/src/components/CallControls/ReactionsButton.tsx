import { forwardRef } from 'react';
import clsx from 'clsx';

import { OwnCapability, StreamReaction } from '@stream-io/video-client';
import { Restricted, useCall, useI18n } from '@stream-io/video-react-bindings';

import { ToggleMenuButtonProps } from '../Menu';
import { CompositeButton, IconButton } from '../Button';
import { defaultEmojiReactionMap } from '../Reaction';

export const defaultReactions: StreamReaction[] = [
  {
    type: 'reaction',
    emoji_code: ':like:',
  },
  {
    // TODO OL: use `prompt` type?
    type: 'raised-hand',
    emoji_code: ':raise-hand:',
  },
  {
    type: 'reaction',
    emoji_code: ':fireworks:',
  },
  {
    type: 'reaction',
    emoji_code: ':dislike:',
  },
  {
    type: 'reaction',
    emoji_code: ':heart:',
  },
  {
    type: 'reaction',
    emoji_code: ':smile:',
  },
];

export interface ReactionsButtonProps {
  reactions?: StreamReaction[];
  caption?: string;
}

export const ReactionsButton = ({
  reactions = defaultReactions,
  caption,
}: ReactionsButtonProps) => {
  return (
    <Restricted requiredGrants={[OwnCapability.CREATE_REACTION]}>
      <CompositeButton
        active={false}
        caption={caption}
        menuPlacement="top"
        ToggleMenuButton={ToggleMenuButton}
        Menu={<DefaultReactionsMenu reactions={reactions} />}
      />
    </Restricted>
  );
};

export interface DefaultReactionsMenuProps {
  reactions: StreamReaction[];
  layout?: 'horizontal' | 'vertical';
}

const ToggleMenuButton = forwardRef<HTMLButtonElement, ToggleMenuButtonProps>(
  ({ menuShown }, ref) => {
    const { t } = useI18n();

    return (
      <IconButton
        className={clsx('str-video__menu-toggle-button', {
          'str-video__menu-toggle-button--active': menuShown,
        })}
        icon="reactions"
        title={t('Reactions')}
        ref={ref}
      />
    );
  },
);

export const DefaultReactionsMenu = ({
  reactions,
  layout = 'horizontal',
}: DefaultReactionsMenuProps) => {
  const call = useCall();
  return (
    <div
      className={clsx('str-video__reactions-menu', {
        'str-video__reactions-menu--horizontal': layout === 'horizontal',
        'str-video__reactions-menu--vertical': layout === 'vertical',
      })}
    >
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji_code}
          type="button"
          className="str-video__reactions-menu__button"
          onClick={() => {
            call?.sendReaction(reaction);
          }}
        >
          {reaction.emoji_code && defaultEmojiReactionMap[reaction.emoji_code]}
        </button>
      ))}
    </div>
  );
};
