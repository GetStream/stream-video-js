import { FC } from 'react';
import classnames from 'classnames';
import { useLayoutManager } from '../Layout/MeetingLayout/MeetingLayoutManager';

import TourPanel from '../TourPanel';
import Notifications from '../Notifications';

import { useBreakpoint } from '../../hooks/useBreakpoints';
import { useTourContext } from '../../contexts/TourContext';
import { usePanelContext } from '../../contexts/PanelContext';

import styles from './Meeting.module.css';
import { SpeakerLayout } from '@stream-io/video-react-sdk';
import { Overlay, VideoPlaceholder } from '../Participant/Participant';

export type Props = {
  isScreenSharing?: boolean;
  participantsAmount: number;
};

export const Meeting: FC<Props> = ({ isScreenSharing, participantsAmount }) => {
  const breakpoint = useBreakpoint();
  const { next, current, total, step, active, toggleTour } = useTourContext();

  const { participantsPanelVisibility } = usePanelContext();

  const contentClasses = classnames(styles.content, {
    [styles.activeTour]: active && participantsAmount === 1,
    [styles.showParticipants]:
      participantsPanelVisibility &&
      (breakpoint === 'xs' || breakpoint === 'sm'),
  });

  const stageClasses = classnames(styles.stage, {
    [styles.showParticipants]:
      participantsPanelVisibility &&
      (breakpoint === 'xs' || breakpoint === 'sm'),
  });

  const { currentLayout } = useLayoutManager();
  return (
    <>
      <Notifications className={styles.notifications} />
      <div className={contentClasses}>
        <div className={stageClasses}>
          {isScreenSharing ? (
            // use speaker layout for screen share, as it's the only one that
            // supports it out of the box.
            <SpeakerLayout
              participantsBarPosition="bottom"
              ParticipantViewUISpotlight={Overlay}
              ParticipantViewUIBar={Overlay}
              VideoPlaceholder={VideoPlaceholder}
            />
          ) : (
            currentLayout.getElement()
          )}
        </div>
      </div>
      {active && participantsAmount === 1 ? (
        <div className={styles.tour}>
          <TourPanel
            className={styles.tourPanel}
            header={step?.header}
            explanation={step?.explanation}
            next={next}
            current={current}
            total={total}
            close={toggleTour}
          />
        </div>
      ) : null}
    </>
  );
};
