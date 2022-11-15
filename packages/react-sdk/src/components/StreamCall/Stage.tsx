import { SfuModels } from '@stream-io/video-client';
import { useCallback, useEffect } from 'react';
import { Call } from '@stream-io/video-client';
import {
  useLocalParticipant,
  useRemoteParticipants,
} from '../../hooks/useParticipants';
import { useMediaDevices } from '../../contexts/MediaDevicesContext';
import { ParticipantBox } from './ParticipantBox';
import { useDebugPreferredVideoCodec } from '../Debug/useIsDebugMode';

export const Stage = (props: {
  call: Call;
  participants: SfuModels.Participant[];
}) => {
  const { call } = props;

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

  const preferredCodec = useDebugPreferredVideoCodec();
  useEffect(() => {
    if (localAudioStream && localVideoStream) {
      call
        .publish(localAudioStream, localVideoStream, {
          preferredVideoCodec: preferredCodec,
        })
        .catch((e) => {
          console.error(`Failed to publish`, e);
        });
    }
  }, [call, localAudioStream, localVideoStream, preferredCodec]);

  const grid = `str-video__grid-${remoteParticipants.length + 1 || 1}`;
  return (
    <div className={`str-video__stage ${grid}`}>
      {localParticipant && (
        <ParticipantBox
          participant={localParticipant}
          isMuted
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
