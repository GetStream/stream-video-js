import { useCallback, useEffect, useRef } from 'react';
import {
  CallingState,
  getAudioStream,
  OwnCapability,
} from '@stream-io/video-client';
import { useCall, useCallCallingState } from '@stream-io/video-react-bindings';
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
  const callingState = useCallCallingState();
  const audioDeviceId = useStreamVideoStoreValue(
    (store) => store.currentAudioDevice,
  )?.deviceId;

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

  return publishAudioStream;
};
