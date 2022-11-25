import {
  SfuModels,
  watchForDisconnectedAudioDevice,
  watchForDisconnectedVideoDevice,
} from '@stream-io/video-client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Call } from '@stream-io/video-client';
import {
  useLocalParticipant,
  useRemoteParticipants,
  useStore,
} from '@stream-io/video-react-bindings';

import { useMediaDevices } from '../../contexts/MediaDevicesContext';
import { ParticipantBox } from './ParticipantBox';
import { useDebugPreferredVideoCodec } from '../Debug/useIsDebugMode';
import { map, Subscription } from 'rxjs';

export const Stage = (props: {
  call: Call;
  participants: SfuModels.Participant[];
}) => {
  const { call } = props;

  const localParticipant = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const { activeCallLocalParticipant$ } = useStore();

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

  const [localAudioStream, setLocalAudioStream] = useState<MediaStream>();
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream>();
  const { getAudioStream, getVideoStream } = useMediaDevices();
  useEffect(() => {
    getAudioStream().then(setLocalAudioStream);
  }, [getAudioStream]);

  useEffect(() => {
    getVideoStream().then(setLocalVideoStream);
  }, [getVideoStream]);

  useEffect(() => {
    const subscriptions: Subscription[] = [];
    subscriptions.push(
      watchForDisconnectedAudioDevice(
        activeCallLocalParticipant$.pipe(map((p) => p?.audioDeviceId)),
      ).subscribe(async () => {
        call.updateMuteState('audio', true);
        const stream = await getAudioStream();
        await call.replaceMediaStream('audioinput', stream);
      }),
    );
    subscriptions.push(
      watchForDisconnectedVideoDevice(
        activeCallLocalParticipant$.pipe(map((p) => p?.videoDeviceId)),
      ).subscribe(async () => {
        call.updateMuteState('video', true);
        const stream = await getVideoStream();
        await call.replaceMediaStream('videoinput', stream);
      }),
    );

    return () => subscriptions.forEach((s) => s.unsubscribe());
  }, [activeCallLocalParticipant$, call, getVideoStream, getAudioStream]);

  const preferredCodec = useDebugPreferredVideoCodec();
  useEffect(() => {
    if (localAudioStream) {
      call.publishAudioStream(localAudioStream).catch((e) => {
        console.error(`Failed to publish`, e);
      });
    }
    if (localVideoStream) {
      call
        .publishVideoStream(localVideoStream, { preferredCodec })
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
