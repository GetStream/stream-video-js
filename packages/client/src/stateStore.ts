import { Observable, BehaviorSubject } from 'rxjs';
import type { UserInput } from './gen/video/coordinator/user_v1/user';

export class StreamVideoWriteableStateStore {
  connectedUserSubject: BehaviorSubject<UserInput | undefined> =
    new BehaviorSubject<UserInput | undefined>(undefined);
}

export class StreamVideoReadOnlyStateStore {
  connectedUser$: Observable<UserInput | undefined>;

  constructor(writeableStateStore: StreamVideoWriteableStateStore) {
    this.connectedUser$ =
      writeableStateStore.connectedUserSubject.asObservable();
  }
}
