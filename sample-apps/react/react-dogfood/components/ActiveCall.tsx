import { useEffect, useState } from 'react';
import {
  Call,
  CallingState,
  CallParticipantsList,
  CancelCallConfirmButton,
  CompositeButton,
  IconButton,
  PermissionRequests,
  ReactionsButton,
  RecordCallButton,
  ScreenShareButton,
  SpeakingWhileMutedNotification,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { StreamChat } from 'stream-chat';

import { ActiveCallHeader } from './ActiveCallHeader';
import { Stage } from './Stage';
import { InvitePanel, InvitePopup } from './InvitePanel/InvitePanel';
import { ChatWrapper } from './ChatWrapper';
import { ChatUI } from './ChatUI';
import { CallStatsSidebar, ToggleStatsButton } from './CallStatsWrapper';
import { ToggleSettingsTabModal } from './Settings/SettingsTabModal';
import { ToggleFeedbackButton } from './ToggleFeedbackButton';
import { ToggleDeveloperButton } from './ToggleDeveloperButton';
import { ToggleMoreOptionsListButton } from './ToggleMoreOptionsListButton';
import { ToggleLayoutButton } from './ToggleLayoutButton';
import { ToggleParticipantListButton } from './ToggleParticipantListButton';
import { ToggleDualCameraButton } from './ToggleDualCameraButton';
import { ToggleDualMicButton } from './ToggleDualMicButton';
import { NewMessageNotification } from './NewMessageNotification';
import { UnreadCountBadge } from './UnreadCountBadge';

import { useBreakpoint, useLayoutSwitcher, useWatchChannel } from '../hooks';
import {
  useIsDemoEnvironment,
  useIsProntoEnvironment,
} from '../context/AppEnvironmentContext';

export type ActiveCallProps = {
  chatClient?: StreamChat | null;
  activeCall: Call;
  onLeave: () => void;
  onJoin: (fastJoin: boolean) => void;
};

type SidebarContent = 'participants' | 'chat' | 'stats' | null;

export const ActiveCall = (props: ActiveCallProps) => {
  const { chatClient, activeCall, onLeave, onJoin } = props;
  const { useParticipantCount } = useCallStateHooks();
  const participantCount = useParticipantCount();

  const { layout, setLayout } = useLayoutSwitcher();
  const breakpoint = useBreakpoint();
  useEffect(() => {
    if (
      (layout === 'SpeakerLeft' || layout === 'SpeakerRight') &&
      (breakpoint === 'xs' || breakpoint === 'sm')
    ) {
      setLayout('SpeakerBottom');
    }
  }, [breakpoint, layout, setLayout]);

  const isDemoEnvironment = useIsDemoEnvironment();
  const [showInvitePopup, setShowInvitePopup] = useState(isDemoEnvironment);
  const [sidebarContent, setSidebarContent] = useState<SidebarContent>(null);
  const showSidebar = sidebarContent != null;
  const showParticipants = sidebarContent === 'participants';
  const showChat = sidebarContent === 'chat';
  const showStats = sidebarContent === 'stats';

  // FIXME: could be replaced with "notification.message_new" but users would have to be at least members
  // possible fix with "allow to join" permissions in place (expensive?)
  const channelWatched = useWatchChannel({
    chatClient,
    channelId: activeCall?.id,
  });

  useEffect(() => {
    // helps with Fast-Refresh
    if (activeCall?.state.callingState === CallingState.IDLE) {
      onJoin(true);
    }
  }, [activeCall, onJoin]);

  const isPronto = useIsProntoEnvironment();

  return (
    <div className="rd__call">
      <div className="rd__main-call-panel">
        <ActiveCallHeader
          selectedLayout={layout}
          onMenuItemClick={setLayout}
          onLeave={onLeave}
        />

        <SpeakingWhileMutedNotification>
          <span className="rd__speaking-while-muted-notification" />
        </SpeakingWhileMutedNotification>

        <PermissionRequests />
        <div className="rd__layout">
          <Stage selectedLayout={layout} />
          {showInvitePopup && participantCount === 1 && (
            <InvitePopup
              callId={activeCall.id}
              close={() => setShowInvitePopup(false)}
            />
          )}
          {showSidebar && (
            <div className="rd__sidebar">
              {showParticipants && (
                <div className="rd__participants">
                  <CallParticipantsList
                    onClose={() => setSidebarContent(null)}
                  />
                  <InvitePanel />
                </div>
              )}

              {showChat && (
                <ChatWrapper chatClient={chatClient}>
                  <div className="str-video__chat">
                    <ChatUI
                      onClose={() => setSidebarContent(null)}
                      channelId={activeCall.id}
                    />
                  </div>
                </ChatWrapper>
              )}

              {showStats && <CallStatsSidebar />}
            </div>
          )}
        </div>
        <div
          className="str-video__call-controls"
          data-testid="str-video__call-controls"
        >
          <div className="str-video__call-controls--group str-video__call-controls--options">
            <div className="str-video__call-controls__desktop">
              <ToggleSettingsTabModal
                layoutProps={{
                  selectedLayout: layout,
                  onMenuItemClick: setLayout,
                }}
                tabModalProps={{
                  inMeeting: true,
                }}
              />
            </div>
            <div className="str-video__call-controls__desktop">
              <ToggleFeedbackButton />
            </div>
            {isPronto && (
              <div className="str-video__call-controls__desktop">
                <ToggleDeveloperButton />
              </div>
            )}
            <div className="str-video__call-controls__mobile">
              <ToggleMoreOptionsListButton />
            </div>
          </div>
          <div className="str-video__call-controls--group str-video__call-controls--media">
            <RecordCallButton />

            <div className="str-video__call-controls__desktop">
              <ScreenShareButton />
            </div>
            <div className="str-video__call-controls__desktop">
              <ReactionsButton />
            </div>

            <ToggleDualMicButton />
            <ToggleDualCameraButton />
            <div className="str-video__call-controls__desktop">
              <CancelCallConfirmButton onLeave={onLeave} />
            </div>
          </div>
          <div className="str-video__call-controls--group str-video__call-controls--sidebar">
            <ToggleLayoutButton
              selectedLayout={layout}
              onMenuItemClick={setLayout}
            />

            {isPronto && (
              <div className="str-video__call-controls__desktop">
                <ToggleStatsButton
                  active={showStats}
                  onClick={() => setSidebarContent(showStats ? null : 'stats')}
                />
              </div>
            )}

            <ToggleParticipantListButton
              enabled={showParticipants}
              onClick={() => {
                setSidebarContent(showParticipants ? null : 'participants');
              }}
            />
            <NewMessageNotification
              chatClient={chatClient}
              channelWatched={channelWatched}
              disableOnChatOpen={showChat}
            >
              <div className="str-chat__chat-button__wrapper">
                <CompositeButton active={showChat}>
                  <IconButton
                    enabled={showChat}
                    disabled={!chatClient}
                    title="Chat"
                    onClick={() => setSidebarContent(showChat ? null : 'chat')}
                    icon="chat"
                  />
                </CompositeButton>
                {!showChat && (
                  <UnreadCountBadge
                    channelWatched={channelWatched}
                    chatClient={chatClient}
                    channelId={activeCall.id}
                  />
                )}
              </div>
            </NewMessageNotification>
          </div>
        </div>
      </div>
    </div>
  );
};
