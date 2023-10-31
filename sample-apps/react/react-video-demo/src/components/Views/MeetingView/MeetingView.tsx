import { useCallback, useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import { v1 as uuid } from 'uuid';

import { Call, useCallStateHooks } from '@stream-io/video-react-sdk';

import Header from '../../Header';
import Footer from '../../Footer';
import Sidebar from '../../Sidebar';
import Meeting from '../../Meeting';
import { Info } from '../../Icons';

import MeetingLayout from '../../Layout/MeetingLayout';
import { LayoutManagerProvider } from '../../Layout/MeetingLayout/MeetingLayoutManager';

import { useWatchChannel } from '../../../hooks/useWatchChannel';

import { useTourContext } from '../../../contexts/TourContext';
import { useNotificationContext } from '../../../contexts/NotificationsContext';

import { tour } from '../../../../data/tour';

import type { ConnectionError } from 'src/hooks/useChatClient';

import '@stream-io/video-styling/dist/css/styles.css';

export type MeetingViewProps = {
  call: Call;
  isCallActive: boolean;
  setCallHasEnded(ended: boolean): void;
  chatClient?: StreamChat | null;
  chatConnectionError?: ConnectionError;
};

export const MeetingView = ({
  call,
  isCallActive,
  setCallHasEnded,
  chatClient,
  chatConnectionError,
}: MeetingViewProps) => {
  const {
    useParticipants,
    useIsCallRecordingInProgress,
    useScreenShareState,
    useHasOngoingScreenShare,
  } = useCallStateHooks();
  const participants = useParticipants();
  const isCallRecordingInProgress = useIsCallRecordingInProgress();
  const [isAwaitingRecordingResponse, setIsAwaitingRecordingResponse] =
    useState(false);

  const [unread, setUnread] = useState<number>(0);

  const cid = `videocall:${call.id}`;
  const channelWatched = useWatchChannel({ chatClient, channelId: call.id });

  const { setSteps } = useTourContext();
  const { addNotification } = useNotificationContext();

  const { screenShare } = useScreenShareState();
  const isScreenSharing = useHasOngoingScreenShare();

  useEffect(() => {
    setSteps(tour);
  }, [setSteps]);

  useEffect(() => {
    if (!chatClient || !channelWatched) return;

    const channel = chatClient.activeChannels[cid];
    const handleEvent = () => {
      const count = channel?.countUnread() ?? 0;
      setUnread(count);
    };

    channel.on('notification.mark_read', handleEvent);
    chatClient.on('message.new', handleEvent);
    chatClient.on('message.updated', handleEvent);
    chatClient.on('message.deleted', handleEvent);

    return () => {
      channel.off('notification.mark_read', handleEvent);
      chatClient.off('message.new', handleEvent);
      chatClient.off('message.updated', handleEvent);
      chatClient.off('message.deleted', handleEvent);
    };
  }, [chatClient, channelWatched, cid]);

  useEffect(() => {
    setIsAwaitingRecordingResponse((isAwaiting) => {
      if (isAwaiting) return false;
      return isAwaiting;
    });
  }, [isCallRecordingInProgress]);

  const leave = useCallback(() => {
    call.leave();
    setCallHasEnded(true);
  }, [call, setCallHasEnded]);

  const handleStartRecording = useCallback(async () => {
    setIsAwaitingRecordingResponse(true);
    if (!isCallRecordingInProgress) {
      try {
        await call.startRecording();
      } catch (error) {
        addNotification({
          id: uuid(),
          message: 'Recording failed to start. Please try again.',
          icon: <Info />,
        });
        setIsAwaitingRecordingResponse(false);
      }
    }
  }, [addNotification, call, isCallRecordingInProgress]);

  const handleStopRecording = useCallback(async () => {
    if (isCallRecordingInProgress) {
      await call.stopRecording();
    }
  }, [call, isCallRecordingInProgress]);

  return (
    <LayoutManagerProvider>
      <MeetingLayout
        callId={call.id}
        chatClient={chatClient}
        chatConnectionError={chatConnectionError}
        header={
          <Header
            callId={call.id}
            isCallActive={isCallActive}
            participants={participants}
          />
        }
        sidebar={
          <Sidebar
            callId={call.id}
            chatClient={chatClient}
            chatConnectionError={chatConnectionError}
            participants={participants}
          />
        }
        footer={
          <Footer
            chatClient={chatClient}
            handleStartRecording={handleStartRecording}
            handleStopRecording={handleStopRecording}
            isAwaitingRecording={isAwaitingRecordingResponse}
            toggleShareScreen={() => screenShare.toggle()}
            call={call}
            isCallActive={isCallActive}
            isScreenSharing={isScreenSharing}
            isRecording={isCallRecordingInProgress}
            leave={leave}
            unreadMessages={unread}
            participantCount={participants.length}
          />
        }
      >
        <Meeting
          isScreenSharing={isScreenSharing}
          participantsAmount={participants.length}
        />
      </MeetingLayout>
    </LayoutManagerProvider>
  );
};
