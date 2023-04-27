import { useActiveCall } from '@stream-io/video-react-bindings';
import { useMediaDevices } from '../contexts/MediaDevicesContext';
import { useStreamVideoStoreValue } from '../contexts/StreamVideoContext';
import {
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
  const activeCall = useActiveCall();
  const { audioDevice, currentVideoDevice } = useMediaDevices();
  const isVideoMuted = useStreamVideoStoreValue((store) => store.isVideoMuted);
  const isAudioMuted = useStreamVideoStoreValue((store) => store.isAudioMuted);

  useEffect(() => {
    if (
      !activeCall?.permissionsContext.hasPermission(OwnCapability.SEND_AUDIO)
    ) {
      console.log(`No permission to publish audio`);
      return;
    }
    if (audioDevice && !isAudioMuted) {
      getAudioStream(audioDevice.deviceId)
        .then((stream) => activeCall?.publishAudioStream(stream))
        .catch((error) => {
          console.log(error);
        });
    }
  }, [activeCall, audioDevice, isAudioMuted]);

  useEffect(() => {
    if (
      !activeCall?.permissionsContext.hasPermission(OwnCapability.SEND_VIDEO)
    ) {
      console.log(`No permission to publish video`);
      return;
    }
    if (currentVideoDevice && !isVideoMuted) {
      getVideoStream(currentVideoDevice.deviceId)
        .then((stream) => {
          activeCall?.publishVideoStream(stream);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }, [activeCall, currentVideoDevice, isVideoMuted]);
};
