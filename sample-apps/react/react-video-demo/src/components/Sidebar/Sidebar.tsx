import { FC, useRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import { StreamChat } from 'stream-chat';
import { StreamVideoParticipant } from '@stream-io/video-react-sdk';
import classnames from 'classnames';

import InvitePanel from '../InvitePanel';
import ParticipantsPanel from '../ParticipantsPanel';
import ChatPanel from '../ChatPanel';

import PoweredBy from '../PoweredBy';

import { usePanelContext } from '../../contexts/PanelContext';
import { useTourContext, StepNames } from '../../contexts/TourContext';

import styles from './Sidebar.module.css';

export type Props = {
  callId: string;
  chatClient?: StreamChat | null;
  participants: StreamVideoParticipant[];
};

export const Sidebar: FC<Props> = ({ chatClient, callId, participants }) => {
  const chatRef = useRef(null);
  const participantsRef = useRef(null);

  const { isChatVisible, isParticipantsVisible } = usePanelContext();
  const { current: currenTourStep } = useTourContext();

  const chatPanelClassName = classnames(styles.chatPanel, {
    [styles.visible]: isChatVisible,
    [styles.withParticipants]: isParticipantsVisible,
  });

  const particpantsPanelClassName = classnames(styles.participantsPanel, {
    [styles.visible]: isParticipantsVisible,
    [styles.withChat]: isChatVisible,
  });

  return (
    <div className={styles.sidebar}>
      <InvitePanel
        className={styles.invitePanel}
        callId={callId}
        isFocused={currenTourStep === StepNames.Invite}
        fulllHeight
      />

      <div className={particpantsPanelClassName}>
        <CSSTransition
          nodeRef={participantsRef}
          in={isParticipantsVisible}
          timeout={200}
          classNames={{
            enterActive: styles['animation-enter'],
            enterDone: styles['animation-enter-active'],
            exitActive: styles['animation-exit'],
            exitDone: styles['animation-exit-active'],
          }}
        >
          <div ref={participantsRef}>
            {isParticipantsVisible ? (
              <ParticipantsPanel
                className={styles.participants}
                participants={participants}
                callId={callId}
                fulllHeight
              />
            ) : null}
          </div>
        </CSSTransition>
      </div>

      <div className={chatPanelClassName}>
        <CSSTransition
          nodeRef={chatRef}
          in={isChatVisible}
          timeout={200}
          classNames={{
            enterActive: styles['animation-enter'],
            enterDone: styles['animation-enter-active'],
            exitActive: styles['animation-exit'],
            exitDone: styles['animation-exit-active'],
          }}
        >
          <div ref={chatRef}>
            {isChatVisible ? (
              <ChatPanel
                className={styles.chat}
                channelId={callId}
                channelType="videocall"
                client={chatClient}
                fulllHeight
              />
            ) : null}
          </div>
        </CSSTransition>
      </div>

      <PoweredBy className={styles.branding} />
    </div>
  );
};
