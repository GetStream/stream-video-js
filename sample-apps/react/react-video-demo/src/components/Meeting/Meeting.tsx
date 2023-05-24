import { FC } from 'react';
import classnames from 'classnames';
import { Call, StreamVideoParticipant } from '@stream-io/video-react-sdk';

import ScreenShareParticipants from '../ScreenShareParticipants';
import MeetingParticipants from '../MeetingParticipants';

import TourPanel from '../TourPanel';
import Notifications from '../Notifications';
import ParticipantsPanel from '../ParticipantsPanel';

import { useBreakpoint } from '../../hooks/useBreakpoints';
import { useTourContext } from '../../contexts/TourContext';
import { usePanelContext } from '../../contexts/PanelContext';

import styles from './Meeting.module.css';

export type Props = {
  call: Call;
  participants: StreamVideoParticipant[];
  isScreenSharing?: boolean;
  participantsAmount: number;
  callId: string;
};

export const Meeting: FC<Props> = ({
  call,
  participants,
  isScreenSharing,
  participantsAmount,
  callId,
}) => {
  const breakpoint = useBreakpoint();
  const { next, current, total, step, active, toggleTour } = useTourContext();

  const { toggleParticipants, isParticipantsVisible } = usePanelContext();

  const contentClasses = classnames(styles.content, {
    [styles.activeTour]: active && participantsAmount === 1,
    [styles.showParticipants]:
      isParticipantsVisible && (breakpoint === 'xs' || breakpoint === 'sm'),
  });

  const stageClasses = classnames(styles.stage, {
    [styles.showParticipants]:
      isParticipantsVisible && (breakpoint === 'xs' || breakpoint === 'sm'),
  });

  return (
    <>
      <Notifications className={styles.notifications} />
      {isParticipantsVisible && (breakpoint === 'xs' || breakpoint === 'sm') ? (
        <ParticipantsPanel
          className={styles.participantsPanel}
          callId={callId}
          close={toggleParticipants}
          participants={participants}
        />
      ) : null}
      <div className={contentClasses}>
        <div className={stageClasses}>
          {isScreenSharing ? (
            <ScreenShareParticipants call={call} />
          ) : (
            <MeetingParticipants call={call} />
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
