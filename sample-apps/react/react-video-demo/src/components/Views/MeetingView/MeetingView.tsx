import { FC, useCallback, useState, useEffect, useMemo } from 'react';
import { StreamChat } from 'stream-chat';
import { getScreenShareStream, SfuModels } from '@stream-io/video-client';

import {
  useCurrentCallStatsReport,
  useStreamVideoClient,
  useIsCallRecordingInProgress,
  useActiveCall,
  useParticipants,
  useLocalParticipant,
  useHasOngoingScreenShare,
  StreamCallProvider,
} from '@stream-io/video-react-bindings';

import { MediaDevicesProvider } from '@stream-io/video-react-sdk';

import Header from '../../Header';
import Footer from '../../Footer';
import Sidebar from '../../Sidebar';
import Meeting from '../../Meeting';

import MeetingLayout from '../../Layout/MeetingLayout';

import { useWatchChannel } from '../../../hooks/useWatchChannel';

import { useTourContext } from '../../../contexts/TourContext';
import { tour } from '../../../../data/tour';

import '@stream-io/video-styling/dist/css/styles.css';

export type Props = {
  loading?: boolean;
  callId: string;
  callType: string;
  isCallActive: boolean;
  logo: string;
  setCallHasEnded(ended: boolean): void;
  chatClient?: StreamChat | null;
};

export type Meeting = {
  call?: any;
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
}) => {
  const [isAwaitingRecordingResponse, setIsAwaitingRecordingResponse] =
    useState(false);

  const [unread, setUnread] = useState<number>(0);

  const cid = `videocall:${callId}`;
  const channelWatched = useWatchChannel({ chatClient, channelId: callId });

  const { current, setSteps } = useTourContext();

  const client = useStreamVideoClient();
  const participants = useParticipants();
  const statsReport = useCurrentCallStatsReport();
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
      await client?.call(callType, callId).startRecording();
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
          current={current}
          chatClient={chatClient}
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
  const activeCall: any = useActiveCall();

  if (!activeCall) return null;

  return (
    <StreamCallProvider call={activeCall}>
      <MediaDevicesProvider enumerate>
        <View call={activeCall} {...props} />
      </MediaDevicesProvider>
    </StreamCallProvider>
  );
};
