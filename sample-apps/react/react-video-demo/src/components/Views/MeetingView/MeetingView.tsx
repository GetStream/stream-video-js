import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { StreamChat } from 'stream-chat';
import { v1 as uuid } from 'uuid';

import {
  Call,
  getScreenShareStream,
  SfuModels,
  useCallStateHooks,
  useStreamVideoClient,
} from '@stream-io/video-react-sdk';

import Header from '../../Header';
import Footer from '../../Footer';
import Sidebar from '../../Sidebar';
import Meeting from '../../Meeting';
import { Info } from '../../Icons';

import MeetingLayout from '../../Layout/MeetingLayout';

import { useWatchChannel } from '../../../hooks/useWatchChannel';

import { useTourContext } from '../../../contexts/TourContext';
import { usePanelContext } from '../../../contexts/PanelContext';
import { useNotificationContext } from '../../../contexts/NotificationsContext';

import { tour } from '../../../../data/tour';

import type { ConnectionError } from 'src/hooks/useChatClient';

import '@stream-io/video-styling/dist/css/styles.css';

export type Props = {
  loading?: boolean;
  call: Call;
  callId: string;
  callType: string;
  isCallActive: boolean;
  logo: string;
  setCallHasEnded(ended: boolean): void;
  chatClient?: StreamChat | null;
  chatConnectionError?: ConnectionError;
};

export type Meeting = {
  call?: Call;
  loading?: boolean;
};

export const View: FC<Props & Meeting> = ({
  logo,
  call,
  callId,
  callType,
  isCallActive,
  setCallHasEnded,
  chatClient,
  chatConnectionError,
}) => {
  const [isAwaitingRecordingResponse, setIsAwaitingRecordingResponse] =
    useState(false);

  const [unread, setUnread] = useState<number>(0);

  const cid = `videocall:${callId}`;
  const channelWatched = useWatchChannel({ chatClient, channelId: callId });

  const { setSteps } = useTourContext();
  const { isChatVisible } = usePanelContext();
  const { addNotification } = useNotificationContext();

  const client = useStreamVideoClient();
  const {
    useCallStatsReport,
    useLocalParticipant,
    useParticipants,
    useIsCallRecordingInProgress,
    useHasOngoingScreenShare,
  } = useCallStateHooks();
  const participants = useParticipants();
  const statsReport = useCallStatsReport();
  const localParticipant = useLocalParticipant();
  const isCallRecordingInProgress = useIsCallRecordingInProgress();

  const remoteScreenShare = useHasOngoingScreenShare();

  const localScreenShare = localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.SCREEN_SHARE,
  );

  const isScreenSharing = useMemo(() => {
    return remoteScreenShare || localScreenShare;
  }, [remoteScreenShare, localScreenShare]);

  useEffect(() => {
    setSteps(tour);
  }, []);

  useEffect(() => {
    if (!chatClient || !channelWatched) return;

    const handleEvent = () => {
      const channel = chatClient.activeChannels[cid];

      setUnread(channel?.countUnread() ?? 0);
    };

    handleEvent();

    chatClient.on('message.new', handleEvent);
    chatClient.on('message.updated', handleEvent);
    chatClient.on('message.deleted', handleEvent);

    return () => {
      chatClient.off('message.new', handleEvent);
      chatClient.off('message.updated', handleEvent);
      chatClient.off('message.deleted', handleEvent);
    };
  }, [chatClient, channelWatched, cid]);

  useEffect(() => {
    if (!chatClient || !channelWatched) return;

    if (isChatVisible && unread !== 0) {
      setUnread(0);
    }
  }, [chatClient, channelWatched, cid, isChatVisible, unread]);

  useEffect(() => {
    setIsAwaitingRecordingResponse((isAwaiting) => {
      if (isAwaiting) return false;
      return isAwaiting;
    });
  }, [isCallRecordingInProgress]);

  const leave = useCallback(() => {
    call.leave();
    setCallHasEnded(true);
  }, []);

  const toggleShareScreen = useCallback(async () => {
    if (!isScreenSharing) {
      const stream = await getScreenShareStream().catch((e) => {
        console.log(`Can't share screen: ${e}`);
      });
      if (stream) {
        await call.publishScreenShareStream(stream);
      }
    } else {
      await call.stopPublish(SfuModels.TrackType.SCREEN_SHARE);
    }
  }, [isScreenSharing, call]);

  const handleStartRecording = useCallback(async () => {
    setIsAwaitingRecordingResponse(true);
    if (!isCallRecordingInProgress) {
      try {
        await client?.call(callType, callId).startRecording();
      } catch (error) {
        addNotification({
          id: uuid(),
          message: 'Recording failed to start. Please try again.',
          icon: <Info />,
        });
        setIsAwaitingRecordingResponse(false);
      }
    }
  }, [callId, client, isCallRecordingInProgress, callType, call]);

  const handleStopRecording = useCallback(async () => {
    if (isCallRecordingInProgress) {
      await client?.call(callType, callId).stopRecording();
    }
  }, [callId, client, isCallRecordingInProgress, callType]);

  return (
    <MeetingLayout
      callId={callId}
      chatClient={chatClient}
      chatConnectionError={chatConnectionError}
      header={
        <Header
          logo={logo}
          callId={callId}
          isCallActive={isCallActive}
          participants={participants}
          participantCount={participants?.length}
          latency={
            statsReport
              ? statsReport?.publisherStats?.averageRoundTripTimeInMs
              : 0
          }
        />
      }
      sidebar={
        <Sidebar
          callId={callId}
          chatClient={chatClient}
          chatConnectionError={chatConnectionError}
          participants={participants}
        />
      }
      footer={
        <Footer
          handleStartRecording={handleStartRecording}
          handleStopRecording={handleStopRecording}
          isAwaitingRecording={isAwaitingRecordingResponse}
          toggleShareScreen={toggleShareScreen}
          call={call}
          isCallActive={isCallActive}
          isScreenSharing={isScreenSharing}
          isRecording={isCallRecordingInProgress}
          leave={leave}
          callId={callId}
          unreadMessages={unread}
          participantCount={participants?.length}
        />
      }
    >
      <Meeting
        isScreenSharing={isScreenSharing}
        call={call}
        callId={callId}
        participantsAmount={participants?.length}
        participants={participants}
      />
    </MeetingLayout>
  );
};

export const MeetingView: FC<Props> = (props) => {
  const { call: activeCall, ...rest } = props;
  return <View call={activeCall} {...rest} />;
};
