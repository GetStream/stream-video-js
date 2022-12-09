import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs';
import {
  distinctUntilChanged,
  map,
  pairwise,
  startWith,
  take,
} from 'rxjs/operators';
import { Call } from './rtc/Call';
import type { UserInput } from './gen/video/coordinator/user_v1/user';
import {
  Call as CallMeta,
  CallDetails,
} from './gen/video/coordinator/call_v1/call';
import type {
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
  StreamVideoParticipantPatch,
} from './rtc/types';
import { StreamVideoParticipantPatches } from './rtc/types';
import type { CallStatsReport } from './stats/types';
import { TrackType } from './gen/video/sfu/models/models';

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
  dominantSpeakerSubject = new BehaviorSubject<
    StreamVideoParticipant | undefined
  >(undefined);
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
  hasOngoingScreenShare$: Observable<boolean>;
  /**
   * The call metadata of the ongoing call
   * The call metadata becomes available before the `activeCall$`
   */
  activeCallMetaSubject: BehaviorSubject<CallMeta | undefined> =
    new BehaviorSubject<CallMeta | undefined>(undefined);

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
        this.setCurrentValue(this.activeCallMetaSubject, undefined);
      }
    });

    this.hasOngoingScreenShare$ = this.activeCallAllParticipantsSubject.pipe(
      map((participants) => {
        return participants.some((p) =>
          p.publishedTracks.includes(TrackType.SCREEN_SHARE),
        );
      }),
      distinctUntilChanged(),
    );
  }

  getCurrentValue<T>(observable: Observable<T>) {
    let value!: T;
    observable.pipe(take(1)).subscribe((v) => (value = v));

    return value;
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
    subject: Subject<T>,
    update: T | ((currentValue: T) => T),
  ) {
    const currentValue = this.getCurrentValue(subject);
    const next =
      // TypeScript needs more context to infer the type of update
      typeof update === 'function' && update instanceof Function
        ? update(currentValue)
        : update;

    subject.next(next);
    return this.getCurrentValue(subject);
  }

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
  ) => {
    const participant = this.findParticipantBySessionId(sessionId);
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
    return this.setCurrentValue(
      this.activeCallAllParticipantsSubject,
      (participants) =>
        participants.map((p) =>
          p.sessionId === sessionId ? updatedParticipant : p,
        ),
    );
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
   * Emits true whenever there is an active screen sharing session within
   * the current call. Useful for displaying a "screen sharing" indicator and
   * switching the layout to a screen sharing layout.
   *
   * The actual screen sharing track isn't exposed here, but can be retrieved
   * from the list of call participants. We also don't want to be limiting
   * to the number of share screen tracks are displayed in a call.
   */
  hasOngoingScreenShare$: Observable<boolean>;

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
  /**
   * The call metadata of the ongoing call
   * The call metadata becomes available before the `activeCall$`
   */
  activeCallMeta$: Observable<CallMeta | undefined> = new Observable<
    CallMeta | undefined
  >(undefined);

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

    this.hasOngoingScreenShare$ = store.hasOngoingScreenShare$;
    this.activeCallMeta$ = store.activeCallMetaSubject.asObservable();
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
