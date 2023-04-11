import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import Gleap from 'gleap';
import {
  Call,
  CallingState,
  CallParticipantsList,
  CallStatsButton,
  CancelCallButton,
  CompositeButton,
  defaultSortPreset,
  IconButton,
  LoadingIndicator,
  noopComparator,
  ReactionsButton,
  RecordCallButton,
  ScreenShareButton,
  SpeakingWhileMutedNotification,
  StreamCallProvider,
  ToggleAudioPublishingButton,
  ToggleCameraPublishingButton,
  ToggleParticipantListButton,
  useCallCallingState,
  useStreamVideoClient,
} from '@stream-io/video-react-sdk';
import { InviteLinkButton } from './InviteLinkButton';
import { Lobby } from './Lobby';
import { Button, Stack, Typography } from '@mui/material';
import { StreamChat } from 'stream-chat';

import {
  ChatUI,
  ChatWrapper,
  NewMessageNotification,
  UnreadCountBadge,
} from '.';
import { ActiveCallHeader } from './ActiveCallHeader';
import { DeviceSettingsCaptor } from './DeviceSettingsCaptor';
import { useWatchChannel } from '../hooks';
import { LayoutMap } from './LayoutSelector';
import { Stage } from './Stage';

const contents = {
  'error-join': {
    heading: 'Failed to join the call',
  },
  'error-leave': {
    heading: 'Error when disconnecting',
  },
};

export const MeetingUI = ({
  chatClient,
}: {
  chatClient: StreamChat | null;
}) => {
  const [show, setShow] = useState<
    'lobby' | 'error-join' | 'error-leave' | 'loading' | 'active-call'
  >('lobby');
  const router = useRouter();
  const callId = router.query['callId'] as string;
  const callType = (router.query['type'] as string) || 'default';
  const client = useStreamVideoClient();
  const [activeCall, setActiveCall] = useState<Call>();
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [layout, setLayout] = useState<keyof typeof LayoutMap>('LegacyGrid');

  const showSidebar = showParticipants || showChat;

  // FIXME: could be replaced with "notification.message_new" but users would have to be at least members
  // possible fix with "allow to join" permissions in place (expensive?)
  const channelWatched = useWatchChannel({ chatClient, channelId: callId });

  const toggleParticipantList = useCallback(
    () => setShowParticipants((prev) => !prev),
    [],
  );

  const hideParticipantList = useCallback(() => setShowParticipants(false), []);

  const onJoin = useCallback(async () => {
    if (!client) return;
    setShow('loading');
    try {
      const call = client.call(callType, callId);
      setActiveCall(call);

      await call.join({ create: true });
      setShow('active-call');
    } catch (e) {
      console.error(e);
      setShow('error-join');
    }
  }, [callId, callType, client]);

  const onLeave = useCallback(async () => {
    setShow('loading');
    try {
      await activeCall?.cancel();
      await router.push('/');
    } catch (e) {
      console.error(e);
      setShow('error-leave');
    }
  }, [activeCall, router]);

  useEffect(() => {
    const handlePageLeave = async () => {
      await activeCall?.cancel();
    };
    router.events.on('routeChangeStart', handlePageLeave);
    return () => {
      router.events.off('routeChangeStart', handlePageLeave);
    };
  }, [activeCall, router.events]);

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

  if (show === 'error-join' || show === 'error-leave') {
    return (
      <ErrorPage
        heading={contents[show].heading}
        onClickHome={() => router.push(`/`)}
        onClickLobby={() => setShow('lobby')}
      />
    );
  }
  if (show === 'lobby') return <Lobby onJoin={onJoin} />;

  if (show === 'loading')
    return (
      <StreamCallProvider call={activeCall}>
        <LoadingScreen />;
      </StreamCallProvider>
    );

  if (!activeCall)
    return (
      <ErrorPage
        heading={'Lost active call connection'}
        onClickHome={() => router.push(`/`)}
        onClickLobby={() => setShow('lobby')}
      />
    );

  return (
    <StreamCallProvider call={activeCall}>
      <div className="str-video str-video__call">
        <div className="str-video__call__main">
          <ActiveCallHeader
            selectedLayout={layout}
            onMenuItemClick={setLayout}
          />
          <Stage selectedLayout={layout} />
          <div
            className="str-video__call-controls"
            data-testid="str-video__call-controls"
          >
            <div className="rd-call-controls-group">
              <RecordCallButton call={activeCall} />
              <ScreenShareButton call={activeCall} />
              <ReactionsButton />
            </div>
            <div className="rd-call-controls-group">
              <SpeakingWhileMutedNotification>
                <ToggleAudioPublishingButton />
              </SpeakingWhileMutedNotification>
              <ToggleCameraPublishingButton />
              <CancelCallButton call={activeCall} onClick={onLeave} />
            </div>
            <div className="rd-call-controls-group">
              <CallStatsButton />
              <ToggleParticipantListButton
                enabled={showParticipants}
                onClick={toggleParticipantList}
              />
              <NewMessageNotification
                chatClient={chatClient}
                channelWatched={channelWatched}
                disableOnChatOpen={showChat}
              >
                <div className="str-chat__chat-button__wrapper">
                  <CompositeButton caption="Chat" active={showChat}>
                    <IconButton
                      enabled={showChat}
                      disabled={!chatClient}
                      onClick={() => setShowChat((prev) => !prev)}
                      icon="chat"
                    />
                  </CompositeButton>
                  {!showChat && (
                    <UnreadCountBadge
                      channelWatched={channelWatched}
                      chatClient={chatClient}
                      channelId={callId}
                    />
                  )}
                </div>
              </NewMessageNotification>
            </div>
          </div>
        </div>
        {showSidebar && (
          <div className="str-video__sidebar">
            {showParticipants && (
              <CallParticipantsList
                onClose={hideParticipantList}
                InviteLinkButton={InviteLinkButton}
              />
            )}

            <ChatWrapper chatClient={chatClient}>
              {showChat && (
                <div className="str-video__chat">
                  <ChatUI
                    onClose={() => setShowChat(false)}
                    channelId={callId}
                  />
                </div>
              )}
            </ChatWrapper>
          </div>
        )}
      </div>
      <DeviceSettingsCaptor />
    </StreamCallProvider>
  );
};

type ErrorPageProps = {
  heading: string;
  onClickHome: () => void;
  onClickLobby: () => void;
};

const ErrorPage = ({ heading, onClickHome, onClickLobby }: ErrorPageProps) => (
  <Stack height={1} justifyContent="center" alignItems="center" gap={5}>
    <div>
      <Typography variant="h2" textAlign="center">
        {heading}
      </Typography>
      <Typography variant="subtitle1" textAlign="center">
        (see the console for more info)
      </Typography>
    </div>
    <Stack direction="row" gap={2}>
      <Button
        data-testid="return-home-button"
        variant="contained"
        onClick={onClickHome}
      >
        Return home
      </Button>

      <Button
        data-testid="return-home-button"
        variant="contained"
        onClick={onClickLobby}
      >
        Back to lobby
      </Button>

      <Button
        data-testid="report-issue-button"
        variant="contained"
        color="error"
        onClick={() => {
          Gleap.startFeedbackFlow('bugreporting');
        }}
      >
        Report an issue
      </Button>
    </Stack>
  </Stack>
);

export const LoadingScreen = () => {
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
    <div className=" str-video str-video__call">
      <div className="str-video__call__loading-screen">
        <LoadingIndicator text={message} />
      </div>
    </div>
  );
};
