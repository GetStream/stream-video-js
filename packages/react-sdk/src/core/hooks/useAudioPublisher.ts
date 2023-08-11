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
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { useHasBrowserPermissions } from './useDevices';

/**
 * @internal
 */
export type AudioPublisherInit = {
  initialAudioMuted?: boolean;
  audioDeviceId?: string;
};

/**
 * @internal
 * @category Device Management
 */
export const useAudioPublisher = ({
  initialAudioMuted,
  audioDeviceId,
}: AudioPublisherInit) => {
  const call = useCall();
  const { useCallState, useCallCallingState, useLocalParticipant } =
    useCallStateHooks();
  const callState = useCallState();
  const callingState = useCallCallingState();
  const participant = useLocalParticipant();
  const hasBrowserPermissionAudioInput = useHasBrowserPermissions(
    'microphone' as PermissionName,
  );
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

  const lastAudioDeviceId = useRef(audioDeviceId);
  useEffect(() => {
    if (
      callingState === CallingState.JOINED &&
      audioDeviceId !== lastAudioDeviceId.current
    ) {
      lastAudioDeviceId.current = audioDeviceId;
      publishAudioStream().catch((e) => {
        console.error('Failed to publish audio stream', e);
      });
    }
  }, [audioDeviceId, callingState, publishAudioStream]);

  const initialPublishRun = useRef(false);
  useEffect(() => {
    if (
      callingState === CallingState.JOINED &&
      !initialPublishRun.current &&
      !initialAudioMuted
    ) {
      // automatic publishing should happen only when joining the call
      // from the lobby, and the audio is not muted
      publishAudioStream().catch((e) => {
        console.error('Failed to publish audio stream', e);
      });
      initialPublishRun.current = true;
    }
  }, [callingState, initialAudioMuted, publishAudioStream]);

  useEffect(() => {
    if (!localParticipant$ || !hasBrowserPermissionAudioInput) return;
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
  }, [hasBrowserPermissionAudioInput, localParticipant$, call]);

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
