import { switchMap } from 'rxjs/operators';
import { BehaviorSubject, EMPTY, Observable } from 'rxjs';
import { MediaDeviceInfo } from '../../contexts';
export const isCameraPermissionGranted$ = new BehaviorSubject<boolean>(false);
export const isMicPermissionGranted$ = new BehaviorSubject<boolean>(false);

export const subscribeToDevicesWhenPermissionGranted = (
  isDevicePermissionGranted$: BehaviorSubject<boolean>,
  getDevicesFunc: () => Observable<MediaDeviceInfo[]>,
  subscriptionCallback: (videoDevices: MediaDeviceInfo[]) => void,
) =>
  isDevicePermissionGranted$
    .pipe(
      switchMap((isDevicePermissionGranted) => {
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
