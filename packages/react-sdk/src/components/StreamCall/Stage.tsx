import { SfuModels } from '@stream-io/video-client';
import { useCallback, useEffect } from 'react';
import { Call } from '@stream-io/video-client';
import {
  useLocalParticipant,
  useRemoteParticipants,
} from '../../hooks/useParticipants';
import { useMediaDevices } from '../../contexts/MediaDevicesContext';
import { ParticipantBox } from './ParticipantBox';

export const Stage = (props: {
  call: Call;
  participants: SfuModels.Participant[];
  includeSelf: boolean;
}) => {
  const { call, includeSelf } = props;

  const localParticipant = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();

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

  const { audioStream: localAudioStream, videoStream: localVideoStream } =
    useMediaDevices();

  useEffect(() => {
    if (localAudioStream && localVideoStream) {
      call.publish(localAudioStream, localVideoStream);
    }
  }, [call, localAudioStream, localVideoStream]);

  const grid = `str-video__grid-${remoteParticipants.length + 1 || 1}`;
  return (
    <div className={`str-video__stage ${grid}`}>
      {localParticipant && (
        <ParticipantBox
          participant={localParticipant}
          isMuted={!includeSelf}
          call={call}
          updateVideoSubscriptionForParticipant={
            updateVideoSubscriptionForParticipant
          }
        />
      )}

      {remoteParticipants.map((participant) => (
        <ParticipantBox
          key={participant.sessionId}
          participant={participant}
          call={call}
          updateVideoSubscriptionForParticipant={
            updateVideoSubscriptionForParticipant
          }
        />
      ))}
    </div>
  );
};
