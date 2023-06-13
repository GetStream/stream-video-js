import { FC } from 'react';
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
  const { isChatVisible, isParticipantsVisible } = usePanelContext();
  const { current: currenTourStep } = useTourContext();

  return (
    <div
      className={classnames(styles.sidebar, {
        [styles.chatVisible]: isChatVisible,
        [styles.participantsVisible]: isParticipantsVisible,
      })}
    >
      <InvitePanel
        callId={callId}
        isFocused={currenTourStep === StepNames.Invite}
        fulllHeight
      />

      <ParticipantsPanel
        participants={participants}
        callId={callId}
        fulllHeight
        visible={isParticipantsVisible}
      />

      <ChatPanel
        channelId={callId}
        channelType="videocall"
        client={chatClient}
        fulllHeight
        visible={isChatVisible}
      />

      <PoweredBy className={styles.branding} />
    </div>
  );
};
