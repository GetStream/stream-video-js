import clsx from 'clsx';
import {
  useCall,
  useDefaultAudioOutputLevel,
} from '@stream-io/video-react-bindings';
import { MouseEventHandler } from 'react';
import { Icon } from '../Icon';
import { StreamVideoParticipant } from '@stream-io/video-client';

export type AudioLevelControlProps = {
  participant?: StreamVideoParticipant;
};

export const AudioOutputLevelSlider = ({
  participant,
}: AudioLevelControlProps) => {
  const call = useCall();
  const defaultAudioOutputLevel = useDefaultAudioOutputLevel();

  const audioLevel = participant?.audioOutputLevel ?? defaultAudioOutputLevel;

  const handleClick: MouseEventHandler = (event) => {
    const { width, x } = event.currentTarget.getBoundingClientRect();

    const volume = +((event.clientX - x) / width).toFixed(2);

    call?.setAudioOutputLevel(volume > 0 ? volume : 0);
  };

  return (
    <div
      className={clsx('str-video__audio-level-slider', {
        'str-video__audio-level-slider--mute': !audioLevel,
      })}
    >
      <Icon icon={audioLevel ? 'speaker' : 'speaker-off'} />
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
