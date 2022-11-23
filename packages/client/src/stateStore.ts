import { BehaviorSubject, Observable } from 'rxjs';
import { take, map, pairwise, startWith } from 'rxjs/operators';
import { Call } from './rtc/Call';
import type { UserInput } from './gen/video/coordinator/user_v1/user';
import {
  Call as CallMeta,
  CallDetails,
} from './gen/video/coordinator/call_v1/call';
import type {
  StreamVideoParticipant,
  StreamVideoLocalParticipant,
} from './rtc/types';

export class StreamVideoWriteableStateStore {
  connectedUserSubject = new BehaviorSubject<UserInput | undefined>(undefined);
  incomingRingCallsSubject = new BehaviorSubject<CallMeta[]>([]);
  activeCallSubject = new BehaviorSubject<Call | undefined>(undefined);
  activeRingCallMetaSubject = new BehaviorSubject<CallMeta | undefined>(
    undefined,
  );
  activeRingCallDetailsSubject = new BehaviorSubject<CallDetails | undefined>(
    undefined,
  );
  terminatedRingCallMetaSubject = new BehaviorSubject<CallMeta | undefined>(
    undefined,
  );

  activeCallAllParticipantsSubject = new BehaviorSubject<
    (StreamVideoParticipant | StreamVideoLocalParticipant)[]
  >([]);
  activeCallLocalParticipantSubject = new BehaviorSubject<
    StreamVideoParticipant | undefined
  >(undefined);
  activeCallRemoteParticipantSubject = new BehaviorSubject<
    StreamVideoParticipant[]
  >([]);
  dominantSpeakerSubject = new BehaviorSubject<string | undefined>(undefined);
  callRecordingInProgressSubject = new BehaviorSubject<boolean>(false);

  getCurrentValue<T>(subject: BehaviorSubject<T>) {
    return subject.getValue();
  }

  setCurrentValue<T>(subject: BehaviorSubject<T>, value: T) {
    subject.next(value);
  }
}

/**
 * A reactive store that exposes state variables in a reactive manner - you can subscribe to changes of the different state variables. This central store contains all the state variables related to [`StreamVideoClient`](./StreamVideClient.md) and [`Call`](./Call.md).
 *
 */
export class StreamVideoReadOnlyStateStore {
  /**
   * The currently connected user.
   *
   */
  connectedUser$: Observable<UserInput | undefined>;
  /**
   * The call the current user participant is in.
   */
  activeCall$: Observable<Call | undefined>;
  activeRingCallMeta$: Observable<CallMeta | undefined>;
  activeRingCallDetails$: Observable<CallDetails | undefined>;
  incomingRingCalls$: Observable<CallMeta[]>;
  /**
   * The ID of the currently speaking user.
   */
  dominantSpeaker$: Observable<string | undefined>;
  terminatedRingCallMeta$: Observable<CallMeta | undefined>;

  /**
   * All participants of the current call (this includes the current user and other participants as well).
   */
  activeCallAllParticipants$: Observable<
    (StreamVideoParticipant | StreamVideoLocalParticipant)[]
  >;
  /**
   * Remote participants of the current call (this includes every participant except the logged-in user).
   */
  activeCallRemoteParticipants$: Observable<StreamVideoParticipant[]>;
  /**
   * The local participant of the current call (the logged-in user).
   */
  activeCallLocalParticipant$: Observable<
    StreamVideoLocalParticipant | undefined
  >;
  callRecordingInProgress$: Observable<boolean>;

  constructor(writeableStateStore: StreamVideoWriteableStateStore) {
    this.connectedUser$ =
      writeableStateStore.connectedUserSubject.asObservable();
    this.activeCall$ = writeableStateStore.activeCallSubject.asObservable();
    this.activeRingCallMeta$ =
      writeableStateStore.activeRingCallMetaSubject.asObservable();
    this.activeRingCallDetails$ =
      writeableStateStore.activeRingCallDetailsSubject.asObservable();
    this.incomingRingCalls$ =
      writeableStateStore.incomingRingCallsSubject.asObservable();
    this.dominantSpeaker$ =
      writeableStateStore.dominantSpeakerSubject.asObservable();
    this.terminatedRingCallMeta$ = this.activeRingCallMeta$.pipe(
      startWith(undefined),
      pairwise(),
      map(([prevValue]) => prevValue),
    );
    this.activeCallAllParticipants$ =
      writeableStateStore.activeCallAllParticipantsSubject.asObservable();
    this.activeCallLocalParticipant$ = this.activeCallAllParticipants$.pipe(
      map((participants) => participants.find((p) => p.isLoggedInUser)),
    );
    this.activeCallRemoteParticipants$ = this.activeCallAllParticipants$.pipe(
      map((participants) => participants.filter((p) => !p.isLoggedInUser)),
    );
    this.callRecordingInProgress$ =
      writeableStateStore.callRecordingInProgressSubject.asObservable();
  }

  /**
   * This method allows you the get the current value of a state variable.
   * @param observable
   * @returns
   */
  getCurrentValue<T>(observable: Observable<T>) {
    let value!: T;
    observable.pipe(take(1)).subscribe((v) => (value = v));

    return value;
  }
}
