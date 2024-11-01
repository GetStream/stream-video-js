import clsx from 'clsx';
import { useEffect, useState } from 'react';
import {
  Call,
  CallingState,
  CallParticipantsList,
  CancelCallConfirmButton,
  CompositeButton,
  Icon,
  OwnCapability,
  PermissionRequests,
  ReactionsButton,
  RecordCallConfirmationButton,
  RecordingInProgressNotification,
  Restricted,
  ScreenShareButton,
  SpeakingWhileMutedNotification,
  useCallStateHooks,
  useI18n,
  WithTooltip,
} from '@stream-io/video-react-sdk';
import { StreamChat } from 'stream-chat';

import { ActiveCallHeader } from './ActiveCallHeader';
import { Stage } from './Stage';
import { InvitePanel, InvitePopup } from './InvitePanel/InvitePanel';
import { ChatWrapper } from './ChatWrapper';
import { ChatUI } from './ChatUI';
import { CallStatsSidebar, ToggleStatsButton } from './CallStatsWrapper';
import {
  ClosedCaptions,
  ClosedCaptionsSidebar,
  ToggleClosedCaptionsButton,
} from './ClosedCaptions';
import { ToggleSettingsTabModal } from './Settings/SettingsTabModal';
import { IncomingVideoSettingsButton } from './IncomingVideoSettings';
import { ToggleEffectsButton } from './ToggleEffectsButton';
import { ToggleNoiseCancellationButton } from './ToggleNoiseCancellationButton';
import { ToggleFeedbackButton } from './ToggleFeedbackButton';
import { ToggleDeveloperButton } from './ToggleDeveloperButton';
import { ToggleMoreOptionsListButton } from './ToggleMoreOptionsListButton';
import { ToggleLayoutButton } from './ToggleLayoutButton';
import { ToggleParticipantListButton } from './ToggleParticipantListButton';
import { ToggleDualCameraButton } from './ToggleDualCameraButton';
import { ToggleDualMicButton } from './ToggleDualMicButton';
import { NewMessageNotification } from './NewMessageNotification';
import { UnreadCountBadge } from './UnreadCountBadge';
import { TourPanel } from './TourPanel';

import { useBreakpoint, useLayoutSwitcher, useWatchChannel } from '../hooks';
import {
  useIsDemoEnvironment,
  useIsProntoEnvironment,
} from '../context/AppEnvironmentContext';

import { StepNames, useTourContext } from '../context/TourContext';
import { useNotificationSounds } from '../hooks/useNotificationSounds';

export type ActiveCallProps = {
  chatClient?: StreamChat | null;
  activeCall: Call;
  onLeave: () => void;
  onJoin: ({ fastJoin }: { fastJoin: boolean }) => void;
};

type SidebarContent =
  | 'participants'
  | 'chat'
  | 'stats'
  | 'closed-captions'
  | null;

export const ActiveCall = (props: ActiveCallProps) => {
  const { chatClient, activeCall, onLeave, onJoin } = props;
  const { useParticipantCount } = useCallStateHooks();
  const participantCount = useParticipantCount();
  const {
    current: currentTourStep,
    active: isTourActive,
    next: nextTourStep,
  } = useTourContext();

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
  const isPronto = useIsProntoEnvironment();

  const [showInvitePopup, setShowInvitePopup] = useState(
    isDemoEnvironment && !isTourActive,
  );
  const [sidebarContent, setSidebarContent] = useState<SidebarContent>(null);
  const showSidebar = sidebarContent != null;
  const showParticipants = sidebarContent === 'participants';
  const showChat = sidebarContent === 'chat';
  const showStats = sidebarContent === 'stats';
  const showClosedCaptions = sidebarContent === 'closed-captions';

  // FIXME: could be replaced with "notification.message_new" but users would have to be at least members
  // possible fix with "allow to join" permissions in place (expensive?)
  const channelWatched = useWatchChannel({
    chatClient,
    channelId: activeCall?.id,
  });

  const { t } = useI18n();

  useEffect(() => {
    // helps with Fast-Refresh
    if (activeCall?.state.callingState === CallingState.IDLE) {
      onJoin({ fastJoin: true });
    }
  }, [activeCall, onJoin]);

  useEffect(() => {
    if (currentTourStep === StepNames.Chat) {
      setSidebarContent('chat');
    } else {
      setSidebarContent(null);
    }
  }, [currentTourStep]);

  useEffect(() => {
    if (isDemoEnvironment && !isTourActive) {
      setShowInvitePopup(true);
    }
  }, [isDemoEnvironment, isTourActive]);

  useNotificationSounds();

  return (
    <div className="rd__call">
      {isDemoEnvironment && <TourPanel highlightClass="rd__highlight" />}
      <div className="rd__main-call-panel">
        <ActiveCallHeader
          selectedLayout={layout}
          onMenuItemClick={setLayout}
          onLeave={onLeave}
        />

        <PermissionRequests />
        <div className="rd__layout">
          <div className="rd__layout__stage-container">
            <Stage selectedLayout={layout} />
            {showInvitePopup && participantCount === 1 && (
              <InvitePopup
                callId={activeCall.id}
                close={() => setShowInvitePopup(false)}
              />
            )}
            {isPronto && <ClosedCaptions />}
          </div>

          <div
            className={clsx('rd__sidebar', showSidebar && 'rd__sidebar--open')}
          >
            {showSidebar && (
              <div className="rd__sidebar__container">
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
                        onClose={() => {
                          if (
                            isTourActive &&
                            currentTourStep === StepNames.Chat
                          ) {
                            nextTourStep();
                          }
                          setSidebarContent(null);
                        }}
                        channelId={activeCall.id}
                      />
                    </div>
                  </ChatWrapper>
                )}

                {showStats && <CallStatsSidebar />}
                {isPronto && showClosedCaptions && <ClosedCaptionsSidebar />}
              </div>
            )}
          </div>
        </div>
        <div className="rd__notifications">
          <RecordingInProgressNotification />
          <Restricted
            requiredGrants={[OwnCapability.SEND_AUDIO]}
            hasPermissionsOnly
          >
            <SpeakingWhileMutedNotification />
          </Restricted>
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
            <div className="str-video__call-controls__desktop">
              <ToggleLayoutButton
                selectedLayout={layout}
                onMenuItemClick={setLayout}
              />
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
            <ToggleDualMicButton />
            <ToggleDualCameraButton />
            <div className="str-video__call-controls__desktop">
              <ToggleEffectsButton />
            </div>
            <div className="str-video__call-controls__desktop">
              <ToggleNoiseCancellationButton />
            </div>
            <div className="str-video__call-controls__desktop">
              <ToggleClosedCaptionsButton />
            </div>
            <div className="str-video__call-controls__desktop">
              <ReactionsButton />
            </div>
            <div className="str-video__call-controls__desktop">
              <ScreenShareButton />
            </div>
            {isPronto && (
              <div className="str-video__call-controls__desktop">
                <IncomingVideoSettingsButton />
              </div>
            )}
            <RecordCallConfirmationButton />
            <div className="str-video__call-controls__desktop">
              <CancelCallConfirmButton onLeave={onLeave} />
            </div>
          </div>
          <div className="str-video__call-controls--group str-video__call-controls--sidebar">
            {isPronto && (
              <div className="str-video__call-controls__desktop">
                <WithTooltip title={t('Closed Captions Queue')}>
                  <CompositeButton
                    active={showClosedCaptions}
                    variant="primary"
                    onClick={() => {
                      setSidebarContent(
                        showClosedCaptions ? null : 'closed-captions',
                      );
                    }}
                  >
                    <Icon icon="closed-captions" />
                  </CompositeButton>
                </WithTooltip>
              </div>
            )}
            <div className="str-video__call-controls__desktop">
              <ToggleStatsButton
                active={showStats}
                onClick={() => setSidebarContent(showStats ? null : 'stats')}
              />
            </div>
            <ToggleParticipantListButton
              active={showParticipants}
              caption=""
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
                <WithTooltip title={t('Chat')}>
                  <CompositeButton
                    active={showChat}
                    disabled={!chatClient}
                    onClick={() => {
                      if (isTourActive && currentTourStep === StepNames.Chat) {
                        nextTourStep();
                      }
                      setSidebarContent(showChat ? null : 'chat');
                    }}
                  >
                    <Icon icon="chat" />
                  </CompositeButton>
                </WithTooltip>
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
