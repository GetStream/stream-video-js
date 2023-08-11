import { useCallback, useEffect, useRef } from 'react';
import {
  CallingState,
  getAudioStream,
  OwnCapability,
  SfuModels,
} from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { useStreamVideoStoreValue } from '../../contexts/StreamVideoContext';

/**
 * @internal
 */
type AudioPublisherInit = {
  initialAudioMuted?: boolean;
};

/**
 * @internal
 * @category Device Management
 */
export const useAudioPublisher = ({
  initialAudioMuted,
}: AudioPublisherInit) => {
  const call = useCall();
  const { useCallCallingState, useLocalParticipant } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participant = useLocalParticipant();
  const audioDeviceId = useStreamVideoStoreValue(
    (store) => store.currentAudioDevice,
  )?.deviceId;

  const isPublishingAudio = participant?.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );

  const publishAudioStream = useCallback(async () => {
    if (!call || !audioDeviceId) {
      return;
    }
    if (!call.permissionsContext.hasPermission(OwnCapability.SEND_AUDIO)) {
      throw new Error(
        "No permission from the call's admin to publish video stream",
      );
    }
    try {
      const audioStream = await getAudioStream({
        deviceId: audioDeviceId,
      });

      await call.publishAudioStream(audioStream);
    } catch (e) {
      console.log('Failed to publish video stream', e);
    }
  }, [call, audioDeviceId]);

  // If the audio device id changes, we need to re-publish the audio stream
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

  /*
   * When joining the call, publish video stream automatically in the following case:
   * - joining the call from the lobby, and the video is not muted
   */
  useEffect(() => {
    if (callingState !== CallingState.JOINED) {
      return;
    }
    const shouldJoinInitially =
      !initialAudioMuted && !initialPublishRun.current;
    if (!shouldJoinInitially) {
      return;
    }
    publishAudioStream().catch((e) => {
      console.error('Failed to publish audio stream', e);
    });
    initialPublishRun.current = true;
  }, [callingState, initialAudioMuted, publishAudioStream]);

  /*
   * When track ended unexpectedly due to unknown external factors, try to publish the video stream again
   * Note: this is not triggered when track.stop is called
   */
  useEffect(() => {
    if (!participant?.audioStream || !call || !isPublishingAudio) {
      return;
    }

    const [track] = participant.audioStream.getAudioTracks();
    const selectedAudioDeviceId = track.getSettings().deviceId;

    const handleTrackEnded = async () => {
      if (
        selectedAudioDeviceId === audioDeviceId &&
        call.permissionsContext.hasPermission(OwnCapability.SEND_AUDIO)
      ) {
        const audioStream = await getAudioStream({
          deviceId: audioDeviceId,
        });
        await call.publishAudioStream(audioStream);
      }
    };

    track.addEventListener('ended', handleTrackEnded);
    return () => {
      track.removeEventListener('ended', handleTrackEnded);
    };
  }, [audioDeviceId, call, participant?.audioStream, isPublishingAudio]);

  return publishAudioStream;
};
