import {
  Participant,
  VideoDimension,
} from '@stream-io/video-client/dist/src/gen/video/sfu/models/models';
import { useCallback, useEffect, useRef } from 'react';
import { Call, StreamVideoParticipant } from '@stream-io/video-client';
import { useParticipants } from '../../hooks/useParticipants';
import { useStreamVideoClient } from '../../StreamVideo';
import { useMediaDevices } from '../../contexts/MediaDevicesContext';
import { ParticipantBox } from './ParticipantBox';

export type UserSubscriptions = { [key: string]: VideoDimension };

export const Stage = (props: {
  call: Call;
  participants: Participant[];
  includeSelf: boolean;
}) => {
  const { call, includeSelf } = props;
  // FIXME: SZZ: this doesn't seem like the Reacty way
  const client = useStreamVideoClient()!;
  const participants = useParticipants(client);

  const updateVideoSubsscriptionForParticipant = useCallback(
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
            key={`${userId}/${participant.sessionId}`}
            participant={participant}
            isMuted={isAutoMuted}
            call={call}
            updateVideoSubsscriptionForParticipant={
              updateVideoSubsscriptionForParticipant
            }
          />
        );
      })}
    </div>
  );
};
