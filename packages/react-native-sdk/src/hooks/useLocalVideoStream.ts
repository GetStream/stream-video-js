import { useEffect, useState } from 'react';
import { getVideoStream } from '@stream-io/video-client';
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
      const stream = await getVideoStream(currentVideoDevice?.deviceId);
      setVideoStream(stream);
    };
    loadVideoStream();
  }, [currentVideoDevice]);

  return videoStream;
};
