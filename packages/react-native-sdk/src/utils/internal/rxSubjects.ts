import { BehaviorSubject } from 'rxjs';

export const isInPiPMode$ = new BehaviorSubject<boolean>(false);

export const disablePiPMode$ = new BehaviorSubject<boolean>(false);
