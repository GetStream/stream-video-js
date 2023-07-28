import clsx from 'clsx';
import {
  useCall,
  useMasterAudioOutputLevel,
} from '@stream-io/video-react-bindings';
import { useCallback, useEffect, useState } from 'react';
import { Icon } from '../Icon';
import { StreamVideoParticipant } from '@stream-io/video-client';
import { useDraggable } from '../../hooks/useDraggable';

export type AudioLevelControlProps = {
  /**
   * Participant whose sound volume is to be adjusted.
   */
  participant?: StreamVideoParticipant;
};

export const AudioOutputLevelSlider = ({
  participant,
}: AudioLevelControlProps) => {
  const call = useCall();
  const masterAudioOutputLevel = useMasterAudioOutputLevel();
  const [thumb, setThumb] = useState<HTMLDivElement | null>(null);
  const [track, setTrack] = useState<HTMLDivElement | null>(null);

  const audioLevel = participant?.audioOutputLevel ?? masterAudioOutputLevel;

  const handleSetAudioOutput = useCallback(
    (event: MouseEvent) => {
      if (!track) return;
      const { left: trackLeft, width } = track.getBoundingClientRect();
      const volume = +((event.clientX - trackLeft) / width).toFixed(2);
      const validatedVolume = volume < 0 ? 0 : volume > 1 ? 1 : volume;
      call?.setAudioOutputLevel(validatedVolume, participant?.sessionId);
    },
    [call, participant, track],
  );

  useEffect(() => {
    if (!track) return;

    track.addEventListener('click', handleSetAudioOutput);

    return () => {
      track?.removeEventListener('click', handleSetAudioOutput);
    };
  }, [handleSetAudioOutput, track]);

  useDraggable({
    axis: 'x',
    containerElement: track,
    element: thumb,
    onMouseMove: handleSetAudioOutput,
  });

  return (
    <div
      className={clsx('str-video__audio-level-slider', {
        'str-video__audio-level-slider--mute': !audioLevel,
      })}
    >
      <span
        onClick={() =>
          call?.setAudioOutputLevel(
            !audioLevel ? masterAudioOutputLevel : 0,
            participant?.sessionId,
          )
        }
      >
        <Icon icon={audioLevel ? 'speaker' : 'speaker-off'} />
      </span>
      <div className="str-video__audio-level-slider__track" ref={setTrack}>
        <div
          className="str-video__audio-level-slider__level"
          style={{ transform: `scaleX(${audioLevel})` }}
        />
        <div
          className="str-video_audio-level-slider__thumb"
          ref={setThumb}
          style={{ left: `${audioLevel * 100}%` }}
        />
      </div>
    </div>
  );
};
