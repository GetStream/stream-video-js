import clsx from 'clsx';
import {
  useCall,
  useMasterAudioOutputLevel,
} from '@stream-io/video-react-bindings';
import { MouseEventHandler, useCallback } from 'react';
import { Icon } from '../Icon';
import { StreamVideoParticipant } from '@stream-io/video-client';

export type AudioLevelControlProps = {
  participant?: StreamVideoParticipant;
};

export const AudioOutputLevelSlider = ({
  participant,
}: AudioLevelControlProps) => {
  const call = useCall();
  const masterAudioOutputLevel = useMasterAudioOutputLevel();

  const audioLevel = participant?.audioOutputLevel ?? masterAudioOutputLevel;

  const handleClick: MouseEventHandler = useCallback(
    (event) => {
      const { width, x } = event.currentTarget.getBoundingClientRect();

      const volume = +((event.clientX - x) / width).toFixed(2);
      const validatedVolume = volume < 0 ? 0 : volume > 1 ? 1 : volume;
      call?.setAudioOutputLevel(validatedVolume, participant?.sessionId);
    },
    [call, participant],
  );

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
      <div
        className="str-video__audio-level-slider__track"
        onClick={handleClick}
      >
        <div
          className="str-video__audio-level-slider__level"
          style={{ transform: `scaleX(${audioLevel})` }}
        />
      </div>
    </div>
  );
};
