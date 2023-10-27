import { FC } from 'react';
import classnames from 'classnames';
import {
  useCallStateHooks,
  useHasBrowserPermissions,
  User,
  VideoPreview,
} from '@stream-io/video-react-sdk';

import ControlMenu from '../ControlMenu';
import { Mic, MicMuted, Signal, Video } from '../Icons';

import { PoweredBy } from '../PoweredBy/PoweredBy';
import JoinContainer from '../JoinContainer';

import styles from './LobbyPanel.module.css';

export type Props = {
  joinCall(): void;
  user: User;
  className?: string;
  fastestEdge?: {
    id: string;
    latency: number;
  };
  isJoiningCall?: boolean;
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

export const StartingCamera = () => {
  return (
    <div className={styles.enableBrowserSettings}>
      <div className={styles.enableIcons}>
        <Video className={styles.enableVideo} />
      </div>
      <h2 className={styles.enableHeading}>Starting your camera...</h2>
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
  user,
  joinCall,
  className,
  fastestEdge,
  isJoiningCall,
}) => {
  const { useMicrophoneState } = useCallStateHooks();
  const { isMute: isMicMute } = useMicrophoneState();
  const rootClassName = classnames(styles.root, className);
  const callContainerClassNames = classnames(styles.callContainer, {
    [styles.audioEnabled]: !isMicMute,
  });

  const hasCameraPermission = useHasBrowserPermissions(
    'camera' as PermissionName,
  );
  const hasMicPermission = useHasBrowserPermissions(
    'microphone' as PermissionName,
  );

  const hasBrowserMediaPermission = hasCameraPermission && hasMicPermission;

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
            {isMicMute ? <MicMuted className={styles.micMuted} /> : null}
          </div>
          <div className={styles.signal}>
            <Signal className={styles.signalIcon} />
          </div>
        </div>

        <VideoPreview
          DisabledVideoPreview={
            hasBrowserMediaPermission
              ? () => <DisabledVideoPreview name={user.name} />
              : EnableBrowserSettings
          }
          NoCameraPreview={() => <DisabledVideoPreview name={user.name} />}
          StartingCameraPreview={StartingCamera}
        />
      </div>
      <ControlMenu className={styles.controls} />

      <JoinContainer
        className={styles.lobbyContainer}
        joinCall={joinCall}
        isJoiningCall={isJoiningCall}
      />
      <PoweredBy className={styles.poweredBy} />
    </div>
  );
};
