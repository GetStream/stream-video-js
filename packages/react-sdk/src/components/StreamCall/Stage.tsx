import { Participant } from '@stream-io/video-client/dist/src/gen/video/sfu/models/models';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Call,
  SubscriptionChanges,
} from '@stream-io/video-client';
import { useParticipants } from '../../hooks/useParticipants';
import { useMediaDevices } from '../../contexts/MediaDevicesContext';
import { ParticipantBox } from './ParticipantBox';

export const Stage = (props: {
  call: Call;
  participants: Participant[];
  includeSelf: boolean;
}) => {
  const { call, includeSelf } = props;
  const participants = useParticipants();

  const updateVideoSubscriptionForParticipant = useCallback(
    (sessionId: string, width: number, height: number) => {
      call.updateSubscriptionsPartial({
        [sessionId]: {
          videoDimension: {
            width,
            height,
          },
        },
      });
    },
    [call],
  );

  const videoElementsByParticipant = useRef<{
    [sesionId: string]: HTMLVideoElement | null;
  }>({});

  const updateVideoSubscriptionForAllParticipantsDebounced = useMemo(() => {
    return debounce(() => {
      const changes: SubscriptionChanges = {};
      Object.keys(videoElementsByParticipant.current).forEach(
        (sessionId) => {
          const videoElement = videoElementsByParticipant.current[sessionId];
          if (videoElement) {
            const width = videoElement.clientWidth;
            const height = videoElement.clientHeight;
            changes[sessionId] = {
              videoDimension: { width, height },
            }
        },
      );

      call.updateSubscriptionsPartial(changes, includeSelf);
    }, 1200);
  }, [call, includeSelf]);

  const updateVideoElementForParticipant = useCallback(
    (sessionId: string, el: HTMLVideoElement | null) => {
      const isNewParticipant = !videoElementsByParticipant.current[sessionId];
      videoElementsByParticipant.current[sessionId] = el;
      if (isNewParticipant) {
        updateVideoSubscriptionForAllParticipantsDebounced();
      }

    },
    [updateVideoSubscriptionForAllParticipantsDebounced],
  );

  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gridRef.current || !updateVideoSubscriptionForAllParticipantsDebounced)
      return;

    const resizeObserver = new ResizeObserver(
      updateVideoSubscriptionForAllParticipantsDebounced,
    );
    resizeObserver.observe(gridRef.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, [updateVideoSubscriptionForAllParticipantsDebounced]);

  const { audioStream: localAudioStream, videoStream: localVideoStream } =
    useMediaDevices();

  useEffect(() => {
    if (localAudioStream && localVideoStream) {
      call.publish(localAudioStream, localVideoStream);
    }
  }, [call, localAudioStream, localVideoStream]);

  const grid = `str-video__grid-${participants.length || 1}`;
  return (
    <div className={`str-video__stage ${grid}`} ref={gridRef}>
      {participants.map((participant) => {
        const userId = participant.user!.id;
        const isLocalParticipant = participant.isLoggedInUser;
        const isAutoMuted = isLocalParticipant && !includeSelf;
        return (
          <ParticipantBox
            key={`${userId}/${participant.sessionId}`}
            participant={participant}
            isMuted={isAutoMuted}
            call={call}
            updateVideoSubscriptionForParticipant={
              updateVideoSubscriptionForParticipant
            }
            updateVideoElementForParticipant={updateVideoElementForParticipant}
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
