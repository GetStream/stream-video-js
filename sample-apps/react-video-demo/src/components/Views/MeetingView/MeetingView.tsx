import { FC, useCallback, useState, useRef, useEffect, useMemo } from 'react';
import classnames from 'classnames';
import { CSSTransition } from 'react-transition-group';
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
} from '@stream-io/video-react-bindings';

import Header from '../../Header';
import Footer from '../../Footer';

import MeetingLayout from '../../Layout/MeetingLayout';

import ScreenShareParticipants from '../../ScreenShareParticipants';
import MeetingParticipants from '../../MeetingParticipants';

import InvitePanel from '../../InvitePanel';
import ParticipantsPanel from '../../ParticipantsPanel';
import ChatPanel from '../../ChatPanel';
import TourPanel from '../../TourPanel';
import Notifications from '../../Notifications';

import { useWatchChannel } from '../../../hooks/useWatchChannel';

import { useTourContext, StepNames } from '../../../contexts/TourContext';
import { tour } from '../../../../data/tour';

import '@stream-io/video-styling/dist/css/styles.css';
import styles from './MeetingView.module.css';

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

export const Meeting: FC<Props & Meeting> = ({
  logo,
  call,
  callId,
  callType,
  isCallActive,
  setCallHasEnded,
  chatClient,
}) => {
  const [showChat, setShowChat] = useState<boolean>(false);
  const [showParticipants, setShowParticpants] = useState<boolean>(true);
  const [isAwaitingRecordingResponse, setIsAwaitingRecordingResponse] =
    useState(false);
  const chatRef = useRef(null);
  const participantsRef = useRef(null);
  const [unread, setUnread] = useState<number>(0);

  const cid = `videocall:${callId}`;
  const channelWatched = useWatchChannel({ chatClient, channelId: callId });

  const { next, current, total, step, setSteps, active, toggleTour } =
    useTourContext();

  const client = useStreamVideoClient();
  const participants = useParticipants();
  const statsReport = useCurrentCallStatsReport();
  const localParticipant = useLocalParticipant();

  const remoteScreenShare = useHasOngoingScreenShare();

  const localScreenShare = localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.SCREEN_SHARE,
  );

  const isScreenSharing = useMemo(() => {
    return remoteScreenShare || localScreenShare;
  }, [remoteScreenShare, localScreenShare]);

  const isCallRecordingInProgress = useIsCallRecordingInProgress();

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

  const toggleChat = useCallback(() => {
    if (showChat === false && chatClient) {
      setUnread(0);
    }

    setShowChat(!showChat);
  }, [showChat, chatClient]);

  const toggleParticipants = useCallback(() => {
    setShowParticpants(!showParticipants);
  }, [showParticipants]);

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
    if (!isCallRecordingInProgress) {
      await client?.startRecording(callId, callType);
    }
  }, [callId, client, isCallRecordingInProgress, callType]);

  const handleStopRecording = useCallback(async () => {
    if (isCallRecordingInProgress) {
      await client?.stopRecording(callId, callType);
    }
  }, [callId, client, isCallRecordingInProgress, callType]);

  const handlePauseRecording = useCallback(async () => {
    if (isCallRecordingInProgress) {
      await client?.stopRecording(callId, callType);
    }
  }, [callId, client, isCallRecordingInProgress, callType]);

  const contentClasses = classnames(styles.content, {
    [styles.activeTour]: active,
  });

  return (
    <MeetingLayout
      header={
        <Header
          logo={logo}
          callId={callId}
          isCallActive={isCallActive}
          participants={participants}
          latency={
            statsReport
              ? statsReport?.publisherStats?.averageRoundTripTimeInMs
              : 0
          }
        />
      }
      sidebar={
        <div className={styles.sidebar}>
          <InvitePanel
            className={styles.invitePanel}
            callId={callId}
            isFocused={current === StepNames.Invite}
          />
          <CSSTransition
            nodeRef={participantsRef}
            in={showParticipants}
            timeout={200}
            classNames={{
              enterActive: styles['animation-enter'],
              enterDone: styles['animation-enter-active'],
              exitActive: styles['animation-exit'],
              exitDone: styles['animation-exit-active'],
            }}
          >
            <div ref={participantsRef}>
              {showParticipants ? (
                <ParticipantsPanel
                  className={styles.participantsPanel}
                  participants={participants}
                />
              ) : null}
            </div>
          </CSSTransition>

          <CSSTransition
            nodeRef={chatRef}
            in={showChat}
            timeout={200}
            classNames={{
              enterActive: styles['animation-enter'],
              enterDone: styles['animation-enter-active'],
              exitActive: styles['animation-exit'],
              exitDone: styles['animation-exit-active'],
            }}
          >
            <div ref={chatRef}>
              {showChat ? (
                <ChatPanel
                  className={styles.chatPanel}
                  isFocused={current === 2}
                  channelId={callId}
                  channelType="videocall"
                  client={chatClient}
                />
              ) : null}
            </div>
          </CSSTransition>
        </div>
      }
      footer={
        <Footer
          toggleChat={toggleChat}
          toggleParticipants={toggleParticipants}
          handleStartRecording={handleStartRecording}
          handleStopRecording={handleStopRecording}
          handlePauseRecording={handlePauseRecording}
          isAwaitingRecording={isAwaitingRecordingResponse}
          toggleShareScreen={toggleShareScreen}
          call={call}
          isCallActive={isCallActive}
          isScreenSharing={isScreenSharing}
          isRecording={isCallRecordingInProgress}
          showParticipants={showParticipants}
          showChat={showChat}
          leave={leave}
          callId={callId}
          unreadMessages={unread}
          participantCount={participants?.length}
        />
      }
    >
      <div className={''}>
        <div className={styles.stage}>
          <Notifications className={styles.notifications} />
          {isScreenSharing ? (
            <ScreenShareParticipants call={call} />
          ) : (
            <MeetingParticipants call={call} />
          )}
        </div>
        {true ? (
          <div className={styles.tour}>
            <TourPanel
              className={styles.tourPanel}
              header={step?.header}
              explanation={step?.explanation}
              next={next}
              current={current}
              total={total}
              close={toggleTour}
            />
          </div>
        ) : null}
      </div>
    </MeetingLayout>
  );
};

export const MeetingView: FC<Props> = (props) => {
  const activeCall: any = useActiveCall();

  if (!activeCall) return null;

  return <Meeting call={activeCall} {...props} />;
};
