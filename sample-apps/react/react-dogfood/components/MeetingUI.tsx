import { useRouter } from 'next/router';
import { JSX, useCallback, useEffect, useState } from 'react';
import Gleap from 'gleap';
import {
  CallingState,
  CallParticipantsList,
  CancelCallConfirmButton,
  CompositeButton,
  defaultSortPreset,
  IconButton,
  LoadingIndicator,
  noopComparator,
  PermissionRequests,
  ReactionsButton,
  RecordCallButton,
  ScreenShareButton,
  SpeakingWhileMutedNotification,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
  useCall,
  useCallStateHooks,
  usePersistedDevicePreferences,
} from '@stream-io/video-react-sdk';

import { ToggleSettingsTabModal } from './Settings/SettingsTabModal';
import { InvitePanel } from './InvitePanel/InvitePanel';

import { Lobby } from './Lobby';
import { Box, Button, Stack, Typography } from '@mui/material';
import { StreamChat } from 'stream-chat';

import {
  ChatUI,
  ChatWrapper,
  NewMessageNotification,
  UnreadCountBadge,
} from '.';
import { ActiveCallHeader } from './ActiveCallHeader';
import { useKeyboardShortcuts, useWakeLock, useWatchChannel } from '../hooks';
import { DEFAULT_LAYOUT, getLayoutSettings, LayoutMap } from './LayoutSelector';
import { Stage } from './Stage';

import { ToggleParticipantListButton } from './ToggleParticipantListButton';
import { ToggleDeveloperButton } from './ToggleDeveloperButton';
import { ToggleFeedbackButton } from './ToggleFeedbackButton';
import { ToggleMoreOptionsListButton } from './ToggleMoreOptionsListButton';

const contents = {
  'error-join': {
    heading: 'Failed to join the call',
  },
  'error-leave': {
    heading: 'Error when disconnecting',
  },
};

type MeetingUIProps = {
  chatClient?: StreamChat | null;
  enablePreview?: boolean;
};
export const MeetingUI = ({ chatClient, enablePreview }: MeetingUIProps) => {
  const [show, setShow] = useState<
    'lobby' | 'error-join' | 'error-leave' | 'loading' | 'active-call'
  >('lobby');
  const [lastError, setLastError] = useState<Error>();
  const router = useRouter();
  const activeCall = useCall();
  const { useCallCallingState } = useCallStateHooks();
  const callState = useCallCallingState();
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [layout, setLayout] = useState<keyof typeof LayoutMap>(() => {
    const storedLayout = getLayoutSettings()?.selectedLayout;

    if (!storedLayout) return DEFAULT_LAYOUT;

    return Object.hasOwn(LayoutMap, storedLayout)
      ? storedLayout
      : DEFAULT_LAYOUT;
  });

  const showSidebar = showParticipants || showChat;

  // FIXME: could be replaced with "notification.message_new" but users would have to be at least members
  // possible fix with "allow to join" permissions in place (expensive?)
  const channelWatched = useWatchChannel({
    chatClient,
    channelId: activeCall?.id,
  });

  const onJoin = useCallback(async () => {
    setShow('loading');
    try {
      const preferredCodec = router.query['video_codec'];
      if (typeof preferredCodec === 'string') {
        activeCall?.camera.setPreferredCodec(preferredCodec);
      }
      await activeCall?.join({ create: true });
      setShow('active-call');
    } catch (e) {
      console.error(e);
      setLastError(e as Error);
      setShow('error-join');
    }
  }, [activeCall, router]);

  const onLeave = useCallback(async () => {
    setShow('loading');
    try {
      await router.push(`/leave/${activeCall?.id}`);
    } catch (e) {
      console.error(e);
      setLastError(e as Error);
      setShow('error-leave');
    }
  }, [router, activeCall?.id]);

  useEffect(() => {
    if (callState === CallingState.LEFT) {
      void onLeave();
    }
  }, [callState, onLeave]);

  useEffect(() => {
    const handlePageLeave = async () => {
      if (
        activeCall &&
        [CallingState.JOINING, CallingState.JOINED].includes(callState)
      ) {
        await activeCall.leave();
      }
    };
    router.events.on('routeChangeStart', handlePageLeave);
    return () => {
      router.events.off('routeChangeStart', handlePageLeave);
    };
  }, [activeCall, callState, router.events]);

  const isSortingDisabled = router.query['enableSorting'] === 'false';
  useEffect(() => {
    if (!activeCall) return;
    // enable sorting via query param feature flag is provided
    if (isSortingDisabled) {
      activeCall.setSortParticipantsBy(noopComparator());
    } else {
      activeCall.setSortParticipantsBy(defaultSortPreset);
    }
  }, [activeCall, isSortingDisabled]);

  useKeyboardShortcuts();
  useWakeLock();
  usePersistedDevicePreferences('@pronto/device-preferences');

  let ComponentToRender: JSX.Element;
  if (show === 'error-join' || show === 'error-leave') {
    ComponentToRender = (
      <ErrorPage
        heading={contents[show].heading}
        error={lastError}
        onClickHome={() => router.push(`/`)}
        onClickLobby={() => setShow('lobby')}
      />
    );
  } else if (show === 'lobby') {
    ComponentToRender = (
      <Lobby
        onJoin={onJoin}
        callId={activeCall?.id}
        enablePreview={enablePreview}
      />
    );
  } else if (show === 'loading') {
    ComponentToRender = <LoadingScreen />;
  } else if (!activeCall) {
    ComponentToRender = (
      <ErrorPage
        heading={'Lost active call connection'}
        onClickHome={() => router.push(`/`)}
        onClickLobby={() => setShow('lobby')}
      />
    );
  } else {
    ComponentToRender = (
      <div className="rd__call">
        <div className="rd__main-call-panel">
          <ActiveCallHeader
            selectedLayout={layout}
            onMenuItemClick={setLayout}
            onLeave={onLeave}
          />
          <PermissionRequests />
          <div className="rd__layout">
            <Stage selectedLayout={layout} />
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
              <ToggleSettingsTabModal
                selectedLayout={layout}
                onMenuItemClick={setLayout}
                inMeeting
              />
              <ToggleFeedbackButton />
              <ToggleDeveloperButton />
              <ToggleMoreOptionsListButton />
            </div>
            <div className="str-video__call-controls--group str-video__call-controls--media">
              <RecordCallButton />

              <ScreenShareButton />
              <ReactionsButton />
              <SpeakingWhileMutedNotification>
                <ToggleAudioPublishingButton />
              </SpeakingWhileMutedNotification>
              <ToggleVideoPublishingButton />
              <CancelCallConfirmButton onLeave={onLeave} />
            </div>
            <div className="str-video__call-controls--group str-video__call-controls--sidebar">
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
  }

  return ComponentToRender;
};

type ErrorPageProps = {
  heading: string;
  error?: Error;
  onClickHome: () => void;
  onClickLobby: () => void;
};

const ErrorPage = ({
  heading,
  onClickHome,
  onClickLobby,
  error,
}: ErrorPageProps) => (
  <div className="rd__error">
    <div>
      <h1 className="rd__error__header">{heading}</h1>
      <div className="rd__error__content">
        {error?.stack && (
          <div className="rd__error__message">
            <pre>{error.stack}</pre>
          </div>
        )}
        <p>(see the console for more info)</p>
      </div>
    </div>
    <div className="rd__error___actions">
      <button
        data-testid="return-home-button"
        className="rd__button rd__button--primary"
        onClick={onClickHome}
      >
        Return home
      </button>

      <button
        data-testid="return-home-button"
        className="rd__button rd__button--secondary"
        onClick={onClickLobby}
      >
        Back to lobby
      </button>

      <button
        data-testid="report-issue-button"
        className="rd__button"
        onClick={() => {
          Gleap.startFeedbackFlow('bugreporting');
        }}
      >
        Report an issue
      </button>
    </div>
  </div>
);

export const LoadingScreen = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (callingState === CallingState.RECONNECTING) {
      setMessage('Please wait, we are connecting you to the call...');
    } else if (callingState === CallingState.JOINED) {
      setMessage('');
    }
  }, [callingState]);
  return (
    <div className="str-video__call">
      <div className="str-video__call__loading-screen">
        <LoadingIndicator text={message} />
      </div>
    </div>
  );
};
