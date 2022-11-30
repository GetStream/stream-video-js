import {
  watchForDisconnectedAudioDevice,
  watchForDisconnectedVideoDevice,
} from '@stream-io/video-client';
import { useCallback, useEffect, useState } from 'react';
import { Call } from '@stream-io/video-client';
import { useStore } from '@stream-io/video-react-bindings';

import { useMediaDevices } from '../contexts';
import { useDebugPreferredVideoCodec } from '../components/Debug/useIsDebugMode';
import { map, Subscription } from 'rxjs';

// FIXME: use proper name
export const useStage = (call?: Call) => {
  const { localParticipant$ } = useStore();

  const [localAudioStream, setLocalAudioStream] = useState<MediaStream>();
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream>();

  const updateVideoSubscriptionForParticipant = useCallback(
    (sessionId: string, width: number, height: number) => {
      call?.updateSubscriptionsPartial({
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

  const { getAudioStream, getVideoStream } = useMediaDevices();

  useEffect(() => {
    getAudioStream().then(setLocalAudioStream);
  }, [getAudioStream]);

  useEffect(() => {
    getVideoStream().then(setLocalVideoStream);
  }, [getVideoStream]);

  useEffect(() => {
    if (!call) return;

    const subscriptions: Subscription[] = [];
    subscriptions.push(
      watchForDisconnectedAudioDevice(
        localParticipant$.pipe(map((p) => p?.audioDeviceId)),
      ).subscribe(async () => {
        call.updateMuteState('audio', true);
        const stream = await getAudioStream();
        call.replaceMediaStream('audioinput', stream);
      }),
    );
    subscriptions.push(
      watchForDisconnectedVideoDevice(
        localParticipant$.pipe(map((p) => p?.videoDeviceId)),
      ).subscribe(async () => {
        call.updateMuteState('video', true);
        const stream = await getVideoStream();
        call.replaceMediaStream('videoinput', stream);
      }),
    );

    return () => subscriptions.forEach((s) => s.unsubscribe());
  }, [localParticipant$, call, getVideoStream, getAudioStream]);

  const preferredCodec = useDebugPreferredVideoCodec();
  useEffect(() => {
    if (!call) return;

    if (localAudioStream && localVideoStream) {
      call
        .publishMediaStreams(localAudioStream, localVideoStream, {
          preferredVideoCodec: preferredCodec,
        })
        .catch((e) => {
          console.error(`Failed to publish`, e);
        });
    }
  }, [call, localAudioStream, localVideoStream, preferredCodec]);

  return {
    updateVideoSubscriptionForParticipant,
  };
};
