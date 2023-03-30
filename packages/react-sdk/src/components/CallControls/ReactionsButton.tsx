import { CompositeButton, IconButton } from '../Button';
import {
  useActiveCall,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { StreamReaction } from '@stream-io/video-client';
import { defaultEmojiReactions } from '../Reaction';

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
  );
};

export interface DefaultReactionsMenuProps {
  reactions: StreamReaction[];
}

export const DefaultReactionsMenu = ({
  reactions,
}: DefaultReactionsMenuProps) => {
  const activeCall = useActiveCall();
  const client = useStreamVideoClient();

  const sendReaction = (reaction: StreamReaction) => {
    const call = client?.coordinatorClient.call(
      activeCall!.type,
      activeCall!.id,
    );

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
