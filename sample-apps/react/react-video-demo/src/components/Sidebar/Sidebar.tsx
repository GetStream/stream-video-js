import { FC, useRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import { StreamChat } from 'stream-chat';
import { StreamVideoParticipant } from '@stream-io/video-client';

import InvitePanel from '../InvitePanel';
import ParticipantsPanel from '../ParticipantsPanel';
import ChatPanel from '../ChatPanel';

import { StepNames } from '../../contexts/TourContext';

import styles from './Sidebar.module.css';

export type Props = {
  callId: string;
  current: StepNames;
  showParticipants: boolean;
  showChat: boolean;
  chatClient?: StreamChat | null;
  participants: StreamVideoParticipant[];
};

export const Sidebar: FC<Props> = ({
  chatClient,
  callId,
  current,
  showParticipants,
  participants,
  showChat,
}) => {
  const chatRef = useRef(null);
  const participantsRef = useRef(null);

  return (
    <div className={styles.sidebar}>
      <InvitePanel
        className={styles.invitePanel}
        callId={callId}
        isFocused={current === StepNames.Invite}
      />
      <CSSTransition
        nodeRef={participantsRef}
        in={showParticipants}
        timeout={200}
        classNames={{
          enterActive: styles['animation-enter'],
          enterDone: styles['animation-enter-active'],
          exitActive: styles['animation-exit'],
          exitDone: styles['animation-exit-active'],
        }}
      >
        <div ref={participantsRef}>
          {showParticipants ? (
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
        in={showChat}
        timeout={200}
        classNames={{
          enterActive: styles['animation-enter'],
          enterDone: styles['animation-enter-active'],
          exitActive: styles['animation-exit'],
          exitDone: styles['animation-exit-active'],
        }}
      >
        <div ref={chatRef}>
          {showChat ? (
            <ChatPanel
              className={styles.chatPanel}
              isFocused={current === 2}
              channelId={callId}
              channelType="videocall"
              client={chatClient}
            />
          ) : null}
        </div>
      </CSSTransition>
    </div>
  );
};
