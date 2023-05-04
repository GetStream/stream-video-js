import { FC, useRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import { StreamChat } from 'stream-chat';
import { StreamVideoParticipant } from '@stream-io/video-client';

import InvitePanel from '../InvitePanel';
import ParticipantsPanel from '../ParticipantsPanel';
import ChatPanel from '../ChatPanel';
import { StreamMark } from '../Icons';

import { usePanelContext } from '../../contexts/PanelContext';

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

  return (
    <div className={styles.sidebar}>
      <InvitePanel className={styles.invitePanel} callId={callId} />
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
              className={styles.participantsPanel}
              participants={participants}
              callId={callId}
            />
          ) : null}
        </div>
      </CSSTransition>

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
              className={styles.chatPanel}
              channelId={callId}
              channelType="videocall"
              client={chatClient}
            />
          ) : null}
        </div>
      </CSSTransition>
      <div className={styles.branding}>
        <StreamMark className={styles.logo} />
        <span>Powered by Stream</span>
      </div>
    </div>
  );
};
