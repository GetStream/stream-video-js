import {Observable, BehaviorSubject} from 'rxjs';
import {UserInput} from '../gen/video/coordinator/user_v1/user';

export type StreamVideoWriteableStateStore = {
  connectedUserSubject: BehaviorSubject<UserInput | undefined>;
};

export const writeableStateStore: StreamVideoWriteableStateStore = {
  connectedUserSubject: new BehaviorSubject<UserInput | undefined>(undefined),
};

export type StreamVideoReadOnlyStateStore = {
  connectedUser$: Observable<UserInput | undefined>;
};

export const readOnlyStateStore: StreamVideoReadOnlyStateStore = {
  connectedUser$: writeableStateStore.connectedUserSubject.asObservable(),
};
