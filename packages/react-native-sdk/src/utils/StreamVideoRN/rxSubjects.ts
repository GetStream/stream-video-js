import { BehaviorSubject } from 'rxjs';

export const isCameraPermissionGranted$ = new BehaviorSubject<boolean>(false);
export const isMicPermissionGranted$ = new BehaviorSubject<boolean>(false);
