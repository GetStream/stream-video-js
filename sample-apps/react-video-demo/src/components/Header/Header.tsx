import { FC } from 'react';
import classnames from 'classnames';
import { useParticipants } from '@stream-io/video-react-sdk';

import styles from './Header.module.css';

export type Props = {
  className?: string;
  callId: string;
  logo: string;
  latency?: number;
  elapsed?: string;
  isCallActive: boolean;
};

export const CallIdentification: FC<Pick<Props, "className" | "classId" | "logo">> = ({ className, callId, logo }) => {
  const rootClassName = classnames(styles.callIdentification, className);

  return (
    <div className={rootClassName}>
      <img src={logo} className={styles.logo} />
      {callId}
    </div>
  );
};

export const LatencyIndicator: FC<Pick<Props, "className" | "latency">> = ({
  className,
  latency,
}) => {
  const rootClassName = classnames(styles.latency, className);

  return <div className={rootClassName}>{latency}</div>;
};

export const Elapsed: FC<Pick<Props, "className" | "elapsed">> = ({
  className,
  elapsed,
}) => {
  const rootClassName = classnames(styles.elapsed, className);

  return <div className={rootClassName}>{elapsed}</div>;
};

export const Participants: FC<Pick<Props, "className" | "participants">> = ({ className, participants }) => {
  const rootClassName = classnames(styles.participants, className);

  return <div className={rootClassName}></div>;
};

export const Header: FC<Props> = ({
  className,
  callId,
  logo,
  latency,
  elapsed,
  isCallActive,
}) => {
  const rootClassName = classnames(
    styles.header,
    {
      [styles.activeCall]: isCallActive,
    },
    className,
  );

  const participants = useParticipants();

  if (isCallActive) {
    return (
      <div className={rootClassName}>
        {participants && participants.length > 1 ? (
          <Participants participants={participants} />
        ) : (
          <CallIdentification callId={callId} logo={logo} />
        )}
        <Elapsed elapsed={elapsed} />
        <LatencyIndicator latency={latency} />
      </div>
    );
  }

  return (
    <div className={rootClassName}>
      <CallIdentification callId={callId} logo={logo} />
    </div>
  );
};
