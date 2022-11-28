import {
  watchForDisconnectedAudioDevice,
  watchForDisconnectedVideoDevice,
} from '@stream-io/video-client';
import { useEffect, useState } from 'react';
import { map, Subscription } from 'rxjs';
import { Call } from '@stream-io/video-client';
import {
  useStore,
  useHasOngoingScreenShare,
} from '@stream-io/video-react-bindings';

import { useMediaDevices } from '../../contexts/MediaDevicesContext';
import { useDebugPreferredVideoCodec } from '../Debug/useIsDebugMode';
import { CallParticipantsView } from './CallParticipantsView';
import { CallParticipantsScreenView } from './CallParticipantsScreenView';

export const Stage = (props: { call: Call }) => {
  const { call } = props;
  const { activeCallLocalParticipant$ } = useStore();

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
    // TODO OL: unpublish audio stream
  }, [call, localAudioStream]);

  useEffect(() => {
    if (localVideoStream) {
      call
        .publishVideoStream(localVideoStream, { preferredCodec })
        .catch((e) => {
          console.error(`Failed to publish`, e);
        });
    }
    // TODO OL: unpublish video stream
  }, [call, localVideoStream, preferredCodec]);

  const hasScreenShare = useHasOngoingScreenShare();
  return (
    <div className="str-video__stage">
      {hasScreenShare ? (
        <CallParticipantsScreenView call={call} />
      ) : (
        <CallParticipantsView call={call} />
      )}
    </div>
  );
};
