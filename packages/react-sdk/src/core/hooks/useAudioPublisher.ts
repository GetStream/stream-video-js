import { useCallback, useEffect, useRef } from 'react';
import { map } from 'rxjs';
import {
  CallingState,
  getAudioStream,
  OwnCapability,
  SfuModels,
  watchForAddedDefaultAudioDevice,
  watchForDisconnectedAudioDevice,
} from '@stream-io/video-client';
import {
  useCall,
  useCallCallingState,
  useCallState,
  useLocalParticipant,
} from '@stream-io/video-react-bindings';

/**
 * @internal
 */
export type AudioPublisherInit = {
  canObserveAudio?: boolean;
  initialAudioMuted?: boolean;
  audioDeviceId?: string;
};

/**
 * @internal
 * @category Device Management
 */
export const useAudioPublisher = ({
  canObserveAudio,
  initialAudioMuted,
  audioDeviceId,
}: AudioPublisherInit) => {
  const call = useCall();
  const callState = useCallState();
  const callingState = useCallCallingState();
  const participant = useLocalParticipant();
  const { localParticipant$ } = callState;

  const isPublishingAudio = participant?.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );

  const publishAudioStream = useCallback(async () => {
    if (!call) return;
    if (!call.permissionsContext.hasPermission(OwnCapability.SEND_AUDIO)) {
      throw new Error(`No permission to publish audio`);
    }
    try {
      const audioStream = await getAudioStream({
        deviceId: audioDeviceId,
      });
      await call.publishAudioStream(audioStream);
    } catch (e) {
      console.log('Failed to publish audio stream', e);
    }
  }, [audioDeviceId, call]);

  const initialPublishRun = useRef(false);
  useEffect(() => {
    if (
      callingState === CallingState.JOINED &&
      !initialAudioMuted &&
      !initialPublishRun.current
    ) {
      // automatic publishing should happen only when:
      // - joining the call from the lobby, and the audio is not muted
      // - reconnecting to the call with the audio already published
      publishAudioStream().catch((e) => {
        console.error('Failed to publish audio stream', e);
      });
      initialPublishRun.current = true;
    }
  }, [callingState, initialAudioMuted, publishAudioStream]);

  useEffect(() => {
    if (!localParticipant$ || !canObserveAudio) return;
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
  }, [canObserveAudio, localParticipant$, call]);

  useEffect(() => {
    if (!participant?.audioStream || !call || !isPublishingAudio) return;

    const [track] = participant.audioStream.getAudioTracks();
    const selectedAudioDeviceId = track.getSettings().deviceId;

    const republishDefaultDevice = watchForAddedDefaultAudioDevice().subscribe(
      async () => {
        if (
          !(
            call &&
            participant.audioStream &&
            selectedAudioDeviceId === 'default'
          )
        )
          return;
        // We need to stop the original track first in order
        // we can retrieve the new default device stream
        track.stop();
        const audioStream = await getAudioStream({
          deviceId: 'default',
        });
        await call.publishAudioStream(audioStream);
      },
    );

    const handleTrackEnded = async () => {
      if (selectedAudioDeviceId === audioDeviceId) {
        const audioStream = await getAudioStream({
          deviceId: audioDeviceId,
        });
        await call.publishAudioStream(audioStream);
      }
    };

    track.addEventListener('ended', handleTrackEnded);
    return () => {
      track.removeEventListener('ended', handleTrackEnded);
      republishDefaultDevice.unsubscribe();
    };
  }, [audioDeviceId, call, participant?.audioStream, isPublishingAudio]);

  return publishAudioStream;
};
