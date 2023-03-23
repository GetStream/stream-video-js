import { FC } from 'react';
import {
  FreeMode,
  Grid as GridModule,
  Navigation,
  Mousewheel,
  Swiper as SwiperClass,
} from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';

import classnames from 'classnames';

import { ParticipantBox } from '@stream-io/video-react-sdk';
import { Call, StreamVideoParticipant } from '@stream-io/video-client';

import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from '../Icons';

import styles from './ParticipantsSlider.module.css';

import { useLocalParticipant } from '@stream-io/video-react-bindings';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';

export type Props = {
  className?: string;
  call: Call;
  mode: 'horizontal' | 'vertical';
  height?: number;
  participants?: StreamVideoParticipant[];
};

export const Next: FC<{
  className?: string;
  mode: 'horizontal' | 'vertical';
}> = ({ mode }) => {
  return (
    <div className={classnames(styles.next, styles?.[mode])}>
      {mode === 'vertical' ? (
        <ChevronDown className={styles.navigationIcon} />
      ) : (
        <ChevronRight className={styles.navigationIcon} />
      )}
    </div>
  );
};

export const Previous: FC<{
  className?: string;
  mode: 'horizontal' | 'vertical';
}> = ({ mode }) => {
  return (
    <div className={classnames(styles.previous, styles?.[mode])}>
      {mode === 'vertical' ? (
        <ChevronUp className={styles.navigationIcon} />
      ) : (
        <ChevronLeft className={styles.navigationIcon} />
      )}
    </div>
  );
};

export const ParticipantsSlider: FC<Props> = ({
  className,
  mode = 'vertical',
  call,
  participants,
  height,
}) => {
  const localParticipant = useLocalParticipant();

  const rootClassName = classnames(
    styles.root,
    {
      [styles?.[mode]]: mode,
    },
    className,
  );

  const swiperClassName = classnames(styles.swiper, {
    [styles?.[mode]]: mode,
  });

  const slideClassName = classnames(styles.slide, {
    [styles?.[mode]]: mode,
  });

  const participantClassName = classnames(styles.participant, {
    [styles?.[mode]]: mode,
  });

  return (
    <div
      id="participant-slider"
      className={rootClassName}
      style={{ height: mode === 'vertical' ? `${height}px` : undefined }}
    >
      <Previous mode={mode} />
      <Next mode={mode} />
      <Swiper
        height={mode === 'vertical' ? height : undefined}
        modules={[Navigation, Mousewheel, GridModule, FreeMode]}
        slidesPerView="auto"
        slidesPerGroup={2}
        threshold={5}
        speed={400}
        spaceBetween={10}
        direction={mode}
        mousewheel={{ forceToAxis: true }}
        passiveListeners={true}
        navigation={{
          prevEl: `#participant-slider .${styles.previous}`,
          nextEl: `#participant-slider .${styles.next}`,
          disabledClass: 'hidden',
        }}
        freeMode={{
          enabled: true,
          momentumRatio: 0.75,
          momentumVelocityRatio: 0.75,
        }}
        className={swiperClassName}
      >
        {participants?.map((participant, index) => (
          <SwiperSlide key={index} className={slideClassName}>
            <div key={`participant-${index}`}>
              <ParticipantBox
                key={participant.sessionId}
                participant={participant}
                className={participantClassName}
                call={call}
                isMuted={participant.isLoggedInUser}
                sinkId={localParticipant?.audioOutputDeviceId}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};
