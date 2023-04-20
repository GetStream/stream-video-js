import { FC, useEffect, useState } from 'react';
import classnames from 'classnames';

import ControlMenu from '../ControlMenu';
import Button from '../Button';
import ControlButton from '../ControlButton';
import {
  Chat,
  People,
  Options,
  Leave,
  Record,
  ShareScreen,
  Stop,
  LoadingSpinner,
} from '../Icons';
import Portal from '../Portal';
import SettingsPanel from '../SettingsPanel';

import { useTourContext, StepNames } from '../../contexts/TourContext';
import { useModalContext } from '../../contexts/ModalContext';
import { usePanelContext } from '../../contexts/PanelContext';

import styles from './Footer.module.css';

export type Props = {
  call: any;
  isCallActive: boolean;
  callId: string;
  handleStartRecording: () => void;
  handleStopRecording: () => void;
  toggleShareScreen: () => void;
  isRecording?: boolean;
  isAwaitingRecording?: boolean;
  isScreenSharing?: boolean;
  unreadMessages?: number;
  participantCount?: number;
  leave(): void;
};

export const Footer: FC<Props> = ({
  call,
  callId,
  handleStartRecording,
  handleStopRecording,
  toggleShareScreen,
  isRecording,
  isAwaitingRecording,
  isScreenSharing,
  unreadMessages,
  participantCount,
  leave,
}) => {
  const { current } = useTourContext();
  const { isVisible } = useModalContext();
  const {
    isChatVisible,
    isParticipantsVisible,
    toggleChat,
    toggleParticipants,
  } = usePanelContext();

  const [showSettingsPanel, setShowSettingsPanel] = useState<boolean>(true);

  useEffect(() => {
    if (isVisible && showSettingsPanel) {
      setShowSettingsPanel(false);
    }
  }, [showSettingsPanel, isVisible]);

  useEffect(() => {
    if (current === StepNames.Chat && isChatVisible === false) {
      toggleChat();
    }

    if (current === StepNames.Settings && showSettingsPanel === false) {
      setShowSettingsPanel(true);
    }
  }, [current, isChatVisible]);

  useEffect(() => {
    setShowSettingsPanel(isVisible || current === StepNames.Settings);
  }, [isVisible, current]);

  const settingsClassNames = classnames(styles.settings, {
    [styles.active]: current === StepNames.Settings,
  });

  const recordClassNames = classnames(styles.record, {
    [styles.recording]: isRecording,
    [styles.awaitingRecording]: isAwaitingRecording,
  });

  return (
    <section className={styles.footer}>
      <div className={styles.settingsContainer}>
        <ControlButton
          className={settingsClassNames}
          portalId="settings"
          onClick={() => setShowSettingsPanel(!showSettingsPanel)}
          showPanel={showSettingsPanel}
          label="More"
          panel={
            <Portal className={styles.settingsPortal} selector="settings">
              <SettingsPanel
                callId={callId}
                toggleRecording={
                  !isRecording ? handleStartRecording : undefined
                }
                toggleShareScreen={toggleShareScreen}
              />
            </Portal>
          }
          prefix={<Options />}
        />

        <Button
          className={recordClassNames}
          label="Record"
          color={isRecording ? 'active' : 'secondary'}
          shape="square"
          onClick={!isRecording ? handleStartRecording : undefined}
        >
          <>
            {isRecording && !isAwaitingRecording && (
              <div onClick={handleStopRecording}>
                <Stop />
              </div>
            )}

            {!isRecording && !isAwaitingRecording && <Record />}

            {!isRecording && isAwaitingRecording && (
              <LoadingSpinner className={styles.loadingSpinner} />
            )}
          </>
        </Button>

        <Button
          className={styles.shareScreen}
          label="Share screen"
          color={isScreenSharing ? 'active' : 'secondary'}
          shape="square"
          onClick={toggleShareScreen}
        >
          <ShareScreen />
        </Button>
      </div>
      <div className={styles.controls}>
        <ControlMenu
          className={styles.controlMenu}
          call={call}
          initialAudioMuted={true}
          initialVideoMuted={false}
        />
        <Button
          className={styles.cancel}
          color="danger"
          shape="square"
          onClick={() => leave()}
        >
          <Leave />
          <div className={styles.endCall}>End call</div>
        </Button>
      </div>
      <div className={styles.toggles}>
        <Button
          className={styles.chat}
          label="Chat"
          color={
            current === StepNames.Chat
              ? 'primary'
              : isChatVisible
              ? 'active'
              : 'secondary'
          }
          shape="square"
          onClick={() => toggleChat()}
        >
          <Chat />
          {unreadMessages && unreadMessages > 0 ? (
            <span className={styles.chatCounter}>{unreadMessages}</span>
          ) : null}
        </Button>
        <Button
          label="Participants"
          className={styles.participants}
          color={isParticipantsVisible ? 'active' : 'secondary'}
          shape="square"
          onClick={toggleParticipants}
        >
          <People />
          {!isParticipantsVisible &&
          participantCount &&
          participantCount > 1 ? (
            <span className={styles.participantCounter}>
              {participantCount}
            </span>
          ) : null}
        </Button>
      </div>
    </section>
  );
};
