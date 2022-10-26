import clsx from 'clsx';
import {
  Participant,
  VideoDimension,
} from '@stream-io/video-client/dist/src/gen/video/sfu/models/models';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Call } from '@stream-io/video-client';
import { useParticipantStreams } from '../../hooks/useParticipantStreams';
import { useParticipants } from '../../hooks/useParticipants';
import { useMediaDevices } from '../../contexts/MediaDevicesContext';
import { useIsDebugMode } from '../../hooks/useIsDebugMode';
import { SfuEvent } from '@stream-io/video-client/dist/src/gen/video/sfu/event/events';

type UserSubscriptions = { [key: string]: VideoDimension };

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

const ParticipantBox = (props: {
  participant: Participant;
  isLocalParticipant: boolean;
  isMuted?: boolean;
  audioStream?: MediaStream;
  videoStream?: MediaStream;
  updateVideoElementForUserId: (
    userId: string,
    element: HTMLVideoElement | null,
  ) => void;
  call: Call;
  updateSubscriptionsPartial?: (
    partialSubscriptions: UserSubscriptions,
  ) => Promise<void>;
}) => {
  const {
    audioStream,
    videoStream,
    participant,
    isLocalParticipant,
    isMuted = false,
    updateVideoElementForUserId,
    call,
    updateSubscriptionsPartial,
  } = props;
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const userId = participant.user!.id;
    updateVideoElementForUserId(userId, videoRef.current);
    return () => {
      updateVideoElementForUserId(userId, null);
    };
  }, [participant.user, updateVideoElementForUserId]);

  useEffect(() => {
    const $el = videoRef.current;
    console.log(`Attaching video stream`, $el, videoStream);
    if (!$el) return;
    if (videoStream) {
      $el.srcObject = videoStream;
    }
    return () => {
      $el.srcObject = null;
    };
  }, [videoStream]);

  useEffect(() => {
    const $el = audioRef.current;
    console.log(`Attaching audio stream`, $el, audioStream);
    if (!$el) return;
    if (audioStream) {
      $el.srcObject = audioStream;
    }
    return () => {
      $el.srcObject = null;
    };
  }, [audioStream]);

  const isDebugMode = useIsDebugMode();
  return (
    <div className="str-video__participant">
      <audio autoPlay ref={audioRef} muted={isMuted} />
      <video
        className={clsx(
          'str-video__remote-video',
          isLocalParticipant && 'mirror',
        )}
        muted={isMuted}
        autoPlay
        ref={videoRef}
      />
      <div className="str-video__participant_details">
        <span className="str-video__participant_name">
          {participant.user?.id}
        </span>
        {isDebugMode && (
          <span>
            <DebugParticipantPublishQuality
              updateSubscriptionsPartial={updateSubscriptionsPartial}
              userId={participant.user!.id}
              call={call}
            />
          </span>
        )}
      </div>
    </div>
  );
};

const DebugParticipantPublishQuality = (props: {
  userId: string;
  call: Call;
  updateSubscriptionsPartial?: (
    partialSubscriptions: UserSubscriptions,
  ) => Promise<void>;
}) => {
  const { call, userId, updateSubscriptionsPartial } = props;
  const [quality, setQuality] = useState<string>();
  const [publishStats, setPublishStats] = useState(() => ({
    f: true,
    h: true,
    q: true,
  }));

  useEffect(() => {
    return call.on('changePublishQuality', (event: SfuEvent) => {
      if (event.eventPayload.oneofKind !== 'changePublishQuality') return;
      const { videoSenders } = event.eventPayload.changePublishQuality;
      // FIXME OL: support additional layers (like screenshare)
      const [videoLayer] = videoSenders.map(({ layers }) => {
        return layers.map((l) => ({ [l.name]: l.active }));
      });
      // @ts-ignore
      setPublishStats((s) => ({
        ...s,
        ...videoLayer,
      }));
    });
  }, [call]);

  return (
    <select
      title={`Published tracks: ${JSON.stringify(publishStats)}`}
      value={quality}
      onChange={(e) => {
        const value = e.target.value;
        setQuality(value);
        if (updateSubscriptionsPartial) {
          let w = 1280;
          let h = 720;
          if (value === 'h') {
            w = 640;
            h = 480;
          } else if (value === 'q') {
            w = 320;
            h = 240;
          }
          updateSubscriptionsPartial({
            [userId]: {
              width: w,
              height: h,
            },
          }).catch((e) => {
            console.warn(`Failed to update partial user subscriptions`, e);
          });
        }
      }}
    >
      <option value="f">High (f)</option>
      <option value="h">Medium (h)</option>
      <option value="q">Low (q)</option>
    </select>
  );
};

const debounce = (fn: () => void, timeoutMs: number) => {
  let id: NodeJS.Timeout;
  return () => {
    clearTimeout(id);
    id = setTimeout(fn, timeoutMs);
  };
};
