import { FC } from 'react';
import classnames from 'classnames';
import { VideoPreview, useMediaDevices } from '@stream-io/video-react-sdk';

import { User } from '@stream-io/video-client';

import ControlMenu from '../ControlMenu';
import { MicMuted, Signal } from '../Icons';

import JoinContainer from '../JoinContainer';

import styles from './LobbyPanel.module.css';

export type Props = {
  joinCall(): void;
  logo: string;
  user: User;
  className?: string;
  call?: any;
  fastestEdge?: any;
  isJoiningCall?: boolean;
};

export const DisabledVideoPreview: FC<{ name?: string }> = ({ name }) => {
  return (
    <div className={styles.disabledPreview}>
      <div className={styles.fallbackAvatar}>{name?.split('')[0]}</div>
    </div>
  );
};

export const LobbyPanel: FC<Props> = ({
  call,
  logo,
  user,
  joinCall,
  className,
  fastestEdge,
  isJoiningCall,
}) => {
  const { initialAudioEnabled } = useMediaDevices();

  const rootClassName = classnames(styles.root, className);
  return (
    <div className={rootClassName}>
      <h1 className={styles.heading}>Optimizing Call Experience</h1>
      <p className={styles.description}>
        Our Edge Network is selecting the best server for your call...
      </p>
      <div className={styles.callContainer}>
        <div className={styles.videoOverlay}>
          <div className={styles.server}>Connected to {fastestEdge?.id}</div>
          <div className={styles.latency}>
            <span className={styles.latencyIndicator} />
            {fastestEdge?.green} ms
          </div>
          <div className={styles.name}>
            {user.name} (You)
            {initialAudioEnabled ? null : (
              <MicMuted className={styles.micMuted} />
            )}
          </div>
          <div className={styles.signal}>
            <Signal className={styles.signalIcon} />
          </div>
        </div>
        <VideoPreview
          DisabledVideoPreview={() => <DisabledVideoPreview name={user.name} />}
        />
      </div>
      <ControlMenu className={styles.controls} call={call} preview={true} />

      <JoinContainer
        className={styles.lobbyContainer}
        logo={logo}
        joinCall={joinCall}
        isJoiningCall={isJoiningCall}
      />
    </div>
  );
};
