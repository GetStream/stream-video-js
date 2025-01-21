import { BehaviorSubject } from 'rxjs';

export const isInPiPModeAndroid$ = new BehaviorSubject<boolean>(false);

export const disablePiPMode$ = new BehaviorSubject<boolean>(false);
