import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs';
import { combineLatestWith, map, take } from 'rxjs/operators';
import { UserInput } from '../gen/video/coordinator/user_v1/user';
import {
  CallAccepted,
  CallCreated,
  CallEnded,
  CallRejected,
} from '../gen/video/coordinator/event_v1/event';
import {
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
} from '../rtc/types';
import { CallStatsReport } from '../stats/types';
import { Call as CallController } from '../rtc/Call';

type UserId = string;

export class StreamVideoWriteableStateStore2 {
  connectedUserSubject = new BehaviorSubject<UserInput | undefined>(undefined); // === connectedUserSubject
  pendingCallsSubject = new BehaviorSubject<CallCreated[]>([]);
  acceptedCallSubject = new BehaviorSubject<CallAccepted | undefined>(
    undefined,
  );
  activeCallSubject = new BehaviorSubject<CallController | undefined>(
    undefined,
  );
  rejectedCallNotificationsSubject = new BehaviorSubject<CallRejected[]>([]);
  participantsSubject = new ReplaySubject<
    (StreamVideoParticipant | StreamVideoLocalParticipant)[]
  >(1);
  /**
   * Remote participants of the current call (this includes every participant except the logged-in user).
   */
  remoteParticipants$: Observable<StreamVideoParticipant[]>;
  /**
   * The local participant of the current call (the logged-in user).
   */
  localParticipant$: Observable<StreamVideoLocalParticipant | undefined>;
  /**
   * Pinned participants of the current call.
   */
  pinnedParticipants$: Observable<StreamVideoParticipant[]>;
  dominantSpeakerSubject = new BehaviorSubject<UserId | undefined>(undefined);
  callStatsReportSubject = new BehaviorSubject<CallStatsReport | undefined>(
    undefined,
  );
  callRecordingInProgressSubject = new ReplaySubject<boolean>(1);

  constructor() {
    this.localParticipant$ = this.participantsSubject.pipe(
      map((participants) => participants.find((p) => p.isLoggedInUser)),
    );
    this.remoteParticipants$ = this.participantsSubject.pipe(
      map((participants) => participants.filter((p) => !p.isLoggedInUser)),
    );
    this.pinnedParticipants$ = this.participantsSubject.pipe(
      map((participants) => participants.filter((p) => p.isPinned)),
    );

    this.acceptedCallSubject
      .pipe(combineLatestWith(this.connectedUserSubject))
      .subscribe(([acceptedCall, connectedUser]) => {
        if (acceptedCall?.senderUserId === connectedUser?.id) {
          this.setCurrentValue(
            this.pendingCallsSubject,
            this.getCurrentValue(this.pendingCallsSubject).filter(
              (pendingCall) =>
                pendingCall.call?.callCid !== acceptedCall?.call?.callCid,
            ),
          );
        }
      });

    this.activeCallSubject.subscribe((callController) => {
      if (callController) {
        this.setCurrentValue(
          this.pendingCallsSubject,
          this.getCurrentValue(this.pendingCallsSubject).filter(
            (call) => call.call?.callCid !== callController.data.call?.callCid,
          ),
        );
        this.setCurrentValue(this.acceptedCallSubject, undefined);
      } else {
        this.setCurrentValue(this.callRecordingInProgressSubject, false);
        this.setCurrentValue(this.participantsSubject, []);
        this.setCurrentValue(this.rejectedCallNotificationsSubject, []);
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

  asReadOnlyStore = () => {
    return new StreamVideoReadOnlyStateStore2(this);
  };

  private pushUnique<T>(
    subject: Subject<T[]>,
    value: T,
    predicate: (item: T) => boolean,
  ) {
    const existingValues = this.getCurrentValue(subject);
    const valuePresent = existingValues.find(predicate);
    if (!valuePresent) {
      this.setCurrentValue(subject, [...existingValues, value]);
    }
  }

  private removeUnique<T>(
    subject: Subject<T[]>,
    predicate: (item: T) => boolean,
  ) {
    const existingValues = this.getCurrentValue(subject);
    const keptValues = existingValues.filter(predicate);
    if (existingValues.length > keptValues.length) {
      this.setCurrentValue(subject, keptValues);
    }
  }

  addCall<T extends CallCreated | CallAccepted | CallEnded>(
    subject: BehaviorSubject<T[]>,
    call: T,
  ) {
    this.pushUnique(
      subject,
      call,
      (c) => c.call?.callCid === call.call?.callCid,
    );
  }

  removeCall<T extends CallCreated | CallAccepted>(
    subject: BehaviorSubject<T[]>,
    call: Partial<T>,
  ) {
    this.removeUnique(subject, (c) => c.call?.callCid === call.call?.callCid);
  }

  addParticipant(
    participant: StreamVideoParticipant | StreamVideoLocalParticipant,
  ) {
    this.pushUnique(
      this.participantsSubject,
      participant,
      (p) => p.sessionId === participant.sessionId,
    );
  }

  removeParticipant(
    participant: StreamVideoParticipant | StreamVideoLocalParticipant,
  ) {
    this.removeUnique(
      this.participantsSubject,
      (p) => p.sessionId === participant.sessionId,
    );
  }
}

/**
 * A reactive store that exposes state variables in a reactive manner - you can subscribe to changes of the different state variables. This central store contains all the state variables related to [`StreamVideoClient`](./StreamVideClient.md) and [`Call`](./Call.md).
 *
 */
export class StreamVideoReadOnlyStateStore2 {
  /**
   * Data describing a user successfully connected over WS to coordinator server.
   */
  connectedUser$: Observable<UserInput | undefined>;
  /**
   * A list of objects describing all created calls that have not been yet accepted, rejected nor cancelled.
   */
  pendingCalls$: Observable<CallCreated[]>;
  /**
   * A list of objects describing calls initiated by the current user (connectedUser).
   */
  outgoingCalls$: Observable<CallCreated[]>;
  /**
   * A list of objects describing incoming calls.
   */
  incomingCalls$: Observable<CallCreated[]>;
  /**
   * The call data describing an incoming call accepted by a participant.
   * Serves as a flag decide, whether an incoming call should be joined.
   */
  acceptedCall$: Observable<CallAccepted | undefined>;
  /**
   * A list of CallRejected objects representing call members who have rejected
   * to participate in the call.
   */
  rejectedCallNotifications$: Observable<CallAccepted[]>;
  /**
   * The call the current user participant is in.
   */
  activeCall$: Observable<CallController | undefined>;
  /**
   * The ID of the currently speaking user.
   */
  dominantSpeaker$: Observable<UserId | undefined>;
  /**
   * All participants of the current call (this includes the current user and other participants as well).
   */
  participants$: Observable<StreamVideoParticipant[]>;
  /**
   * The local participant of the current call (the logged-in user).
   */
  localParticipant$: Observable<StreamVideoLocalParticipant | undefined>;
  /**
   * Remote participants of the current call (this includes every participant except the logged-in user).
   */
  remoteParticipants$: Observable<StreamVideoParticipant[]>;
  /**
   * Pinned participants of the current call.
   */
  pinnedParticipants$: Observable<StreamVideoParticipant[]>;
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

  constructor(store: StreamVideoWriteableStateStore2) {
    this.connectedUser$ = store.connectedUserSubject.asObservable();
    this.pendingCalls$ = store.pendingCallsSubject.asObservable();
    this.incomingCalls$ = this.pendingCalls$.pipe(
      combineLatestWith(this.connectedUser$),
      map(([pendingCalls, connectedUser]) =>
        pendingCalls.filter(
          (call) => call.call?.createdByUserId !== connectedUser?.id,
        ),
      ),
    );
    this.outgoingCalls$ = this.pendingCalls$.pipe(
      combineLatestWith(this.connectedUser$),
      map(([pendingCalls, connectedUser]) =>
        pendingCalls.filter(
          (call) => call.call?.createdByUserId === connectedUser?.id,
        ),
      ),
    );
    this.acceptedCall$ = store.acceptedCallSubject.asObservable();
    this.rejectedCallNotifications$ =
      store.rejectedCallNotificationsSubject.asObservable();
    this.activeCall$ = store.activeCallSubject.asObservable();
    this.participants$ = store.participantsSubject.asObservable();
    this.localParticipant$ = store.localParticipant$;
    this.remoteParticipants$ = store.remoteParticipants$;
    this.pinnedParticipants$ = store.pinnedParticipants$;
    this.dominantSpeaker$ = store.dominantSpeakerSubject.asObservable();
    this.callStatsReport$ = store.callStatsReportSubject.asObservable();
    this.callRecordingInProgress$ =
      store.callRecordingInProgressSubject.asObservable();
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
