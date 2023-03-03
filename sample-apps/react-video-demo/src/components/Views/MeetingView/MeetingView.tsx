import { FC, useCallback, useState } from 'react';

import { Stage } from '@stream-io/video-react-sdk';
import {
  useActiveCall,
  useParticipants,
} from '@stream-io/video-react-bindings';

import Header from '../../Header';
import Footer from '../../Footer';

import MeetingLayout from '../../Layout/MeetingLayout';

import InvitePanel from '../../InvitePanel';
import ParticipantsPanel from '../../ParticipantsPanel';
import ChatPanel from '../../ChatPanel';

import styles from './MeetingView.module.css';

export type Props = {
  loading?: boolean;
  callId: string;
  isCallActive: boolean;
  logo: string;
};

export type Meeting = {
  call?: any;
  loading?: boolean;
};

export const Meeting: FC<Props & Meeting> = ({
  logo,
  call,
  callId,
  isCallActive,
}) => {
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticpants] = useState(false);

  const participants = useParticipants();

  console.log(participants);

  const toggleChat = useCallback(() => {
    setShowChat(!showChat);
  }, [showChat]);

  const toggleParticipants = useCallback(() => {
    setShowParticpants(!showParticipants);
  }, [showParticipants]);

  return (
    <MeetingLayout
      header={
        <Header logo={logo} callId={callId} isCallActive={isCallActive} />
      }
      sidebar={
        <div className={styles.sidebar}>
          <InvitePanel className={styles.invitePanel} callId={callId} />
          {showParticipants ? (
            <ParticipantsPanel
              className={styles.participantsPanel}
              participants={participants}
            />
          ) : null}
          {showChat ? <ChatPanel className={styles.chatPanel} /> : null}
        </div>
      }
      footer={
        <Footer
          toggleChat={toggleChat}
          toggleParticipants={toggleParticipants}
          call={call}
          isCallActive={isCallActive}
          showParticipants={showParticipants}
          showChat={showChat}
        />
      }
    >
      <Stage call={call} />
    </MeetingLayout>
  );
};

export const MeetingView: FC<Props> = (props) => {
  const activeCall: any = useActiveCall();

  if (!activeCall || !activeCall?.data.call?.callCid) return null; //return <Meeting {...props} loading={true} />;

  return <Meeting call={activeCall} loading={false} {...props} />;
};
