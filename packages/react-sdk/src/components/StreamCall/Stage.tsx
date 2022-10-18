import clsx from 'clsx';
import {
  Participant,
  VideoDimension,
} from '@stream-io/video-client/dist/src/gen/video/sfu/models/models';
import { useCallback, useEffect, useRef } from 'react';
import { Call } from '@stream-io/video-client';
import { useParticipantStreams } from '../../hooks/useParticipantStreams';
import { useParticipants } from '../../hooks/useParticipants';
import { useMediaDevices } from '../../contexts/MediaDevicesContext';

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
  useEffect(() => {
    const requestSubscriptions = async () => {
      const subscriptions: { [key: string]: VideoDimension } = {};
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
      if (Object.keys(subscriptions).length > 0) {
        call.updateSubscriptions(subscriptions).catch((e: Error) => {
          console.error(`Failed to update subscriptions`, e);
        });
      }
    };
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
  }, [call, currentUserId, includeSelf, participants]);

  const grid = `str-video__grid-${participants.length || 1}`;
  return (
    <div className={`str-video__stage ${grid}`} ref={gridRef}>
      {Object.entries(userVideoStreams).map(([userId, videoStream]) => {
        return (
          <ParticipantBox
            key={userId}
            participant={{
              // @ts-ignore
              user: {
                id: userId,
              },
            }}
            isLocalParticipant={false}
            isMuted={false}
            audioStream={undefined}
            videoStream={videoStream}
            updateVideoElementForUserId={updateVideoElementForUserId}
          />
        );
      })}
      {/*{participants.map((participant) => {*/}
      {/*  const userId = participant.user!.id;*/}
      {/*  const isLocalParticipant = currentUserId === userId;*/}
      {/*  const isAutoMuted = isLocalParticipant && !includeSelf;*/}

      {/*  const audioStream =*/}
      {/*    isLocalParticipant && !includeSelf*/}
      {/*      ? localAudioStream*/}
      {/*      : userAudioStreams[userId];*/}

      {/*  const videoStream =*/}
      {/*    isLocalParticipant && !includeSelf*/}
      {/*      ? localVideoStream*/}
      {/*      : userVideoStreams[userId];*/}

      {/*  return (*/}
      {/*    <ParticipantBox*/}
      {/*      key={userId}*/}
      {/*      participant={participant}*/}
      {/*      isLocalParticipant={isLocalParticipant}*/}
      {/*      isMuted={isAutoMuted}*/}
      {/*      audioStream={audioStream}*/}
      {/*      videoStream={videoStream}*/}
      {/*      updateVideoElementForUserId={updateVideoElementForUserId}*/}
      {/*    />*/}
      {/*  );*/}
      {/*})}*/}
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
}) => {
  const {
    audioStream,
    videoStream,
    participant,
    isLocalParticipant,
    isMuted = false,
    updateVideoElementForUserId,
  } = props;
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const userId = participant.user!.id;
  useEffect(() => {
    updateVideoElementForUserId(userId, videoRef.current);
    return () => {
      updateVideoElementForUserId(userId, null);
    };
  }, [userId, updateVideoElementForUserId]);

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
      </div>
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
