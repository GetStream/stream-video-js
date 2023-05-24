import { useEffect, useRef } from 'react';
import { getAudioDevices, getVideoDevices } from '@stream-io/video-client';
import { MediaDeviceInfo } from './types';
import { useStreamVideoStoreSetState } from '.';

/**
 * A renderless component that provides the audio and video devices to the store
 * @internal
 *
 * @category Device Management
 */
export const MediaDevices = () => {
  const setState = useStreamVideoStoreSetState();
  const initialVideoDeviceSet = useRef(false);

  useEffect(() => {
    const setAudioDevices = (audioDevices: MediaDeviceInfo[]) => {
      setState({ audioDevices, currentAudioDevice: audioDevices[0] });
    };
    const subscription = getAudioDevices().subscribe(setAudioDevices);
    return () => subscription.unsubscribe();
  }, [setState]);

  useEffect(() => {
    const setVideoDevices = (videoDevices: MediaDeviceInfo[]) => {
      if (videoDevices.length > 0 && !initialVideoDeviceSet.current) {
        const frontFacingVideoDevice = videoDevices.find(
          (videoDevice) =>
            videoDevice.kind === 'videoinput' && videoDevice.facing === 'front',
        );
        const initialVideoDevice = frontFacingVideoDevice ?? videoDevices[0];
        if (initialVideoDevice) {
          initialVideoDeviceSet.current = true;
          setState({ videoDevices, currentVideoDevice: initialVideoDevice });
          return;
        }
      }
      setState({ videoDevices });
    };
    const subscription = getVideoDevices().subscribe(setVideoDevices);
    return () => subscription.unsubscribe();
  }, [setState]);

  return null;
};
