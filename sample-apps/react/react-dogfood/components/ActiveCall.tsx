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
import { DEFAULT_LAYOUT, getLayoutSettings, LayoutMap } from './LayoutSelector';

import { useWatchChannel, useBreakpoint } from '../hooks';

export type ActiveCallProps = {
  chatClient?: StreamChat | null;
  activeCall: Call;
  onLeave: () => void;
  onJoin: (fastJoin: boolean) => void;
};

export const ActiveCall = (props: ActiveCallProps) => {
  const { chatClient, activeCall, onLeave, onJoin } = props;
  const [showParticipants, setShowParticipants] = useState(false);
  const [showInvitePopup, setShowInvitePopup] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [layout, setLayout] = useState<keyof typeof LayoutMap>(() => {
    const storedLayout = getLayoutSettings()?.selectedLayout;
    if (!storedLayout) return DEFAULT_LAYOUT;

    return Object.hasOwn(LayoutMap, storedLayout)
      ? storedLayout
      : DEFAULT_LAYOUT;
  });

  const { useParticipantCount } = useCallStateHooks();
  const participantCount = useParticipantCount();
  const breakpoint = useBreakpoint();

  useEffect(() => {
    if (
      (layout === 'SpeakerLeft' || layout === 'SpeakerRight') &&
      (breakpoint === 'xs' || breakpoint === 'sm')
    ) {
      setLayout('SpeakerBottom');
    }
  }, [breakpoint, layout]);

  const showSidebar = showParticipants || showChat;

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

  return (
    <div className="rd__call">
      <div className="rd__main-call-panel">
        <ActiveCallHeader
          selectedLayout={layout}
          onMenuItemClick={setLayout}
          onLeave={onLeave}
        />

        <SpeakingWhileMutedNotification>
          <span />
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
                    onClose={() => setShowParticipants(false)}
                  />
                  <InvitePanel callId={activeCall.id} />
                </div>
              )}

              <ChatWrapper chatClient={chatClient}>
                {showChat && (
                  <div className="str-video__chat">
                    <ChatUI
                      onClose={() => setShowChat(false)}
                      channelId={activeCall.id}
                    />
                  </div>
                )}
              </ChatWrapper>
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
                selectedLayout={layout}
                onMenuItemClick={setLayout}
                inMeeting
              />
            </div>
            <div className="str-video__call-controls__desktop">
              <ToggleFeedbackButton />
            </div>
            {process.env.NEXT_PUBLIC_APP_ENVIRONMENT === 'pronto' && (
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

            <ToggleParticipantListButton
              enabled={showParticipants}
              onClick={() => {
                setShowParticipants((prev) => !prev);
                setShowChat(false);
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
                    onClick={() => {
                      setShowChat((prev) => !prev);
                      setShowParticipants(false);
                    }}
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
