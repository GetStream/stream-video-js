import {
  watchForDisconnectedAudioDevice,
  watchForDisconnectedVideoDevice,
  watchForDisconnectedAudioOutputDevice, // TODO: ???
} from '@stream-io/video-client';
import { useCallback, useEffect } from 'react';
import { Call, SfuModels } from '@stream-io/video-client';
import { useStore } from '@stream-io/video-react-bindings';

import { useLocalMediaStreamsContext } from '../contexts';
import { useDebugPreferredVideoCodec } from '../components/Debug/useIsDebugMode';
import { map } from 'rxjs';

export const useMediaPublisher = ({
  call,
  initialAudioMuted,
  initialVideoMuted,
}: {
  call?: Call;
  initialAudioMuted?: boolean;
  initialVideoMuted?: boolean;
}) => {
  const { localParticipant$ } = useStore();
  const { localVideoStream, localAudioStream } = useLocalMediaStreamsContext();

  useEffect(() => {
    if (initialAudioMuted || !localAudioStream) return;
    call?.publishAudioStream(localAudioStream);
  }, [call, localAudioStream, initialAudioMuted]);

  const preferredCodec = useDebugPreferredVideoCodec();
  useEffect(() => {
    if (initialVideoMuted || !localVideoStream) return;
    call?.publishVideoStream(localVideoStream, { preferredCodec });
  }, [call, preferredCodec, initialVideoMuted, localVideoStream]);

  const publishAudioStream = useCallback(async () => {
    try {
      if (!localAudioStream) return;
      await call?.publishAudioStream(localAudioStream);
    } catch (e) {
      console.log('Failed to publish audio stream', e);
    }
  }, [localAudioStream, call]);

  const publishVideoStream = useCallback(async () => {
    try {
      if (!localVideoStream) return;
      await call?.publishVideoStream(localVideoStream, { preferredCodec });
    } catch (e) {
      console.log('Failed to publish video stream', e);
    }
  }, [call, preferredCodec, localVideoStream]);

  useEffect(() => {
    const subscription = watchForDisconnectedAudioDevice(
      localParticipant$.pipe(map((p) => p?.audioDeviceId)),
    ).subscribe(async () => {
      await call?.stopPublish(SfuModels.TrackType.AUDIO);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [localParticipant$, call]);

  useEffect(() => {
    const subscription = watchForDisconnectedVideoDevice(
      localParticipant$.pipe(map((p) => p?.videoDeviceId)),
    ).subscribe(async () => {
      await call?.stopPublish(SfuModels.TrackType.VIDEO);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [localParticipant$, call]);

  return { publishAudioStream, publishVideoStream };
};
