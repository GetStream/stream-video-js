import { ReactNode, useEffect, useMemo, useState } from 'react';
import classnames from 'classnames';
import { differenceInSeconds } from 'date-fns';
import { useCallStateHooks } from '@stream-io/video-react-sdk';

import Button from '../Button';
import { People, Security } from '../Icons';
import { ParticipantsPanelSmallScreen } from '../ParticipantsPanel';

import { useBreakpoint } from '../../hooks/useBreakpoints';

import { PANEL_VISIBILITY, usePanelContext } from '../../contexts/PanelContext';

import { logoURI } from '../../utils/constants';

import styles from './Header.module.css';

export type HeaderProps = {
  className?: string;
  callId: string;
  participants?: any;
  isCallActive: boolean;
  particpants?: any;
};

export const CallIdentification = ({
  className,
  callId,
}: Pick<HeaderProps, 'className' | 'callId'>) => {
  const rootClassName = classnames(styles.callIdentification, className);

  return (
    <div className={rootClassName}>
      <img src={logoURI} className={styles.logo} alt="logo" />
      <span className={styles.callId}>{callId}</span>
    </div>
  );
};

export const LatencyIndicator = ({
  className,
}: Pick<HeaderProps, 'className'>) => {
  const { useCallStatsReport } = useCallStateHooks();
  const statsReport = useCallStatsReport();
  const latency = statsReport?.publisherStats?.averageRoundTripTimeInMs ?? 0;
  const rootClassName = classnames(styles.latency, className);
  const latencyIndicatorClassName = classnames(styles.latencyIndicator, {
    [styles.green]: latency && latency <= 100,
    [styles.yellow]: latency && latency > 100 && latency < 150,
    [styles.red]: latency && latency > 150,
  });
  return (
    <div className={rootClassName}>
      <div className={styles.latencyContainer}>
        <div className={latencyIndicatorClassName}></div>
        {latency} ms
      </div>
    </div>
  );
};

export const Elapsed = ({
  className,
  joinedAt,
}: {
  className?: string;
  joinedAt: number;
}) => {
  const rootClassName = classnames(styles.elapsedContainer, className);
  const [elapsed, setElapsed] = useState<any>();

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsedSeconds = differenceInSeconds(
        Date.now(),
        new Date(joinedAt * 1000),
      );

      const date = new Date(0);
      date.setSeconds(elapsedSeconds);
      const format = date.toISOString().substring(14, 19);

      setElapsed(format);
    }, 1000);
    return () => clearInterval(interval);
  }, [joinedAt]);

  return (
    <div className={rootClassName}>
      <div className={styles.elapsed}>{elapsed}</div>
    </div>
  );
};

type ImgProps = {
  className?: string;
  src: string;
  placeholder: ReactNode;
};

export const Img = ({ className, src, placeholder }: ImgProps) => {
  const doesExist = useMemo(() => {
    if (src === '') {
      return false;
    }
    const img = new Image();
    img.src = src;

    if (img.complete) {
      return true;
    } else {
      img.onload = () => {
        return true;
      };

      img.onerror = () => {
        return false;
      };
    }
  }, [src]);

  if (doesExist && src !== '') {
    return <img alt="avatar" className={className} src={src} />;
  }
  return <>{placeholder}</>;
};

export const Participants = ({
  className,
  participants,
}: Pick<HeaderProps, 'className' | 'participants'>) => {
  const rootClassName = classnames(styles.participants, className);
  const maxDisplayParticipants = participants.slice(0, 3);
  const names = maxDisplayParticipants.map(
    (participant: any) => participant?.name ?? participant.userId,
  );
  const last = names.pop();

  return (
    <div className={rootClassName}>
      <img src={logoURI} className={styles.logo} alt="logo" />
      <div className={styles.innerParticipants}>
        <ul className={styles.avatars}>
          {maxDisplayParticipants.map((participant: any) => {
            return (
              <li
                key={participant?.name ?? participant.userId}
                className={styles.participant}
              >
                <Img
                  className={styles.avatar}
                  src={participant?.image}
                  placeholder={
                    <div className={styles.placeholder}>
                      {String(participant?.name ?? participant.userId)?.charAt(
                        0,
                      )}
                    </div>
                  }
                />
              </li>
            );
          })}
        </ul>
        <h5 className={styles.names}>
          {names.join(', ')} and {last} {participants.length > 3 ? '...' : ''}
        </h5>
      </div>
      <Security className={styles.security} />
    </div>
  );
};

export const ParticipantsToggle = () => {
  const { participantsPanelVisibility, toggleHide } = usePanelContext();

  return (
    <Button
      label="Participants"
      className={styles.participantsToggle}
      color={participantsPanelVisibility ? 'active' : 'secondary'}
      shape="square"
      onClick={() => toggleHide('participant-list')}
    >
      <People />
    </Button>
  );
};

export const Header = ({
  className,
  callId,
  isCallActive = true,
  participants,
}: HeaderProps) => {
  const breakpoint = useBreakpoint();
  const { participantsPanelVisibility } = usePanelContext();

  const rootClassName = classnames(
    styles.header,
    {
      [styles.activeCall]: isCallActive,
    },
    className,
  );

  const me = participants?.[0];

  if (isCallActive) {
    return participantsPanelVisibility !== PANEL_VISIBILITY.hidden &&
      (breakpoint === 'xs' || breakpoint === 'sm') ? (
      <ParticipantsPanelSmallScreen
        className={styles.participantsPanel}
        callId={callId}
        participants={participants}
      />
    ) : (
      <div className={rootClassName}>
        {participants?.length > 1 ? (
          <Participants participants={participants} />
        ) : (
          <CallIdentification callId={callId} />
        )}
        <Elapsed joinedAt={me?.joinedAt?.seconds} />
        {breakpoint === 'xs' || breakpoint === 'sm' ? (
          <ParticipantsToggle />
        ) : (
          <LatencyIndicator />
        )}
      </div>
    );
  }

  return (
    <>
      <CallIdentification callId={callId} />
    </>
  );
};
