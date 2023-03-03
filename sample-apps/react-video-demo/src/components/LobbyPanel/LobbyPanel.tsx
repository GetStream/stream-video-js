import { FC } from 'react';
import classnames from 'classnames';

import { ParticipantBox } from '@stream-io/video-react-sdk';

import ControlMenu from '../ControlMenu';

import JoinContainer from '../JoinContainer';

import styles from './LobbyPanel.module.css';

export type Props = {
  joinCall(): void;
  loading?: boolean;
  logo: string;
  className?: string;
  avatar: string;
  call?: any;
  localParticipant: any;
};

export const LobbyPanel: FC<Props> = ({
  call,
  logo,
  avatar,
  joinCall,
  className,
  localParticipant,
  loading,
}) => {
  const rootClassName = classnames(styles.root, className);
  return (
    <div className={rootClassName}>
      <h1 className={styles.heading}>Optimizing Call Experience</h1>
      <p className={styles.description}>
        Our Edge Network is selecting the best server for your call...
      </p>
      <div className={styles.callContainer}>
        {call ? (
          <>
            <ParticipantBox
              call={call}
              participant={localParticipant}
              sinkId={localParticipant.audioOutputDeviceId}
            />
          </>
        ) : (
          <img className={styles.avatar} src={avatar} />
        )}
      </div>
      <ControlMenu localParticipant={localParticipant} call={call} />

      <JoinContainer
        className={styles.lobbyContainer}
        logo={logo}
        joinCall={joinCall}
      />
    </div>
  );
};
