import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { take, map } from 'rxjs/operators';
import { Call } from './rtc/Call';
import type { UserInput } from './gen/video/coordinator/user_v1/user';
import type {
  StreamVideoParticipant,
  StreamVideoLocalParticipant,
} from './rtc/types';
import type { CallStatsReport } from './stats/types';

export class StreamVideoWriteableStateStore {
  connectedUserSubject = new BehaviorSubject<UserInput | undefined>(undefined);
  pendingCallsSubject = new BehaviorSubject<Call[]>([]);
  activeCallSubject = new BehaviorSubject<Call | undefined>(undefined);

  activeCallAllParticipantsSubject = new BehaviorSubject<
    (StreamVideoParticipant | StreamVideoLocalParticipant)[]
  >([]);
  dominantSpeakerSubject = new BehaviorSubject<string | undefined>(undefined);
  participantStatsSubject = new BehaviorSubject<CallStatsReport | undefined>(
    undefined,
  );

  getCurrentValue<T>(subject: BehaviorSubject<T>) {
    return subject.getValue();
  }

  setCurrentValue<T>(subject: Subject<T>, value: T) {
    subject.next(value);
  }

  asReadOnlyStore = () => {
    return new StreamVideoReadOnlyStateStore(this);
  };
}

export class StreamVideoReadOnlyStateStore {
  connectedUser$: Observable<UserInput | undefined>;
  activeCall$: Observable<Call | undefined>;
  pendingCalls$: Observable<Call[]>;
  dominantSpeaker$: Observable<string | undefined>;

  activeCallAllParticipants$: Observable<
    (StreamVideoParticipant | StreamVideoLocalParticipant)[]
  >;
  activeCallRemoteParticipants$: Observable<StreamVideoParticipant[]>;
  activeCallLocalParticipant$: Observable<
    StreamVideoLocalParticipant | undefined
  >;

  participantStats$: Observable<CallStatsReport | undefined>;

  constructor(store: StreamVideoWriteableStateStore) {
    this.connectedUser$ = store.connectedUserSubject.asObservable();
    this.activeCall$ = store.activeCallSubject.asObservable();
    this.pendingCalls$ = store.pendingCallsSubject.asObservable();
    this.dominantSpeaker$ = store.dominantSpeakerSubject.asObservable();

    this.activeCallAllParticipants$ =
      store.activeCallAllParticipantsSubject.asObservable();
    this.activeCallLocalParticipant$ = this.activeCallAllParticipants$.pipe(
      map((participants) => participants.find((p) => p.isLoggedInUser)),
    );
    this.activeCallRemoteParticipants$ = this.activeCallAllParticipants$.pipe(
      map((participants) => participants.filter((p) => !p.isLoggedInUser)),
    );

    this.participantStats$ = store.participantStatsSubject.asObservable();
  }

  getCurrentValue<T>(observable: Observable<T>) {
    let value!: T;
    observable.pipe(take(1)).subscribe((v) => (value = v));

    return value;
  }
}
