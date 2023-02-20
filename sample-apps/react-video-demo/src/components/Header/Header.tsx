import { FC } from 'react';
import classnames from 'classnames';
import { useCurrentCallStatsReport } from '@stream-io/video-react-sdk';

import { Security } from '../Icons';
import ControlButton from '../ControlButton';

import styles from './Header.module.css';

export type Props = {
  className?: string;
  callId: string;
  logo: string;
  elapsed?: string;
  participants?: any;
  isCallActive: boolean;
  particpants?: any;
  latency?: boolean;
};

export const CallIdentification: FC<
  Pick<Props, 'className' | 'callId' | 'logo'>
> = ({ className, callId, logo }) => {
  const rootClassName = classnames(styles.callIdentification, className);

  return (
    <div className={rootClassName}>
      <img src={logo} className={styles.logo} />
      {callId}
    </div>
  );
};

export const LatencyIndicator: FC<Pick<Props, 'className' | 'latency'>> = ({
  className,
  latency,
}) => {
  const rootClassName = classnames(styles.latency, className);

  return (
    <ControlButton className={rootClassName} panel={<div></div>}>
      {latency} ms
    </ControlButton>
  );
};

export const Elapsed: FC<Pick<Props, 'className' | 'elapsed'>> = ({
  className,
  elapsed,
}) => {
  const rootClassName = classnames(styles.elapsed, className);

  return <div className={rootClassName}>{elapsed}</div>;
};

export const Participants: FC<Pick<Props, 'className' | 'participants'>> = ({
  className,
  participants,
}) => {
  const rootClassName = classnames(styles.participants, className);
  const names = participants.map((participant: any) => participant?.user?.name);
  const last = names.pop();
  return (
    <div className={rootClassName}>
      <div className={styles.avatars}>
        {participants.map((participant: any) => {
          return (
            <img className={styles.avatar} src={participant?.user?.imageUrl} />
          );
        })}
      </div>
      <h5 className={styles.names}>
        {names.join(', ')} and {last}
      </h5>
      <Security />
    </div>
  );
};

export const Header: FC<Props> = ({
  className,
  callId,
  logo,
  elapsed,
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

  if (isCallActive) {
    return (
      <div className={rootClassName}>
        {participants?.length > 1 ? (
          <Participants participants={participants} />
        ) : (
          <CallIdentification callId={callId} logo={logo} />
        )}
        <Elapsed elapsed={elapsed} />
        <LatencyIndicator />
      </div>
    );
  }

  return (
    <>
      <CallIdentification callId={callId} logo={logo} />
    </>
  );
};
