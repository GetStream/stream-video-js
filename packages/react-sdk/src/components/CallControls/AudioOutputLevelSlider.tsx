import clsx from 'clsx';
import {
  useCall,
  useMasterAudioOutputLevel,
} from '@stream-io/video-react-bindings';
import { useCallback, useEffect, useRef } from 'react';
import { Icon } from '../Icon';
import { StreamVideoParticipant } from '@stream-io/video-client';
import { useDraggable } from '../../hooks/useDraggable';

export type AudioLevelControlProps = {
  /**
   * Participant whose sound volume is to be adjusted.
   */
  participant?: StreamVideoParticipant;
  /**
   * Interval in which the slider thumb position is adjusted.
   */
  sliderDragThrottleInterval?: number;
};

export const AudioOutputLevelSlider = ({
  participant,
  sliderDragThrottleInterval = 0,
}: AudioLevelControlProps) => {
  const call = useCall();
  const masterAudioOutputLevel = useMasterAudioOutputLevel();
  const thumbRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const audioLevel = participant?.audioOutputLevel ?? masterAudioOutputLevel;

  const calculateVolumeFromTargetPosition = useCallback((event: MouseEvent) => {
    if (!trackRef.current) return;

    const { left: trackLeft, width } = trackRef.current.getBoundingClientRect();
    const volume = +((event.clientX - trackLeft) / width).toFixed(2);
    return volume < 0 ? 0 : volume > 1 ? 1 : volume;
  }, []);

  const handleSetAudioOutputOnDrag = useCallback(
    (event: MouseEvent) => {
      const validatedVolume = calculateVolumeFromTargetPosition(event);
      if (typeof validatedVolume === 'undefined') return;
      call?.setAudioOutputLevel(validatedVolume, participant?.sessionId);
    },
    [calculateVolumeFromTargetPosition, call, participant?.sessionId],
  );

  const handleSetAudioOutputOnClick = useCallback(
    (event: MouseEvent) => {
      const validatedVolume = calculateVolumeFromTargetPosition(event);
      if (typeof validatedVolume === 'undefined') return;
      call?.setAudioOutputLevel(validatedVolume, participant?.sessionId);

      if (thumbRef.current && trackRef.current) {
        const { width: trackWidth } = trackRef.current.getBoundingClientRect();
        const { width: thumbWidth } = thumbRef.current.getBoundingClientRect();
        thumbRef.current.style.left =
          trackWidth * validatedVolume - thumbWidth / 2 + 'px';
      }
    },
    [calculateVolumeFromTargetPosition, call, participant?.sessionId],
  );

  useEffect(() => {
    if (!trackRef.current) return;
    const track = trackRef.current;
    track.addEventListener('click', handleSetAudioOutputOnClick);

    return () => {
      track?.removeEventListener('click', handleSetAudioOutputOnClick);
    };
  }, [handleSetAudioOutputOnClick]);

  useDraggable({
    axis: 'x',
    containerElementRef: trackRef,
    dragElementRef: thumbRef,
    onMouseMove: handleSetAudioOutputOnDrag,
    startPosition: { left: { amount: audioLevel * 100, unit: '%' } },
    throttleInterval: sliderDragThrottleInterval,
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
      <div className="str-video__audio-level-slider__track" ref={trackRef}>
        <div
          className="str-video__audio-level-slider__level"
          style={{ transform: `scaleX(${audioLevel})` }}
        />
        <div className="str-video_audio-level-slider__thumb" ref={thumbRef} />
      </div>
    </div>
  );
};
