import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs';
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
import type { CallStatsReport } from './stats/types';

export class StreamVideoWriteableStateStore {
  connectedUserSubject = new BehaviorSubject<UserInput | undefined>(undefined);
  incomingRingCallsSubject = new BehaviorSubject<CallMeta[]>([]);
  activeCallSubject = new BehaviorSubject<Call | undefined>(undefined);
  activeRingCallMetaSubject = new ReplaySubject<CallMeta | undefined>(1);
  activeRingCallDetailsSubject = new ReplaySubject<CallDetails | undefined>(1);
  terminatedRingCallMetaSubject = new BehaviorSubject<CallMeta | undefined>(
    undefined,
  );

  activeCallAllParticipantsSubject = new ReplaySubject<
    (StreamVideoParticipant | StreamVideoLocalParticipant)[]
  >(1);
  activeCallLocalParticipantSubject = new BehaviorSubject<
    StreamVideoParticipant | undefined
  >(undefined);
  // FIXME OL: this subject is unused?
  activeCallRemoteParticipantSubject = new BehaviorSubject<
    StreamVideoParticipant[]
  >([]);
  dominantSpeakerSubject = new BehaviorSubject<string | undefined>(undefined);
  callStatsReportSubject = new BehaviorSubject<CallStatsReport | undefined>(
    undefined,
  );
  callRecordingInProgressSubject = new ReplaySubject<boolean>(1);
  terminatedRingCallMeta$: Observable<CallMeta | undefined>;
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
  /**
   * Pinned participants of the current call.
   */
  pinnedParticipants$: Observable<StreamVideoParticipant[]>;

  constructor() {
    this.terminatedRingCallMeta$ = this.activeRingCallMetaSubject.pipe(
      startWith(undefined),
      pairwise(),
      map(([prevValue]) => prevValue),
    );
    this.activeCallLocalParticipant$ =
      this.activeCallAllParticipantsSubject.pipe(
        map(
          (participants) =>
            participants.find(
              (p) => p.isLoggedInUser,
            ) as StreamVideoLocalParticipant,
        ),
      );
    this.activeCallRemoteParticipants$ =
      this.activeCallAllParticipantsSubject.pipe(
        map((participants) => participants.filter((p) => !p.isLoggedInUser)),
      );
    this.pinnedParticipants$ = this.activeCallAllParticipantsSubject.pipe(
      map((participants) => participants.filter((p) => p.isPinned)),
    );

    this.activeCallSubject.subscribe((c) => {
      if (!c) {
        this.setCurrentValue(this.callRecordingInProgressSubject, false);
        this.setCurrentValue(this.activeRingCallMetaSubject, undefined);
        this.setCurrentValue(this.activeRingCallDetailsSubject, undefined);
        this.setCurrentValue(this.activeCallAllParticipantsSubject, []);
      }
    });
  }

  getCurrentValue<T>(observable: Observable<T>) {
    let value!: T;
    observable.pipe(take(1)).subscribe((v) => (value = v));

    return value;
  }

  setCurrentValue<T>(subject: Subject<T>, value: T) {
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
  /**
   * The latest stats report of the current call.
   * When stats gathering is enabled, this observable will emit a new value
   * at a regular (configurable) interval.
   *
   * Consumers of this observable can implement their own batching logic
   * in case they want to show historical stats data.
   */
  callStatsReport$: Observable<CallStatsReport | undefined>;

  /**
   * Emits a boolean indicating whether a call recording is currently in progress.
   */
  callRecordingInProgress$: Observable<boolean>;

  constructor(store: StreamVideoWriteableStateStore) {
    this.connectedUser$ = store.connectedUserSubject.asObservable();
    this.activeCall$ = store.activeCallSubject.asObservable();
    this.activeRingCallMeta$ = store.activeRingCallMetaSubject.asObservable();
    this.activeRingCallDetails$ =
      store.activeRingCallDetailsSubject.asObservable();
    this.incomingRingCalls$ = store.incomingRingCallsSubject.asObservable();
    this.dominantSpeaker$ = store.dominantSpeakerSubject.asObservable();

    this.callStatsReport$ = store.callStatsReportSubject.asObservable();
    this.callRecordingInProgress$ =
      store.callRecordingInProgressSubject.asObservable();
    this.activeCallAllParticipants$ =
      store.activeCallAllParticipantsSubject.asObservable();
    this.activeCallRemoteParticipants$ = store.activeCallRemoteParticipants$;
    this.activeCallLocalParticipant$ = store.activeCallLocalParticipant$;
    this.terminatedRingCallMeta$ = store.terminatedRingCallMeta$;
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
