import { BehaviorSubject, Observable } from 'rxjs';
import { combineLatestWith, map, take } from 'rxjs/operators';
import { UserInput } from '../gen/video/coordinator/user_v1/user';
import {
  CallAccepted,
  CallCreated,
  CallEnded,
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
  participantsSubject = new BehaviorSubject<
    (StreamVideoParticipant | StreamVideoLocalParticipant)[]
  >([]);
  dominantSpeakerSubject = new BehaviorSubject<UserId | undefined>(undefined);
  callStatsReportSubject = new BehaviorSubject<CallStatsReport | undefined>(
    undefined,
  );
  callRecordingInProgressSubject = new BehaviorSubject<boolean>(false);

  getCurrentValue<T>(subject: BehaviorSubject<T>) {
    return subject.getValue();
  }

  setCurrentValue<T>(subject: BehaviorSubject<T>, value: T) {
    subject.next(value);
  }

  asReadOnlyStore = () => {
    return new StreamVideoReadOnlyStateStore2(this);
  };

  private pushUnique<T>(
    subject: BehaviorSubject<T[]>,
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
    subject: BehaviorSubject<T[]>,
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

export class StreamVideoReadOnlyStateStore2 {
  /**
   * Data describing a user successfully connected over WS to coordinator server.
   */
  connectedUser$: Observable<UserInput | undefined>;
  pendingCalls$: Observable<CallCreated[]>;
  outgoingCalls$: Observable<CallCreated[]>;
  incomingCalls$: Observable<CallCreated[]>;
  acceptedCall$: Observable<CallAccepted | undefined>;
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
    this.outgoingCalls$ = this.pendingCalls$.pipe(
      combineLatestWith(this.connectedUser$),
      map(([pendingCalls, connectedUser]) =>
        pendingCalls.filter(
          (call) => call.call?.createdByUserId === connectedUser?.id,
        ),
      ),
    );
    this.incomingCalls$ = this.pendingCalls$.pipe(
      combineLatestWith(this.connectedUser$),
      map(([pendingCalls, connectedUser]) =>
        pendingCalls.filter(
          (call) => call.call?.createdByUserId !== connectedUser?.id,
        ),
      ),
    );
    this.acceptedCall$ = store.acceptedCallSubject.asObservable();
    this.activeCall$ = store.activeCallSubject.asObservable();
    this.dominantSpeaker$ = store.dominantSpeakerSubject.asObservable();
    this.participants$ = store.participantsSubject.asObservable();
    this.localParticipant$ = this.participants$.pipe(
      map((participants) =>
        participants.find((p) => {
          console.log('localParticipant$', p);
          return p.isLoggedInUser;
        }),
      ),
    );
    this.remoteParticipants$ = this.participants$.pipe(
      map((participants) =>
        participants.filter((p) => {
          console.log('remoteParticipants$', p);
          return !p.isLoggedInUser;
        }),
      ),
    );
    this.callStatsReport$ = store.callStatsReportSubject.asObservable();
    this.callRecordingInProgress$ =
      store.callRecordingInProgressSubject.asObservable();
  }

  getCurrentValue<T>(observable: Observable<T>) {
    let value!: T;
    observable.pipe(take(1)).subscribe((v) => (value = v));

    return value;
  }
}
