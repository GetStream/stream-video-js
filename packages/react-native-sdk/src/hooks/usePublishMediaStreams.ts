import { useCall, useCallCallingState } from '@stream-io/video-react-bindings';
import { useStreamVideoStoreValue } from '../contexts/StreamVideoContext';
import {
  CallingState,
  OwnCapability,
  getAudioStream,
  getVideoStream,
} from '@stream-io/video-client';
import { useEffect } from 'react';

/**
 * A helper hook that takes care of publishing audio and video streams of the active call.
 *
 * @category Device Management
 */
export const usePublishMediaStreams = () => {
  const activeCall = useCall();
  const callingState = useCallCallingState();
  const isCallJoined = callingState === CallingState.JOINED;
  const currentAudioDevice = useStreamVideoStoreValue(
    (store) => store.currentAudioDevice,
  );
  const currentVideoDevice = useStreamVideoStoreValue(
    (store) => store.currentVideoDevice,
  );
  const isVideoMuted = useStreamVideoStoreValue((store) => store.isVideoMuted);
  const isAudioMuted = useStreamVideoStoreValue((store) => store.isAudioMuted);

  const audioDeviceId = currentAudioDevice?.deviceId;
  const videoDeviceId = currentVideoDevice?.deviceId;

  useEffect(() => {
    if (isCallJoined && audioDeviceId && !isAudioMuted) {
      if (
        !activeCall?.permissionsContext.hasPermission(OwnCapability.SEND_AUDIO)
      ) {
        console.log(
          "No permission from the call's admin to publish audio stream",
        );
        return;
      }
      const publishAudio = async () => {
        try {
          const stream = await getAudioStream({ deviceId: audioDeviceId });
          activeCall?.publishAudioStream(stream);
        } catch (error) {
          console.log(error);
        }
      };
      publishAudio();
    }
  }, [activeCall, audioDeviceId, isAudioMuted, isCallJoined]);

  useEffect(() => {
    if (isCallJoined && videoDeviceId && !isVideoMuted) {
      if (
        !activeCall?.permissionsContext.hasPermission(OwnCapability.SEND_VIDEO)
      ) {
        console.log(
          "No permission from the call's admin to publish video stream",
        );
        return;
      }
      const publishVideo = async () => {
        try {
          const stream = await getVideoStream({ deviceId: videoDeviceId });
          activeCall?.publishVideoStream(stream);
        } catch (error) {
          console.log(error);
        }
      };
      publishVideo();
    }
  }, [activeCall, videoDeviceId, isVideoMuted, isCallJoined]);
};
