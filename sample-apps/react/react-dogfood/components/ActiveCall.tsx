import {
  Call,
  CallingState,
  CallParticipantsList,
  CancelCallConfirmButton,
  CompositeButton,
  Icon,
  OwnCapability,
  PermissionRequests,
  PipLayout,
  ReactionsButton,
  RecordCallConfirmationButton,
  Restricted,
  ScreenShareButton,
  SpeakingWhileMutedNotification,
  useCallStateHooks,
  useI18n,
  WithTooltip,
} from '@stream-io/video-react-sdk';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import { useRouter } from 'next/router';

import { ActiveCallHeader } from './ActiveCallHeader';
import { CallStatsSidebar, ToggleStatsButton } from './CallStatsWrapper';
import { ChatUI } from './ChatUI';
import { ChatWrapper } from './ChatWrapper';
import {
  ClosedCaptions,
  ClosedCaptionsSidebar,
  ToggleClosedCaptionsButton,
} from './ClosedCaptions';
import { IncomingVideoSettingsButton } from './IncomingVideoSettings';
import { InvitePanel, InvitePopup } from './InvitePanel/InvitePanel';
import { NewMessageNotification } from './NewMessageNotification';
import { ToggleSettingsTabModal } from './Settings/SettingsTabModal';
import { Stage } from './Stage';
import { ToggleDeveloperButton } from './ToggleDeveloperButton';
import { ToggleDualCameraButton } from './ToggleDualCameraButton';
import { ToggleDualMicButton } from './ToggleDualMicButton';
import { ToggleEffectsButton } from './ToggleEffectsButton';
import { ToggleFeedbackButton } from './ToggleFeedbackButton';
import { ToggleLayoutButton } from './ToggleLayoutButton';
import { ToggleMoreOptionsListButton } from './ToggleMoreOptionsListButton';
import { ToggleNoiseCancellationButton } from './ToggleNoiseCancellationButton';
import { ToggleParticipantListButton } from './ToggleParticipantListButton';
import { TourPanel } from './TourPanel';
import { UnreadCountBadge } from './UnreadCountBadge';

import {
  useIsDemoEnvironment,
  useIsProntoEnvironment,
  useIsRestrictedEnvironment,
} from '../context/AppEnvironmentContext';
import { useBreakpoint, useLayoutSwitcher, useWatchChannel } from '../hooks';

import { StepNames, useTourContext } from '../context/TourContext';
import { useNotificationSounds } from '../hooks/useNotificationSounds';
import { usePipWindow } from '../hooks/usePipWindow';
import { StagePip } from './StagePip';

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
  const isRestricted = useIsRestrictedEnvironment();

  const [showInvitePopup, setShowInvitePopup] = useState(
    isDemoEnvironment && !isTourActive,
  );
  const [sidebarContent, setSidebarContent] = useState<SidebarContent>(null);
  const showSidebar = sidebarContent != null;
  const showParticipants = sidebarContent === 'participants';
  const showChat = sidebarContent === 'chat';
  const showStats = sidebarContent === 'stats';
  const showClosedCaptions = sidebarContent === 'closed-captions';
  const router = useRouter();
  const chatDisabled =
    router.query['disable_chat'] === 'true' ||
    process.env.NEXT_PUBLIC_DISABLE_CHAT === 'true';

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

  const {
    isSupported: isPipSupported,
    pipWindow,
    createPipPortal,
    open: openPipWindow,
    close: closePipWindow,
  } = usePipWindow('@pronto/pip');
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
            {pipWindow ? (
              createPipPortal(
                <StagePip />,
                <>
                  <PipLayout.Host />
                  <button
                    className="rd__button rd__button--secondary rd__button--large rd__stop-pip"
                    onClick={closePipWindow}
                  >
                    <Icon className="rd__button__icon" icon="close" />
                    Stop Picture-in-Picture
                  </button>
                </>,
              )
            ) : (
              <Stage selectedLayout={layout} />
            )}
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
            {!isRestricted && (
              <div className="str-video__call-controls__desktop">
                <ToggleClosedCaptionsButton />
              </div>
            )}
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
            {isPipSupported && (
              <WithTooltip title={t('Pop out Picture-in-Picture')}>
                <CompositeButton
                  active={!!pipWindow}
                  variant="primary"
                  onClick={pipWindow ? closePipWindow : openPipWindow}
                >
                  <Icon icon="pip" />
                </CompositeButton>
              </WithTooltip>
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
            {!chatDisabled && (
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
                        if (
                          isTourActive &&
                          currentTourStep === StepNames.Chat
                        ) {
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
