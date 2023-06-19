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
  };

// TODO: rename to BaseAudio
export const Audio = ({ audioStream, sinkId, ...rest }: AudioProps) => {
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

    if (($el as any).setSinkId) {
      ($el as any).setSinkId(sinkId);
    }
  }, [sinkId]);

  return <audio autoPlay ref={audioRef} {...rest} />;
};
