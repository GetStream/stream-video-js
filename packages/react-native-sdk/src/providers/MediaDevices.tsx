import React, { useEffect, useRef } from 'react';
import { getAudioDevices, getVideoDevices } from '@stream-io/video-client';
import { MediaDeviceInfo, useStreamVideoStoreSetState } from '../contexts';

/**
 * A renderless component that provides the audio and video devices to the store
 * This component must be a child of StreamVideoStoreProvider
 * @internal
 *
 * @category Device Management
 */
export const MediaDevices = (): React.ReactElement | null => {
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
