import {
  watchForDisconnectedAudioDevice,
  watchForDisconnectedVideoDevice,
  watchForDisconnectedAudioOutputDevice, // TODO: ???
} from '@stream-io/video-client';
import { useCallback, useEffect } from 'react';
import {
  Call,
  SfuModels,
  getAudioStream,
  getVideoStream,
} from '@stream-io/video-client';
import { useStore } from '@stream-io/video-react-bindings';

import { useDebugPreferredVideoCodec } from '../components/Debug/useIsDebugMode';
import { map } from 'rxjs';

export const useMediaPublisher = ({
  call,
  initialAudioMuted,
  initialVideoMuted,
  videoDeviceId,
  audioDeviceId,
}: {
  call: Call;
  initialAudioMuted?: boolean;
  initialVideoMuted?: boolean;
  audioDeviceId?: string;
  videoDeviceId?: string;
}) => {
  const { localParticipant$ } = useStore();

  useEffect(() => {
    let interrupted = false;

    if (initialAudioMuted) return;

    getAudioStream(audioDeviceId).then((stream) => {
      if (interrupted && stream.active)
        return stream.getTracks().forEach((t) => t.stop());

      return call.publishAudioStream(stream);
    });

    return () => {
      interrupted = true;
      call.stopPublish(SfuModels.TrackType.AUDIO);
    };
  }, [call, audioDeviceId, initialAudioMuted]);

  const preferredCodec = useDebugPreferredVideoCodec();
  useEffect(() => {
    let interrupted = false;

    if (initialVideoMuted) return;

    getVideoStream(videoDeviceId).then((stream) => {
      if (interrupted && stream.active)
        return stream.getTracks().forEach((t) => t.stop());

      return call.publishVideoStream(stream, { preferredCodec });
    });

    return () => {
      interrupted = true;
      call.stopPublish(SfuModels.TrackType.VIDEO);
    };
  }, [videoDeviceId, call, preferredCodec, initialVideoMuted]);

  const publishAudioStream = useCallback(async () => {
    try {
      const audioStream = await getAudioStream(audioDeviceId);
      await call.publishAudioStream(audioStream);
    } catch (e) {
      console.log('Failed to publish audio stream', e);
    }
  }, [audioDeviceId, call]);

  const publishVideoStream = useCallback(async () => {
    try {
      const videoStream = await getVideoStream(videoDeviceId);
      await call.publishVideoStream(videoStream, { preferredCodec });
    } catch (e) {
      console.log('Failed to publish video stream', e);
    }
  }, [call, preferredCodec, videoDeviceId]);

  useEffect(() => {
    const subscription = watchForDisconnectedAudioDevice(
      localParticipant$.pipe(map((p) => p?.audioDeviceId)),
    ).subscribe(async () => {
      await call.stopPublish(SfuModels.TrackType.AUDIO);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [localParticipant$, call]);

  useEffect(() => {
    const subscription = watchForDisconnectedVideoDevice(
      localParticipant$.pipe(map((p) => p?.videoDeviceId)),
    ).subscribe(async () => {
      await call.stopPublish(SfuModels.TrackType.VIDEO);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [localParticipant$, call]);

  return { publishAudioStream, publishVideoStream };
};
