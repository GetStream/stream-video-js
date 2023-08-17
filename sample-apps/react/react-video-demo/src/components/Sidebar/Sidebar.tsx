import { StreamChat } from 'stream-chat';
import { StreamVideoParticipant } from '@stream-io/video-react-sdk';
import classnames from 'classnames';

import InvitePanel from '../InvitePanel';
import { ParticipantsPanel } from '../ParticipantsPanel';
import ChatPanel from '../ChatPanel';

import PoweredBy from '../PoweredBy';

import { PANEL_VISIBILITY, usePanelContext } from '../../contexts/PanelContext';
import { StepNames, useTourContext } from '../../contexts/TourContext';

import type { ConnectionError } from 'src/hooks/useChatClient';

import styles from './Sidebar.module.css';

export type SidebarProps = {
  callId: string;
  chatClient?: StreamChat | null;
  participants: StreamVideoParticipant[];
  chatConnectionError?: ConnectionError;
};

export const Sidebar = ({
  chatClient,
  callId,
  chatConnectionError,
  participants,
}: SidebarProps) => {
  const { chatPanelVisibility, participantsPanelVisibility } =
    usePanelContext();
  const { current: currenTourStep } = useTourContext();

  return (
    <div
      className={classnames(styles.sidebar, {
        [styles.chatVisible]: chatPanelVisibility !== PANEL_VISIBILITY.hidden,
        [styles.participantsVisible]:
          participantsPanelVisibility !== PANEL_VISIBILITY.hidden,
      })}
    >
      <InvitePanel
        callId={callId}
        isFocused={currenTourStep === StepNames.Invite}
      />

      <ParticipantsPanel participants={participants} callId={callId} />

      <ChatPanel
        channelId={callId}
        channelType="videocall"
        chatConnectionError={chatConnectionError}
        client={chatClient}
      />

      <PoweredBy className={styles.branding} />
    </div>
  );
};
