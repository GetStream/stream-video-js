import {
  Participant,
  VideoDimension,
} from '@stream-io/video-client/dist/src/gen/video/sfu/models/models';
import { useCallback, useEffect, useRef } from 'react';
import { Call } from '@stream-io/video-client';
import { useParticipantStreams } from '../../hooks/useParticipantStreams';
import { useParticipants } from '../../hooks/useParticipants';
import { useMediaDevices } from '../../contexts/MediaDevicesContext';
import { ParticipantBox } from './ParticipantBox';

export type UserSubscriptions = { [key: string]: VideoDimension };

export const Stage = (props: {
  call: Call;
  participants: Participant[];
  includeSelf: boolean;
  currentUserId: string;
}) => {
  const {
    call,
    participants: initialParticipants,
    includeSelf,
    currentUserId,
  } = props;
  const { userAudioStreams, userVideoStreams } = useParticipantStreams(call);
  const participants = useParticipants(call, initialParticipants);
  const { audioStream: localAudioStream, videoStream: localVideoStream } =
    useMediaDevices();

  useEffect(() => {
    if (localAudioStream && localVideoStream) {
      call.publish(localAudioStream, localVideoStream);
    }
  }, [call, localAudioStream, localVideoStream]);

  const videoElementsByUserId = useRef<{
    [userId: string]: HTMLVideoElement | undefined;
  }>({});
  const updateVideoElementForUserId = useCallback(
    (userId: string, el: HTMLVideoElement | null) => {
      videoElementsByUserId.current[userId] = el!;
    },
    [],
  );

  const gridRef = useRef<HTMLDivElement>(null);
  const requestSubscriptions = useCallback(
    async (overrides?: UserSubscriptions) => {
      const subscriptions: UserSubscriptions = {};
      Object.entries(videoElementsByUserId.current).forEach(
        ([userId, element]) => {
          if (!element) return;
          if (!includeSelf && userId === currentUserId) return;
          const width = element.clientWidth;
          const height = element.clientHeight;
          subscriptions[userId] = {
            width,
            height,
          };
        },
      );

      Object.assign(subscriptions, overrides);

      if (Object.keys(subscriptions).length > 0) {
        call.updateSubscriptions(subscriptions).catch((e: Error) => {
          console.error(`Failed to update subscriptions`, e);
        });
      }
    },
    [call, currentUserId, includeSelf],
  );

  useEffect(() => {
    requestSubscriptions().catch((e) => {
      console.error(e);
    });

    if (!gridRef.current) return;
    const resizeObserver = new ResizeObserver(
      debounce(requestSubscriptions, 1200),
    );
    resizeObserver.observe(gridRef.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, [requestSubscriptions]);

  const grid = `str-video__grid-${participants.length || 1}`;
  return (
    <div className={`str-video__stage ${grid}`} ref={gridRef}>
      {participants.map((participant) => {
        const userId = participant.user!.id;
        const isLocalParticipant = currentUserId === userId;
        const isAutoMuted = isLocalParticipant && !includeSelf;

        const audioStream =
          isLocalParticipant && !includeSelf
            ? localAudioStream
            : userAudioStreams[userId];

        const videoStream =
          isLocalParticipant && !includeSelf
            ? localVideoStream
            : userVideoStreams[userId];

        return (
          <ParticipantBox
            key={`${userId}/${participant.sessionId}`}
            participant={participant}
            isLocalParticipant={isLocalParticipant}
            isMuted={isAutoMuted}
            audioStream={audioStream}
            videoStream={videoStream}
            updateVideoElementForUserId={updateVideoElementForUserId}
            call={call}
            updateSubscriptionsPartial={requestSubscriptions}
          />
        );
      })}
    </div>
  );
};

const debounce = (fn: () => void, timeoutMs: number) => {
  let id: NodeJS.Timeout;
  return () => {
    clearTimeout(id);
    id = setTimeout(fn, timeoutMs);
  };
};
