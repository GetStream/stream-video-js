import { Observable, BehaviorSubject, take } from 'rxjs';
import { Call } from './rtc/Call';
import type { UserInput } from './gen/video/coordinator/user_v1/user';
import { StreamVideoParticipant } from './rtc/types';

export class StreamVideoWriteableStateStore {
  connectedUserSubject: BehaviorSubject<UserInput | undefined> =
    new BehaviorSubject<UserInput | undefined>(undefined);
  pendingCallsSubject: BehaviorSubject<Call[]> = new BehaviorSubject<Call[]>(
    [],
  );
  activeCallSubject: BehaviorSubject<Call | undefined> = new BehaviorSubject<
    Call | undefined
  >(undefined);
  activeCallParticipantsSubject: BehaviorSubject<StreamVideoParticipant[]> =
    new BehaviorSubject<StreamVideoParticipant[]>([]);

  getCurrentValue<T>(subject: BehaviorSubject<T>) {
    return subject.getValue();
  }

  setCurrentValue<T>(subject: BehaviorSubject<T>, value: T) {
    subject.next(value);
  }
}

export class StreamVideoReadOnlyStateStore {
  connectedUser$: Observable<UserInput | undefined>;
  activeCall$: Observable<Call | undefined>;
  activeCallParticipants$: Observable<StreamVideoParticipant[]>;
  pendingCalls$: Observable<Call[]>;

  constructor(writeableStateStore: StreamVideoWriteableStateStore) {
    this.connectedUser$ =
      writeableStateStore.connectedUserSubject.asObservable();
    this.activeCall$ = writeableStateStore.activeCallSubject.asObservable();
    this.activeCallParticipants$ =
      writeableStateStore.activeCallParticipantsSubject.asObservable();
    this.pendingCalls$ = writeableStateStore.pendingCallsSubject.asObservable();
  }

  getCurrentValue<T>(observable: Observable<T>) {
    let value!: T;
    observable.pipe(take(1)).subscribe((v) => (value = v));

    return value;
  }
}
