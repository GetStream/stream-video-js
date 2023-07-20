import {
  AudioHTMLAttributes,
  DetailedHTMLProps,
  useEffect,
  useRef,
} from 'react';
import { StreamVideoParticipant } from '@stream-io/video-client';

export type AudioProps = DetailedHTMLProps<
  AudioHTMLAttributes<HTMLAudioElement>,
  HTMLAudioElement
> &
  Pick<StreamVideoParticipant, 'audioStream'> & {
    sinkId?: string;
    /**
     * Value applied to underlying audio element to control the audio output level.
     */
    volume?: number;
  };

// TODO: rename to BaseAudio
export const Audio = ({ audioStream, sinkId, volume, ...rest }: AudioProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const $el = audioRef.current;
    if (!($el && audioStream)) return;

    $el.srcObject = audioStream;
    return () => {
      $el.srcObject = null;
    };
  }, [audioStream]);

  useEffect(() => {
    const $el = audioRef.current;
    if (!$el || !sinkId) return;

    // HTMLMediaElement neither HTMLAudioElement in Typescript have prop setSinkId
    if (($el as any).setSinkId) {
      ($el as any).setSinkId(sinkId);
    }
  }, [sinkId]);

  useEffect(() => {
    if (typeof volume !== 'number' || !audioRef.current) return;
    audioRef.current.volume = volume;
  }, [audioRef, volume]);

  return <audio autoPlay ref={audioRef} {...rest} />;
};
