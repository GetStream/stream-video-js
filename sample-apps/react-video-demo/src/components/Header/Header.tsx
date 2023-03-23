import { FC, ReactNode, useEffect, useState, useMemo } from 'react';
import classnames from 'classnames';
import { differenceInSeconds } from 'date-fns';

import { Security } from '../Icons';
import ControlButton from '../ControlButton';

import styles from './Header.module.css';

export type Props = {
  className?: string;
  callId: string;
  logo: string;
  participants?: any;
  isCallActive: boolean;
  particpants?: any;
  latency?: number;
};

export const CallIdentification: FC<
  Pick<Props, 'className' | 'callId' | 'logo'>
> = ({ className, callId, logo }) => {
  const rootClassName = classnames(styles.callIdentification, className);

  return (
    <div className={rootClassName}>
      <img src={logo} className={styles.logo} />
      <span className={styles.callId}>{callId}</span>
    </div>
  );
};

export const LatencyIndicator: FC<Pick<Props, 'className' | 'latency'>> = ({
  className,
  latency,
}) => {
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

export const Elapsed: FC<{ className?: string; joinedAt: number }> = ({
  className,
  joinedAt,
}) => {
  const rootClassName = classnames(styles.elapsedContainer, className);
  const [elapsed, setElapsed] = useState<any>();

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsedSeconds = differenceInSeconds(
        Date.now(),
        new Date(joinedAt * 1000),
      );

      const format = new Date(elapsedSeconds * 1000)
        .toISOString()
        .substring(14, 19);

      setElapsed(format);
    }, 1000);
    return () => clearInterval(interval);
  }, [joinedAt]);

  return (
    <div className={rootClassName}>
      <div className={styles.elapsed}>{elapsed || '00:00'}</div>
    </div>
  );
};

export const Img: FC<{
  className?: string;
  src: string;
  placeholder: ReactNode;
}> = ({ className, src, placeholder }) => {
  const doesExist = useMemo(() => {
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

  if (doesExist) {
    return <img alt="avatar" className={className} src={src} />;
  }
  return <>{placeholder}</>;
};

export const Participants: FC<Pick<Props, 'className' | 'participants'>> = ({
  className,
  participants,
}) => {
  const rootClassName = classnames(styles.participants, className);
  const maxDisplayParticipants = participants.slice(0, 3);
  const names = maxDisplayParticipants.map(
    (participant: any) => participant?.name,
  );
  const last = names.pop();

  return (
    <div className={rootClassName}>
      <div className={styles.avatars}>
        {maxDisplayParticipants.map((participant: any) => {
          return (
            <Img
              className={styles.avatar}
              src={participant?.image}
              placeholder={
                <div className={styles.placeholder}>
                  {String(participant?.name)?.charAt(0)}
                </div>
              }
            />
          );
        })}
      </div>
      <h5 className={styles.names}>
        {names.join(', ')} and {last} {participants.length > 3 ? '...' : ''}
      </h5>
      <Security />
    </div>
  );
};

export const Header: FC<Props> = ({
  className,
  callId,
  logo,
  latency,
  isCallActive = true,
  participants,
}) => {
  const rootClassName = classnames(
    styles.header,
    {
      [styles.activeCall]: isCallActive,
    },
    className,
  );

  const me = participants?.[0];

  if (isCallActive) {
    return (
      <div className={rootClassName}>
        {participants?.length > 1 ? (
          <Participants participants={participants} />
        ) : (
          <CallIdentification callId={callId} logo={logo} />
        )}
        <Elapsed joinedAt={me?.joinedAt?.seconds} />
        <LatencyIndicator latency={latency} />
      </div>
    );
  }

  return (
    <>
      <CallIdentification callId={callId} logo={logo} />
    </>
  );
};
