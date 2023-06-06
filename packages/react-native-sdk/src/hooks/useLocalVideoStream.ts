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
  const currentVideoDevice = useStreamVideoStoreValue(
    (store) => store.currentVideoDevice,
  );

  useEffect(() => {
    const loadVideoStream = async () => {
      // If there is no video device, we don't need to load a video stream.
      if (!currentVideoDevice?.deviceId) return null;

      const stream = await getVideoStream({
        deviceId: currentVideoDevice.deviceId,
      });
      setVideoStream((previousStream) => {
        if (!previousStream) return stream;

        disposeOfMediaStream(previousStream);
      });
    };
    loadVideoStream();
  }, [currentVideoDevice.deviceId]);

  return videoStream;
};
