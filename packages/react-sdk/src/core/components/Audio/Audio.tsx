import { ComponentPropsWithoutRef, useEffect, useState } from 'react';
import { StreamVideoParticipant } from '@stream-io/video-client';
import { useCall } from '@stream-io/video-react-bindings';

export type AudioProps = ComponentPropsWithoutRef<'audio'> & {
  participant: StreamVideoParticipant;
};

export const Audio = ({ participant, ...rest }: AudioProps) => {
  const call = useCall();
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null,
  );
  const { userId, sessionId } = participant;

  useEffect(() => {
    if (!call || !audioElement) return;

    const cleanup = call.bindAudioElement(audioElement, sessionId);

    return () => {
      cleanup?.();
    };
  }, [call, sessionId, audioElement]);

  return (
    <audio
      autoPlay
      {...rest}
      ref={setAudioElement}
      data-user-id={userId}
      data-session-id={sessionId}
    />
  );
};
