import {
  AudioHTMLAttributes,
  DetailedHTMLProps,
  useEffect,
  useRef,
} from 'react';
import { StreamVideoParticipant } from '@stream-io/video-client';
import { useCall } from '@stream-io/video-react-bindings';

export type AudioProps = DetailedHTMLProps<
  AudioHTMLAttributes<HTMLAudioElement>,
  HTMLAudioElement
> & {
  participant: StreamVideoParticipant;
};

export const Audio = ({ participant, ...rest }: AudioProps) => {
  const call = useCall();
  const audioRef = useRef<HTMLAudioElement>(null);
  const { userId, sessionId } = participant;
  useEffect(() => {
    if (!call || !audioRef.current) return;
    const cleanup = call.bindAudioElement(audioRef.current, sessionId);
    return () => {
      cleanup?.();
    };
  }, [call, sessionId]);

  return (
    <audio
      autoPlay
      {...rest}
      ref={audioRef}
      data-user-id={userId}
      data-session-id={sessionId}
    />
  );
};
