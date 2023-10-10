import { ComponentPropsWithoutRef, useEffect, useState } from 'react';
import {
  AudioTrackType,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import { useCall } from '@stream-io/video-react-bindings';

export type AudioProps = ComponentPropsWithoutRef<'audio'> & {
  /**
   * The participant whose audio stream we want to play.
   */
  participant: StreamVideoParticipant;

  /**
   * The type of audio stream to play for the given participant.
   * The default value is `audioTrack`.
   */
  trackType?: AudioTrackType;
};

export const Audio = ({
  participant,
  trackType = 'audioTrack',
  ...rest
}: AudioProps) => {
  const call = useCall();
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null,
  );
  const { userId, sessionId } = participant;

  useEffect(() => {
    if (!call || !audioElement) return;
    const cleanup = call.bindAudioElement(audioElement, sessionId, trackType);
    return () => {
      cleanup?.();
    };
  }, [call, sessionId, audioElement, trackType]);

  return (
    <audio
      autoPlay
      {...rest}
      ref={setAudioElement}
      data-user-id={userId}
      data-session-id={sessionId}
      data-track-type={trackType}
    />
  );
};
