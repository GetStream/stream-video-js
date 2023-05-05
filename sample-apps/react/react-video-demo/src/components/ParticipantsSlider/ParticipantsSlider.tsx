import { FC, useEffect, useState } from 'react';
import { FreeMode, Grid as GridModule, Mousewheel, Navigation } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';

import classnames from 'classnames';

import {
  Call,
  StreamVideoParticipant,
  useLocalParticipant,
} from '@stream-io/video-react-sdk';

import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from '../Icons';
import Participant from '../Participant';

import { useBreakpoint } from '../../hooks/useBreakpoints';

import styles from './ParticipantsSlider.module.css';

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
  const breakpoint = useBreakpoint();
  const [derivedMode, setMode] = useState<'horizontal' | 'vertical'>(mode);

  useEffect(() => {
    if (breakpoint === 'xs' || breakpoint === 'sm') {
      setMode('horizontal');
    } else {
      setMode(mode);
    }
  }, [breakpoint]);

  const rootClassName = classnames(
    styles.root,
    {
      [styles?.[derivedMode]]: derivedMode,
    },
    className,
  );

  const swiperClassName = classnames(styles.swiper, {
    [styles?.[derivedMode]]: derivedMode,
  });

  const slideClassName = classnames(styles.slide, {
    [styles?.[derivedMode]]: derivedMode,
  });

  const participantClassName = classnames(styles.participant, {
    [styles?.[derivedMode]]: derivedMode,
  });

  if (derivedMode) {
    return (
      <div
        id="participant-slider"
        className={rootClassName}
        style={{
          height: derivedMode === 'vertical' ? `${height}px` : undefined,
        }}
      >
        <Previous mode={derivedMode} />
        <Next mode={derivedMode} />
        <Swiper
          height={derivedMode === 'vertical' ? height : undefined}
          modules={[Navigation, Mousewheel, GridModule, FreeMode]}
          slidesPerView="auto"
          slidesPerGroup={2}
          threshold={5}
          speed={400}
          spaceBetween={10}
          mousewheel={{ forceToAxis: true }}
          passiveListeners={true}
          direction={derivedMode}
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
                <Participant
                  key={participant.sessionId}
                  call={call}
                  className={participantClassName}
                  participant={participant}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    );
  }
  return null;
};
