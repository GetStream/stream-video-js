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
  call: Call;
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

  useEffect(() => {
    let interrupted = false;

    // isPublishingAudio can be initially undefined which
    // is an important information to have on initial effect run
    // as mute state is derived from the participant.publishedTracks array (no audio track means muted)
    // we only strictly check if it's false to see if the user is muted while changing devices
    // no other effect trigger is necessary, you only want effect to run when audioDeviceId or call changes
    if (initialAudioMuted || isPublishingAudio === false) return;

    getAudioStream(audioDeviceId).then((stream) => {
      if (interrupted && stream.active)
        return stream.getTracks().forEach((t) => t.stop());

      return call.publishAudioStream(stream);
    });

    return () => {
      interrupted = true;
      call.stopPublish(SfuModels.TrackType.AUDIO);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call, audioDeviceId]);

  const publishAudioStream = useCallback(async () => {
    try {
      const audioStream = await getAudioStream(audioDeviceId);
      await call.publishAudioStream(audioStream);
    } catch (e) {
      console.log('Failed to publish audio stream', e);
    }
  }, [audioDeviceId, call]);

  useEffect(() => {
    const subscription = watchForDisconnectedAudioDevice(
      localParticipant$.pipe(map((p) => p?.audioDeviceId)),
    ).subscribe(async () => {
      call.setAudioDevice(undefined);
      await call.stopPublish(SfuModels.TrackType.AUDIO);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [localParticipant$, call]);

  return publishAudioStream;
};
