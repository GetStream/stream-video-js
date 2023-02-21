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

export const Audio = ({ audioStream, sinkId, ...rest }: AudioProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const $el = audioRef.current;
    console.log(`Attaching audio stream`, $el, audioStream);
    if (!$el) return;
    if (audioStream) {
      $el.srcObject = audioStream;
      if (($el as any).setSinkId) {
        ($el as any).setSinkId(sinkId || '');
      }
    }
    return () => {
      $el.srcObject = null;
    };
  }, [audioStream, sinkId]);

  return <audio autoPlay ref={audioRef} {...rest} />;
};
