import { BehaviorSubject, Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
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
import { ActiveCall } from './types';

type UserId = string;

export class StreamVideoWriteableStateStore2 {
  connectedUserSubject = new BehaviorSubject<UserInput | undefined>(undefined); // === connectedUserSubject
  pendingCallsSubject = new BehaviorSubject<CallCreated[]>([]);
  // todo: MC:  add call data directly to CallCOntroller
  activeCallSubject = new BehaviorSubject<ActiveCall | undefined>(undefined);
  participantsSubject = new BehaviorSubject<
    (StreamVideoParticipant | StreamVideoLocalParticipant)[]
  >([]);
  dominantSpeakerSubject = new BehaviorSubject<UserId | undefined>(undefined);

  getCurrentValue<T>(subject: BehaviorSubject<T>) {
    return subject.getValue();
  }

  setCurrentValue<T>(subject: BehaviorSubject<T>, value: T) {
    subject.next(value);
  }

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

export class StreamVideoReadableStateStore2 {
  connectedUser$: Observable<UserInput | undefined>;
  pendingCalls$: Observable<CallCreated[]>;
  outgoingCalls$: Observable<CallCreated[]>;
  activeCall$: Observable<ActiveCall | undefined>;
  dominantSpeaker$: Observable<UserId | undefined>;
  participants$: Observable<StreamVideoParticipant[]>;
  localParticipant$: Observable<StreamVideoLocalParticipant | undefined>;
  remoteParticipants$: Observable<StreamVideoParticipant[]>;

  constructor(writeableStateStore: StreamVideoWriteableStateStore2) {
    this.connectedUser$ =
      writeableStateStore.connectedUserSubject.asObservable();
    this.pendingCalls$ = writeableStateStore.pendingCallsSubject.asObservable();
    this.outgoingCalls$ = this.pendingCalls$.pipe(
      map((pendingCalls) => {
        const me = this.getCurrentValue(this.connectedUser$);
        return pendingCalls.filter(
          (call) => call.call?.createdByUserId === me?.id,
        );
      }),
    );
    this.activeCall$ = writeableStateStore.activeCallSubject.asObservable();
    this.dominantSpeaker$ =
      writeableStateStore.dominantSpeakerSubject.asObservable();
    this.participants$ = writeableStateStore.participantsSubject.asObservable();
    this.localParticipant$ = this.participants$.pipe(
      map((participants) => participants.find((p) => p.isLoggedInUser)),
    );
    this.remoteParticipants$ = this.participants$.pipe(
      map((participants) => participants.filter((p) => !p.isLoggedInUser)),
    );
  }

  getCurrentValue<T>(observable: Observable<T>) {
    let value!: T;
    observable.pipe(take(1)).subscribe((v) => (value = v));

    return value;
  }
}
