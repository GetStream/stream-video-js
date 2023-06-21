import { useEffect, useState } from 'react';
import { disposeOfMediaStream, getVideoStream } from '@stream-io/video-client';
import { MediaStream } from 'react-native-webrtc';
import { useStreamVideoStoreValue } from '../contexts';

/**
 * A hook which provides the device's local video stream.
 *
 * @category Device Management
 */
export const useLocalVideoStream = () => {
  const [videoStream, setVideoStream] = useState<MediaStream | undefined>(
    undefined,
  );
  const currentVideoDeviceId = useStreamVideoStoreValue(
    (store) => store.currentVideoDevice,
  )?.deviceId;

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
    loadVideoStream();
    return () => {
      interrupted = true;
      if (mediaStream) {
        disposeOfMediaStream(mediaStream);
      }
    };
  }, [currentVideoDeviceId]);

  return videoStream;
};
