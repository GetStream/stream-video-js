import clsx from 'clsx';
import { Participant } from '@stream-io/video-client/dist/src/gen/video/sfu/models/models';
import { useCallback, useEffect, useRef } from 'react';
import { Call, StreamVideoParticipant } from '@stream-io/video-client';
import { useParticipants } from '../../hooks/useParticipants';
import { useStreamVideoClient } from '../../StreamVideo';
import { useMediaDevices } from '../../contexts/MediaDevicesContext';

export const Stage = (props: {
  call: Call;
  participants: Participant[];
  includeSelf: boolean;
}) => {
  const { call, includeSelf } = props;
  // FIXME: SZZ: this doesn't seem like the Reacty way
  const client = useStreamVideoClient()!;
  const participants = useParticipants(client);

  const updateVideoElementForParticipant = useCallback(
    (participant: StreamVideoParticipant, el: HTMLVideoElement | null) => {
      if (!el) {
        return;
      }
      call.updateVideoDimension(participant, {
        width: el.clientWidth,
        height: el.clientHeight,
      });
    },
    [],
  );

  const { audioStream: localAudioStream, videoStream: localVideoStream } =
    useMediaDevices();

  useEffect(() => {
    if (localAudioStream && localVideoStream) {
      call.publish(localAudioStream, localVideoStream);
    }
  }, [call, localAudioStream, localVideoStream]);

  const grid = `str-video__grid-${participants.length || 1}`;
  return (
    <div className={`str-video__stage ${grid}`}>
      {participants.map((participant) => {
        const userId = participant.user!.id;
        const isLocalParticipant = participant.isLoggedInUser;
        const isAutoMuted = isLocalParticipant && !includeSelf;
        return (
          <ParticipantBox
            key={userId}
            participant={participant}
            isMuted={isAutoMuted}
            updateVideoElementForParticipant={updateVideoElementForParticipant}
          />
        );
      })}
    </div>
  );
};

const ParticipantBox = (props: {
  participant: StreamVideoParticipant;
  isMuted?: boolean;
  updateVideoElementForParticipant: (
    participant: StreamVideoParticipant,
    element: HTMLVideoElement | null,
  ) => void;
}) => {
  const {
    participant,
    isMuted = false,
    updateVideoElementForParticipant,
  } = props;
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoStream = participant.videoTrack;
  const audioStream = participant.audioTrack;
  const isLocalParticipant = participant.isLoggedInUser;

  useEffect(() => {
    if (!videoRef.current) return;
    updateVideoElementForParticipant(participant, videoRef.current);
    const resizeObserver = new ResizeObserver(
      debounce(
        () => updateVideoElementForParticipant(participant, videoRef.current),
        1200,
      ),
    );
    resizeObserver.observe(videoRef.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, [participant, videoRef]);

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
