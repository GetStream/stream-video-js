import { useEffect } from 'react';
import { StreamVideoParticipant } from '@stream-io/video-client';
import { useCall } from '@stream-io/video-react-bindings';

export type ReactionProps = {
  participant: StreamVideoParticipant;
  hideAfterTimeoutInMs?: number;
  emojiReactionMap?: Record<string, string>;
};

export const defaultEmojiReactionMap: Record<string, string> = {
  ':like:': '👍',
  ':raise-hand:': '✋',
  ':fireworks:': '🎉',
};

export const Reaction = ({
  participant: { reaction, sessionId },
  hideAfterTimeoutInMs = 5500,
  emojiReactionMap = defaultEmojiReactionMap,
}: ReactionProps) => {
  const call = useCall();

  useEffect(() => {
    if (!call || !reaction) return;

    const timeoutId = setTimeout(() => {
      call.resetReaction(sessionId);
    }, hideAfterTimeoutInMs);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [call, hideAfterTimeoutInMs, reaction, sessionId]);

  if (!reaction) return null;

  const { emoji_code: emojiCode } = reaction;

  return (
    <div className="str-video__reaction">
      <span className="str-video__reaction__emoji">
        {emojiCode && emojiReactionMap[emojiCode]}
      </span>
    </div>
  );
};
