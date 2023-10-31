import { useEffect } from 'react';
import classnames from 'classnames';
import { isMobile, isTablet } from 'mobile-device-detect';
import { StreamChat } from 'stream-chat';

import ControlMenu from '../ControlMenu';
import Button from '../Button';
import { PanelButton } from '../ControlButton';
import {
  Chat,
  Layout,
  Leave,
  Like,
  LoadingSpinner,
  Options,
  People,
  Record,
  ShareScreen,
  Stop,
} from '../Icons';
import Portal from '../Portal';
import SettingsPanel from '../SettingsPanel';
import ReactionsPanel from '../ReactionsPanel';
import { NewMessageNotification } from '../NewMessageNotification';

import { useModalContext } from '../../contexts/ModalContext';
import { PANEL_VISIBILITY, usePanelContext } from '../../contexts/PanelContext';

import styles from './Footer.module.css';
import { useLayoutManager } from '../Layout/MeetingLayout/MeetingLayoutManager';
import {
  OptionsList,
  OptionsListItem,
  SettingsMenu,
} from '../SettingsMenu/SettingsMenu';

export type FooterProps = {
  call: any;
  isCallActive: boolean;
  handleStartRecording: () => void;
  handleStopRecording: () => void;
  toggleShareScreen: () => void;
  chatClient?: StreamChat | null;
  isRecording?: boolean;
  isAwaitingRecording?: boolean;
  isScreenSharing?: boolean;
  unreadMessages?: number;
  participantCount?: number;
  leave(): void;
};

export const Footer = ({
  call,
  chatClient,
  handleStartRecording,
  handleStopRecording,
  toggleShareScreen,
  isRecording,
  isAwaitingRecording,
  isScreenSharing,
  unreadMessages,
  participantCount,
  leave,
}: FooterProps) => {
  const { showModal } = useModalContext();
  const {
    chatPanelVisibility,
    participantsPanelVisibility,
    isSettingsVisible,
    isReactionVisible,
    isLayoutSwitcherVisible,
    toggleHide,
  } = usePanelContext();

  useEffect(() => {
    if (showModal) {
      toggleHide('device-settings');
    }
  }, [showModal, toggleHide]);

  const recordClassNames = classnames(styles.record, {
    [styles.recording]: isRecording,
    [styles.awaitingRecording]: isAwaitingRecording,
  });

  const { layouts, currentLayout, switchLayout, isSwitchingAllowed } =
    useLayoutManager();

  return (
    <section className={styles.footer}>
      <div className={styles.settingsContainer}>
        <PanelButton
          className={styles.settings}
          portalId="settings"
          showPanel={isSettingsVisible}
          onClick={() => toggleHide('device-settings')}
          label="More"
          panel={
            <Portal className={styles.settingsPortal} selector="settings">
              <SettingsPanel
                callId={call.id}
                toggleRecording={
                  !isRecording ? handleStartRecording : handleStopRecording
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

        {!isMobile && !isTablet && (
          <Button
            className={styles.shareScreen}
            label="Share"
            color={isScreenSharing ? 'active' : 'secondary'}
            shape="square"
            onClick={toggleShareScreen}
          >
            <ShareScreen />
          </Button>
        )}

        <PanelButton
          className={styles.reactions}
          portalId="reactions"
          showPanel={isReactionVisible}
          onClick={() => toggleHide('reaction')}
          label="Reaction"
          panel={
            <Portal className={styles.reactionsPortal} selector="reactions">
              <ReactionsPanel />
            </Portal>
          }
          prefix={<Like className={styles.likeIcon} />}
        />
      </div>
      <div className={styles.controls}>
        <ControlMenu className={styles.controlMenu} />
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
        {isSwitchingAllowed && (
          <PanelButton
            label="Layout"
            portalId="layout-selector"
            showPanel={isLayoutSwitcherVisible}
            onClick={() => toggleHide('layout-selector')}
            className={styles.layoutSelectorButton}
            panel={
              <Portal
                selector="layout-selector"
                className={styles.layoutSelectorContainer}
              >
                <SettingsMenu title="Choose layout">
                  <OptionsList>
                    {layouts.map((layout) => (
                      <OptionsListItem
                        key={layout.id}
                        label={layout.displayName}
                        id={`id-${layout.id}`}
                        name="layout"
                        checked={currentLayout.id === layout.id}
                        defaultChecked={currentLayout.id === layout.id}
                        value={layout.id}
                        onClick={() => switchLayout(layout.id)}
                      />
                    ))}
                  </OptionsList>
                </SettingsMenu>
              </Portal>
            }
          >
            <Layout />
          </PanelButton>
        )}
        <NewMessageNotification
          chatClient={chatClient}
          channelWatched
          disableOnChatOpen={chatPanelVisibility === PANEL_VISIBILITY.expanded}
        >
          <Button
            className={styles.chat}
            label="Chat"
            color={
              chatPanelVisibility !== PANEL_VISIBILITY.hidden
                ? 'active'
                : 'secondary'
            }
            shape="square"
            onClick={() => toggleHide('chat')}
          >
            <Chat />
            {unreadMessages && unreadMessages > 0 ? (
              <span className={styles.chatCounter}>{unreadMessages}</span>
            ) : null}
          </Button>
        </NewMessageNotification>
        <Button
          label="Participants"
          className={styles.participants}
          color={
            participantsPanelVisibility !== PANEL_VISIBILITY.hidden
              ? 'active'
              : 'secondary'
          }
          shape="square"
          onClick={() => toggleHide('participant-list')}
        >
          <People />
          {!participantsPanelVisibility &&
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
