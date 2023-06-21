import React, { useEffect, useRef, useState } from 'react';
import { getAudioDevices, getVideoDevices } from '@stream-io/video-client';
import { MediaDeviceInfo, useStreamVideoStoreSetState } from '../contexts';
import { isCameraPermissionGranted$ } from '../utils/StreamVideoRN/rxSubjects';
import { switchMap, concatMap, mergeMap } from 'rxjs/operators';
import { of, EMPTY } from 'rxjs';

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
    // check whether we have audio permission on bth OSs
    const subscription = getAudioDevices().subscribe(setAudioDevices);
    return () => subscription.unsubscribe();
  }, [setState]);

  useEffect(() => {
    console.log('MediaDevices useEffect');
    const setVideoDevices = (videoDevices: MediaDeviceInfo[]) => {
      console.log('setVideoDevices', videoDevices);
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

    const subscription = isCameraPermissionGranted$
      .pipe(
        concatMap((isCameraPermissionsGranted) => {
          // if we don't have camera permission, we don't need to get the video devices
          // because we won't be able to use them anyway and this will trigger a permission request
          // from RN WebRTC lib. This is not ideal because we want to control when the permission.
          if (!isCameraPermissionsGranted) {
            // otherwise return EMPTY, which is an Observable that does nothing and just completes immediately
            console.log('returning empty');
            return EMPTY;
          }
          console.log('returning getVideoDevices()');
          return getVideoDevices();
        }),
      )
      .subscribe(setVideoDevices);

    // const subscription = isCameraPermissionGranted$.subscribe(
    //   (isCameraPermissionsGranted) => {
    //     if (isCameraPermissionsGranted) {
    //       console.log('isCameraPermissionsGranted');
    //       getVideoDevices().subscribe(setVideoDevices);
    //     }
    //   },
    // );

    return () => subscription.unsubscribe();
  }, [setState]);

  return null;
};
