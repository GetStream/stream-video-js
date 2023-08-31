import { OwnCapability, StreamReaction } from '@stream-io/video-client';
import { Restricted, useCall, useI18n } from '@stream-io/video-react-bindings';

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
    emoji_code: ':hart:',
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
  const { t } = useI18n();

  return (
    <Restricted requiredGrants={[OwnCapability.CREATE_REACTION]}>
      <CompositeButton
        active={false}
        caption={t('Reactions')}
        menuPlacement="top-start"
        Menu={<DefaultReactionsMenu reactions={reactions} />}
      >
        <IconButton
          icon="reactions"
          title={t('Reactions')}
          onClick={() => {
            console.log('Reactions');
          }}
        />
      </CompositeButton>
    </Restricted>
  );
};

export interface DefaultReactionsMenuProps {
  reactions: StreamReaction[];
}

export const DefaultReactionsMenu = ({
  reactions,
}: DefaultReactionsMenuProps) => {
  const call = useCall();
  return (
    <div className="str-video__reactions-menu">
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
