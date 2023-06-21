import { BehaviorSubject } from 'rxjs';

export const isCameraPermissionGranted$ = new BehaviorSubject<boolean>(false);
