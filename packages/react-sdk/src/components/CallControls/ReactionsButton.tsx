import { CompositeButton, IconButton } from '../Button';
import {
  useActiveCall,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { StreamReaction } from '@stream-io/video-client';
import { defaultEmojiReactions } from '../Reaction';

export const ReactionsButton = () => {
  return (
    <CompositeButton
      active={false}
      caption="Reactions"
      menuPlacement="top-start"
      Menu={DefaultReactionsMenu}
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

export const DefaultReactionsMenu = () => {
  const activeCall = useActiveCall();
  const client = useStreamVideoClient();

  const handleReaction = (reaction: StreamReaction) => {
    const call = client?.coordinatorClient.call(
      activeCall!.type,
      activeCall!.id,
    );

    call?.sendReaction(reaction);
  };

  return (
    <div className="str-video__reactions-menu">
      {Object.entries(defaultEmojiReactions).map(([emojiCode, emoji]) => (
        <button
          key={emojiCode}
          type="button"
          className="str-video__reactions-menu__button"
          onClick={() => {
            handleReaction({
              type: 'reaction',
              emoji_code: emojiCode,
              custom: {},
            });
          }}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};
