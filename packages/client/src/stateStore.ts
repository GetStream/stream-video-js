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
  StreamVideoParticipantPatch,
} from './rtc/types';
import type { CallStatsReport } from './stats/types';
import { StreamVideoParticipantPatches } from './rtc/types';

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
  // FIXME OL: this subject is unused?
  activeCallRemoteParticipantSubject = new BehaviorSubject<
    StreamVideoParticipant[]
  >([]);
  dominantSpeakerSubject = new BehaviorSubject<
    StreamVideoParticipant | undefined
  >(undefined);
  callStatsReportSubject = new BehaviorSubject<CallStatsReport | undefined>(
    undefined,
  );
  callRecordingInProgressSubject = new BehaviorSubject<boolean>(false);

  getCurrentValue<T>(subject: BehaviorSubject<T>) {
    return subject.getValue();
  }

  /**
   * Updates the value of the provided Subject.
   * An `update` can either be a new value or a function which takes
   * the current value and returns a new value.
   *
   * @param subject the subject to update.
   * @param update the update to apply to the subject.
   * @return the updated value.
   */
  setCurrentValue<T>(
    subject: BehaviorSubject<T>,
    update: T | ((currentValue: T) => T),
  ) {
    const currentValue = subject.getValue();
    const next =
      // TypeScript needs more context to infer the type of update
      typeof update === 'function' && update instanceof Function
        ? update(currentValue)
        : update;

    subject.next(next);
    return subject.getValue();
  }

  asReadOnlyStore = () => {
    return new StreamVideoReadOnlyStateStore(this);
  };

  /**
   * Will try to find the participant with the given sessionId in the active call.
   *
   * @param sessionId the sessionId of the participant to find.
   * @returns the participant with the given sessionId or undefined if not found.
   */
  findParticipantBySessionId = (
    sessionId: string,
  ): StreamVideoParticipant | undefined => {
    const participants = this.getCurrentValue(
      this.activeCallAllParticipantsSubject,
    );
    return participants.find((p) => p.sessionId === sessionId);
  };

  /**
   * Updates a participant in the active call identified by the given `sessionId`.
   * If the participant can't be found, this operation is no-op.
   *
   * @param sessionId the session ID of the participant to update.
   * @param patch the patch to apply to the participant.
   * @returns the updated participant or `undefined` if the participant couldn't be found.
   */
  updateParticipant = (
    sessionId: string,
    patch:
      | StreamVideoParticipantPatch
      | ((p: StreamVideoParticipant) => StreamVideoParticipantPatch),
  ): StreamVideoParticipant | StreamVideoLocalParticipant | undefined => {
    const participants = this.getCurrentValue(
      this.activeCallAllParticipantsSubject,
    );
    const participant = participants.find((p) => p.sessionId === sessionId);
    if (!participant) {
      console.warn(`Participant with sessionId ${sessionId} not found`);
      return;
    }

    const thePatch = typeof patch === 'function' ? patch(participant) : patch;
    const updatedParticipant:
      | StreamVideoParticipant
      | StreamVideoLocalParticipant = {
      // FIXME OL: this is not a deep merge, we might want to revisit this
      ...participant,
      ...thePatch,
    };
    this.setCurrentValue(
      this.activeCallAllParticipantsSubject,
      participants.map((p) =>
        p.sessionId === sessionId ? updatedParticipant : p,
      ),
    );

    return updatedParticipant;
  };

  /**
   * Updates all participants in the active call whose session ID is in the given `sessionIds`.
   * If no patch are provided, this operation is no-op.
   *
   * @param patch the patch to apply to the participants.
   * @returns all participants, with all patch applied.
   */
  updateParticipants = (patch: StreamVideoParticipantPatches) => {
    if (Object.keys(patch).length === 0) {
      return;
    }
    return this.setCurrentValue(
      this.activeCallAllParticipantsSubject,
      (participants) =>
        participants.map((p) => {
          const thePatch = patch[p.sessionId];
          if (thePatch) {
            return {
              ...p,
              ...thePatch,
            };
          }
          return p;
        }),
    );
  };
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
   * The currently elected dominant speaker in the active call.
   */
  dominantSpeaker$: Observable<StreamVideoParticipant | undefined>;
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
    this.terminatedRingCallMeta$ = this.activeRingCallMeta$.pipe(
      startWith(undefined),
      pairwise(),
      map(([prevValue]) => prevValue),
    );
    this.activeCallAllParticipants$ =
      store.activeCallAllParticipantsSubject.asObservable();
    this.activeCallLocalParticipant$ = this.activeCallAllParticipants$.pipe(
      map((participants) => participants.find((p) => p.isLoggedInUser)),
    );
    this.activeCallRemoteParticipants$ = this.activeCallAllParticipants$.pipe(
      map((participants) => participants.filter((p) => !p.isLoggedInUser)),
    );

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
