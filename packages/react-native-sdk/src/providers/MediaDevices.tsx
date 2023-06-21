import React, { useEffect, useRef } from 'react';
import { getAudioDevices, getVideoDevices } from '@stream-io/video-client';
import { MediaDeviceInfo, useStreamVideoStoreSetState } from '../contexts';
import {
  isCameraPermissionGranted$,
  isMicPermissionGranted$,
} from '../utils/StreamVideoRN/rxSubjects';
import { concatMap } from 'rxjs/operators';
import { BehaviorSubject, EMPTY, Observable } from 'rxjs';

/**
 * A renderless component that provides the audio and video devices to the store
 * This component must be a child of StreamVideoStoreProvider
 * @internal
 *
 * @category Device Management
 */

const subscribeToDevicesWhenPermissionGranted = (
  isDevicePermissionGranted$: BehaviorSubject<boolean>,
  getDevicesFunc: () => Observable<MediaDeviceInfo[]>,
  subscriptionCallback: (videoDevices: MediaDeviceInfo[]) => void,
) =>
  isDevicePermissionGranted$
    .pipe(
      concatMap((isDevicePermissionGranted) => {
        // if we don't have mic permission, we don't need to get the audio devices
        // because we won't be able to use them anyway and this will trigger a permission request
        // from RN WebRTC lib. This is not ideal because we want to control when the permission.
        if (!isDevicePermissionGranted) {
          // otherwise return EMPTY, which is an Observable that does nothing and just completes immediately
          return EMPTY;
        }
        return getDevicesFunc();
      }),
    )
    .subscribe(subscriptionCallback);

export const MediaDevices = (): React.ReactElement | null => {
  const setState = useStreamVideoStoreSetState();
  const initialVideoDeviceSet = useRef(false);

  useEffect(() => {
    const setAudioDevices = (audioDevices: MediaDeviceInfo[]) => {
      setState({ audioDevices, currentAudioDevice: audioDevices[0] });
    };

    const subscription = subscribeToDevicesWhenPermissionGranted(
      isMicPermissionGranted$,
      getAudioDevices,
      setAudioDevices,
    );
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
    const subscription = subscribeToDevicesWhenPermissionGranted(
      isCameraPermissionGranted$,
      getVideoDevices,
      setVideoDevices,
    );
    return () => subscription.unsubscribe();
  }, [setState]);

  return null;
};
