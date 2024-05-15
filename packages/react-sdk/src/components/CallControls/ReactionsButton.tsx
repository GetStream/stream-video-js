import { forwardRef } from 'react';
import clsx from 'clsx';

import { OwnCapability, StreamReaction } from '@stream-io/video-client';
import { Restricted, useCall, useI18n } from '@stream-io/video-react-bindings';

import {
  MenuToggle,
  MenuVisualType,
  ToggleMenuButtonProps,
  useMenuContext,
} from '../Menu';
import { CompositeButton } from '../Button';
import { defaultEmojiReactionMap } from '../Reaction';
import { Icon } from '../Icon';
import { WithTooltip } from '../Tooltip';

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
}

export const ReactionsButton = ({
  reactions = defaultReactions,
}: ReactionsButtonProps) => {
  return (
    <Restricted requiredGrants={[OwnCapability.CREATE_REACTION]}>
      <MenuToggle
        placement="top"
        ToggleButton={ToggleReactionsMenuButton}
        visualType={MenuVisualType.MENU}
      >
        <DefaultReactionsMenu reactions={reactions} />
      </MenuToggle>
    </Restricted>
  );
};

const ToggleReactionsMenuButton = forwardRef<
  HTMLDivElement,
  ToggleMenuButtonProps
>(function ToggleReactionsMenuButton({ menuShown }, ref) {
  const { t } = useI18n();
  return (
    <WithTooltip title={t('Reactions')} tooltipDisabled={menuShown}>
      <CompositeButton ref={ref} active={menuShown} variant="primary">
        <Icon icon="reactions" />
      </CompositeButton>
    </WithTooltip>
  );
});

export interface DefaultReactionsMenuProps {
  reactions: StreamReaction[];
  layout?: 'horizontal' | 'vertical';
}

export const DefaultReactionsMenu = ({
  reactions,
  layout = 'horizontal',
}: DefaultReactionsMenuProps) => {
  const call = useCall();
  const { close } = useMenuContext();
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
            close?.();
          }}
        >
          {reaction.emoji_code && defaultEmojiReactionMap[reaction.emoji_code]}
        </button>
      ))}
    </div>
  );
};
