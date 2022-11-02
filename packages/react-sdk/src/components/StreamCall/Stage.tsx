import { Participant } from '@stream-io/video-client/dist/src/gen/video/sfu/models/models';
import { useCallback, useEffect, useRef } from 'react';
import {
  Call,
  StreamVideoParticipant,
  VideoDimensionChange,
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
    (participant: StreamVideoParticipant, width: number, height: number) => {
      call.updateVideoDimensions([
        {
          participant,
          videoDimension: {
            width,
            height,
          },
        },
      ]);
    },
    [call],
  );

  const videoElementsByParticipant = useRef<
    {
      participant: Participant;
      videoElement: HTMLVideoElement | null;
    }[]
  >([]);

  const updateVideoSubscriptionForAllParticipantsDebounced = useCallback(
    debounce(() => {
      const changes: VideoDimensionChange[] = [];
      videoElementsByParticipant.current.forEach(
        (videoElementByParticpiant) => {
          if (videoElementByParticpiant.videoElement) {
            const width = videoElementByParticpiant.videoElement.clientWidth;
            const height = videoElementByParticpiant.videoElement.clientHeight;
            changes.push({
              participant: videoElementByParticpiant.participant,
              videoDimension: { width, height },
            });
          }
        },
      );

      call.updateVideoDimensions(changes, includeSelf);
    }, 1200),
    [call, includeSelf],
  );

  const updateVideoElementForParticipant = useCallback(
    (participant: Participant, el: HTMLVideoElement | null) => {
      const videoElementByParticpiant = videoElementsByParticipant.current.find(
        (item) =>
          item.participant.user?.id === participant.user?.id &&
          item.participant.sessionId === participant.sessionId,
      );
      if (!videoElementByParticpiant) {
        videoElementsByParticipant.current.push({
          participant,
          videoElement: el,
        });
        updateVideoSubscriptionForAllParticipantsDebounced();
      } else {
        videoElementByParticpiant.videoElement = el;
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
