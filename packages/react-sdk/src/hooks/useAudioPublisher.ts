import { useLocalParticipant, useStore } from '@stream-io/video-react-bindings';
import { useCallback, useEffect } from 'react';
import {
  Call,
  getAudioStream,
  SfuModels,
  watchForDisconnectedAudioDevice,
} from '@stream-io/video-client';
import { map } from 'rxjs';

export type AudioPublisherInit = {
  call?: Call;
  initialAudioMuted?: boolean;
  audioDeviceId?: string;
};
export const useAudioPublisher = ({
  call,
  initialAudioMuted,
  audioDeviceId,
}: AudioPublisherInit) => {
  const { localParticipant$ } = useStore();

  const participant = useLocalParticipant();

  const isPublishingAudio = participant?.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );

  const publishAudioStream = useCallback(async () => {
    if (!call) return;
    try {
      const audioStream = await getAudioStream(audioDeviceId);
      await call.publishAudioStream(audioStream);
    } catch (e) {
      console.log('Failed to publish audio stream', e);
    }
  }, [audioDeviceId, call]);

  useEffect(() => {
    let interrupted = false;

    if (!call || initialAudioMuted || isPublishingAudio) return;

    getAudioStream(audioDeviceId).then((stream) => {
      if (interrupted && stream.active)
        return stream.getTracks().forEach((t) => t.stop());

      return call.publishAudioStream(stream);
    });

    return () => {
      interrupted = true;
    };
  }, [call, audioDeviceId, initialAudioMuted, isPublishingAudio]);

  useEffect(() => {
    const subscription = watchForDisconnectedAudioDevice(
      localParticipant$.pipe(map((p) => p?.audioDeviceId)),
    ).subscribe(async () => {
      if (!call) return;
      call.setAudioDevice(undefined);
      await call.stopPublish(SfuModels.TrackType.AUDIO);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [localParticipant$, call]);

  return publishAudioStream;
};
