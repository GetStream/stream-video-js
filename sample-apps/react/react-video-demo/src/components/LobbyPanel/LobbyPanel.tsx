import { FC, useEffect, useState } from 'react';
import classnames from 'classnames';
import {
  useMediaDevices,
  User,
  VideoPreview,
} from '@stream-io/video-react-sdk';

import ControlMenu from '../ControlMenu';
import { MicMuted, Signal, Mic, Video } from '../Icons';

import { PoweredBy } from '../PoweredBy/PoweredBy';
import JoinContainer from '../JoinContainer';

import styles from './LobbyPanel.module.css';

export type Props = {
  joinCall(): void;
  logo: string;
  user: User;
  className?: string;
  call?: any;
  fastestEdge?: {
    id: string;
    latency: number;
  };
  isJoiningCall?: boolean;
  permissionsEnabled?: boolean;
};

export const EnableBrowserSettings: FC<any> = () => {
  return (
    <div className={styles.enableBrowserSettings}>
      <div className={styles.enableIcons}>
        <Mic className={styles.enableMic} />
        <Video className={styles.enableVideo} />
      </div>
      <h2 className={styles.enableHeading}>
        Allow your browser to use your camera and microphone.
      </h2>
      <p className={styles.enableDescription}>
        Stream needs access to your camera and microphone for the call. Please
        grant access when asked to confirm this decision on each brwoser and
        computer you use.
      </p>
    </div>
  );
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
  permissionsEnabled,
}) => {
  const [permissionsErrorComponent, setPermissionsErrorComponent] =
    useState<any>(() =>
      permissionsEnabled ? (
        <DisabledVideoPreview name={user.name} />
      ) : (
        <EnableBrowserSettings />
      ),
    );

  useEffect(() => {
    if (!permissionsEnabled) {
      setPermissionsErrorComponent(<EnableBrowserSettings />);
    }
  }, [permissionsEnabled]);

  const { initialAudioEnabled } = useMediaDevices();

  const rootClassName = classnames(styles.root, className);

  const callContainerClassNames = classnames(styles.callContainer, {
    [styles.audioEnabled]: initialAudioEnabled,
  });

  return (
    <div className={rootClassName}>
      <h1 className={styles.heading}>Optimizing Call Experience</h1>
      <p className={styles.description}>
        Our Edge Network is selecting the best server for your call...
      </p>
      <div className={callContainerClassNames}>
        <div className={styles.videoOverlay}>
          {fastestEdge?.id ? (
            <div className={styles.server}>Connected to {fastestEdge?.id}</div>
          ) : null}
          {fastestEdge?.latency ? (
            <div className={styles.latency}>
              <span className={styles.latencyIndicator} />
              {fastestEdge?.latency} ms
            </div>
          ) : null}
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
          NoCameraPreview={() => <DisabledVideoPreview name={user.name} />}
          StartingCameraPreview={() => permissionsErrorComponent}
          VideoErrorPreview={() => permissionsErrorComponent}
        />
      </div>
      <ControlMenu className={styles.controls} call={call} preview={true} />

      <JoinContainer
        className={styles.lobbyContainer}
        logo={logo}
        joinCall={joinCall}
        isJoiningCall={isJoiningCall}
      />
      <PoweredBy className={styles.poweredBy} />
    </div>
  );
};
