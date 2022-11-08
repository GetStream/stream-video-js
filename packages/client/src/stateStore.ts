import { BehaviorSubject, Observable } from 'rxjs';
import { take, map, distinctUntilChanged } from 'rxjs/operators';
import { Call } from './rtc/Call';
import type { UserInput } from './gen/video/coordinator/user_v1/user';
import type { CallParticipants, StreamVideoParticipant } from './rtc/types';

export class StreamVideoWriteableStateStore {
  connectedUserSubject = new BehaviorSubject<UserInput | undefined>(undefined);
  pendingCallsSubject = new BehaviorSubject<Call[]>([]);
  activeCallSubject = new BehaviorSubject<Call | undefined>(undefined);

  activeCallParticipantsSubject = new BehaviorSubject<CallParticipants>({});
  dominantSpeakerSubject = new BehaviorSubject<string | undefined>(undefined);

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
  pendingCalls$: Observable<Call[]>;
  dominantSpeaker$: Observable<string | undefined>;
  activeCallParticipants$: Observable<CallParticipants>;
  remoteParticipants$: Observable<StreamVideoParticipant[]>;
  localParticipant$: Observable<StreamVideoParticipant | undefined>;

  constructor(writeableStateStore: StreamVideoWriteableStateStore) {
    this.connectedUser$ =
      writeableStateStore.connectedUserSubject.asObservable();
    this.activeCall$ = writeableStateStore.activeCallSubject.asObservable();
    this.pendingCalls$ = writeableStateStore.pendingCallsSubject.asObservable();
    this.dominantSpeaker$ =
      writeableStateStore.dominantSpeakerSubject.asObservable();

    this.activeCallParticipants$ =
      writeableStateStore.activeCallParticipantsSubject.asObservable();

    this.localParticipant$ = this.activeCallParticipants$.pipe(
      map((participants) =>
        Object.values(participants).find((p) => p.isLoggedInUser),
      ),
      distinctUntilChanged(),
    );

    this.remoteParticipants$ = this.activeCallParticipants$.pipe(
      map((participants) =>
        Object.values(participants).filter((p) => !p.isLoggedInUser),
      ),
      distinctUntilChanged(),
    );
  }

  getCurrentValue<T>(observable: Observable<T>) {
    let value!: T;
    observable.pipe(take(1)).subscribe((v) => (value = v));

    return value;
  }
}
