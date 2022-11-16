import { BehaviorSubject, Observable } from 'rxjs';
import { take, map } from 'rxjs/operators';
import { Call } from './rtc/Call';
import type { UserInput } from './gen/video/coordinator/user_v1/user';
import { Call as CallMeta } from './gen/video/coordinator/call_v1/call';
import type { StreamVideoParticipant } from './rtc/types';

export class StreamVideoWriteableStateStore {
  connectedUserSubject = new BehaviorSubject<UserInput | undefined>(undefined);
  incomingRingCallsSubject = new BehaviorSubject<CallMeta[]>([]);
  activeCallSubject = new BehaviorSubject<Call | undefined>(undefined);
  activeRingCallSubject = new BehaviorSubject<CallMeta | undefined>(undefined);
  callSubject = new BehaviorSubject<CallMeta | undefined>(undefined);
  outgoingCallSubject = new BehaviorSubject<CallMeta | undefined>(undefined);
  rejectedRingCallSubject = new BehaviorSubject<CallMeta | undefined>(
    undefined,
  );

  activeCallAllParticipantsSubject = new BehaviorSubject<
    StreamVideoParticipant[]
  >([]);
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
  activeRingCall$: Observable<CallMeta | undefined>;
  incomingRingCalls$: Observable<CallMeta[]>;
  dominantSpeaker$: Observable<string | undefined>;
  call$: Observable<CallMeta | undefined>;
  rejectedRingCall$: Observable<CallMeta | undefined>;

  activeCallAllParticipants$: Observable<StreamVideoParticipant[]>;
  activeCallRemoteParticipants$: Observable<StreamVideoParticipant[]>;
  activeCallLocalParticipant$: Observable<StreamVideoParticipant | undefined>;

  constructor(writeableStateStore: StreamVideoWriteableStateStore) {
    this.connectedUser$ =
      writeableStateStore.connectedUserSubject.asObservable();
    this.activeCall$ = writeableStateStore.activeCallSubject.asObservable();
    this.activeRingCall$ =
      writeableStateStore.activeRingCallSubject.asObservable();
    this.incomingRingCalls$ =
      writeableStateStore.incomingRingCallsSubject.asObservable();
    this.dominantSpeaker$ =
      writeableStateStore.dominantSpeakerSubject.asObservable();
    this.call$ = writeableStateStore.callSubject.asObservable();
    this.rejectedRingCall$ =
      writeableStateStore.rejectedRingCallSubject.asObservable();
    this.activeCallAllParticipants$ =
      writeableStateStore.activeCallAllParticipantsSubject.asObservable();
    this.activeCallLocalParticipant$ = this.activeCallAllParticipants$.pipe(
      map((participants) => participants.find((p) => p.isLoggedInUser)),
    );
    this.activeCallRemoteParticipants$ = this.activeCallAllParticipants$.pipe(
      map((participants) => participants.filter((p) => !p.isLoggedInUser)),
    );
  }

  getCurrentValue<T>(observable: Observable<T>) {
    let value!: T;
    observable.pipe(take(1)).subscribe((v) => (value = v));

    return value;
  }
}
