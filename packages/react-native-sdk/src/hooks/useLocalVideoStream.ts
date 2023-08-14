import { useEffect, useState } from 'react';
import { disposeOfMediaStream, getVideoStream } from '@stream-io/video-client';
import { MediaStream } from 'react-native-webrtc';
import { useStreamVideoStoreValue } from '../contexts';
import { useCameraState } from '@stream-io/video-react-bindings';
import { useAppStateListener } from '../utils/hooks';

/**
 * A hook which provides the device's local video stream.
 *
 * @category Device Management
 */
export const useLocalVideoStream = () => {
  const [videoStream, setVideoStream] = useState<MediaStream | undefined>(
    undefined,
  );
  const { status: cameraStatus } = useCameraState();
  const currentVideoDeviceId = useStreamVideoStoreValue(
    (store) => store.currentVideoDevice,
  )?.deviceId;

  // Pause/Resume video stream tracks when app goes to background/foreground
  // To save on CPU resources
  useAppStateListener(
    () => {
      videoStream?.getVideoTracks().forEach((track) => {
        track.enabled = true;
      });
    },
    () => {
      videoStream?.getVideoTracks().forEach((track) => {
        track.enabled = false;
      });
    },
  );

  useEffect(() => {
    let mediaStream: MediaStream | undefined;
    let interrupted = false;
    const loadVideoStream = async () => {
      // If there is no video device, we don't need to load a video stream.
      if (!currentVideoDeviceId) {
        return null;
      }

      const _mediaStream = await getVideoStream({
        deviceId: currentVideoDeviceId,
      });
      if (interrupted) {
        // device changed while we were loading the video stream, so dispose of it
        disposeOfMediaStream(_mediaStream);
        return;
      }
      mediaStream = _mediaStream;
      setVideoStream(_mediaStream);
    };

    if (!cameraStatus || cameraStatus === 'disabled') {
      if (mediaStream) {
        disposeOfMediaStream(mediaStream);
        setVideoStream(undefined);
      }
    } else {
      loadVideoStream();
    }

    return () => {
      interrupted = true;
      if (mediaStream) {
        disposeOfMediaStream(mediaStream);
      }
    };
  }, [currentVideoDeviceId, cameraStatus]);

  return videoStream;
};
