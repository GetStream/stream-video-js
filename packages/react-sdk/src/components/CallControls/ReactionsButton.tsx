import { OwnCapability, StreamReaction } from '@stream-io/video-client';
import { useCall } from '@stream-io/video-react-bindings';

import { CompositeButton, IconButton } from '../Button';
import { defaultEmojiReactions } from '../Reaction';
import { Restricted } from '../Moderation';

export const defaultReactions: StreamReaction[] = [
  {
    type: 'reaction',
    emoji_code: ':like:',
    custom: {},
  },
  {
    // TODO OL: use `prompt` type?
    type: 'raised-hand',
    emoji_code: ':raise-hand:',
    custom: {},
  },
  {
    type: 'reaction',
    emoji_code: ':fireworks:',
    custom: {},
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
      <CompositeButton
        active={false}
        caption="Reactions"
        menuPlacement="top-start"
        Menu={<DefaultReactionsMenu reactions={reactions} />}
      >
        <IconButton
          icon="reactions"
          title="Reactions"
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

  const sendReaction = (reaction: StreamReaction) => {
    call?.sendReaction(reaction);
  };

  return (
    <div className="str-video__reactions-menu">
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji_code}
          type="button"
          className="str-video__reactions-menu__button"
          onClick={() => {
            sendReaction(reaction);
          }}
        >
          {reaction.emoji_code && defaultEmojiReactions[reaction.emoji_code]}
        </button>
      ))}
    </div>
  );
};
