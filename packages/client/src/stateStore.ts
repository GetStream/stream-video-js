import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs';
import {
  distinctUntilChanged,
  map,
  combineLatestWith,
  take,
} from 'rxjs/operators';
import { UserInput } from './gen/video/coordinator/user_v1/user';
import {
  CallAccepted,
  CallCancelled,
  CallCreated,
  CallRejected,
} from './gen/video/coordinator/event_v1/event';
import {
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
  StreamVideoParticipantPatch,
  StreamVideoParticipantPatches,
} from './rtc/types';
import { CallStatsReport } from './stats/types';
import { Call as CallController } from './rtc/Call';
import { TrackType } from './gen/video/sfu/models/models';

export class StreamVideoWriteableStateStore {
  /**
   * A store keeping data of a successfully connected user over WS to the coordinator server.
   */
  connectedUserSubject = new BehaviorSubject<UserInput | undefined>(undefined);
  /**
   * A store that keeps track of all created calls that have not been yet accepted, rejected nor cancelled.
   */
  pendingCallsSubject = new BehaviorSubject<CallCreated[]>([]);
  /**
   * A list of objects describing incoming calls.
   */
  incomingCalls$: Observable<CallCreated[]>;
  /**
   * A list of objects describing calls initiated by the current user (connectedUser).
   */
  outgoingCalls$: Observable<CallCreated[]>;
  /**
   * A store that keeps track of all the notifications describing accepted call.
   */
  acceptedCallSubject = new BehaviorSubject<CallAccepted | undefined>(
    undefined,
  );
  /**
   * A store that keeps track of cancellations and rejections for both incoming and outgoing calls
   */
  hangupNotificationsSubject = new BehaviorSubject<
    (CallRejected | CallCancelled)[]
  >([]);
  /**
   * A store that keeps reference to a call controller instance.
   */
  activeCallSubject = new BehaviorSubject<CallController | undefined>(
    undefined,
  );
  /**
   * All participants of the current call (including the logged-in user).
   */
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
  dominantSpeakerSubject = new BehaviorSubject<
    StreamVideoParticipant | undefined
  >(undefined);
  callStatsReportSubject = new BehaviorSubject<CallStatsReport | undefined>(
    undefined,
  );
  callRecordingInProgressSubject = new ReplaySubject<boolean>(1);
  hasOngoingScreenShare$: Observable<boolean>;

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

    this.incomingCalls$ = this.pendingCallsSubject.pipe(
      combineLatestWith(this.connectedUserSubject),
      map(([pendingCalls, connectedUser]) =>
        pendingCalls.filter(
          (call) => call.call?.createdByUserId !== connectedUser?.id,
        ),
      ),
    );

    this.outgoingCalls$ = this.pendingCallsSubject.pipe(
      combineLatestWith(this.connectedUserSubject),
      map(([pendingCalls, connectedUser]) =>
        pendingCalls.filter(
          (call) => call.call?.createdByUserId === connectedUser?.id,
        ),
      ),
    );

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
        this.setCurrentValue(this.hangupNotificationsSubject, []);
      }
    });

    this.hasOngoingScreenShare$ = this.participantsSubject.pipe(
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
    const participants = this.getCurrentValue(this.participantsSubject);
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
    return this.setCurrentValue(this.participantsSubject, (participants) =>
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
    return this.setCurrentValue(this.participantsSubject, (participants) =>
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
   * A list of cancellations and rejections for both incoming and outgoing calls
   */
  hangupNotifications$: Observable<(CallRejected | CallCancelled)[]>;
  /**
   * The call controller instance representing the call the user attends.
   * The controller instance exposes call metadata as well.
   */
  activeCall$: Observable<CallController | undefined>;
  /**
   * The currently elected dominant speaker in the active call.
   */
  dominantSpeaker$: Observable<StreamVideoParticipant | undefined>;
  /**
   * All participants of the current call (this includes the current user and other participants as well).
   */
  participants$: Observable<
    (StreamVideoParticipant | StreamVideoLocalParticipant)[]
  >;
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

  constructor(store: StreamVideoWriteableStateStore) {
    this.connectedUser$ = store.connectedUserSubject.asObservable();
    this.pendingCalls$ = store.pendingCallsSubject.asObservable();
    this.incomingCalls$ = store.incomingCalls$;
    this.outgoingCalls$ = store.outgoingCalls$;
    this.acceptedCall$ = store.acceptedCallSubject.asObservable();
    this.hangupNotifications$ = store.hangupNotificationsSubject.asObservable();
    this.activeCall$ = store.activeCallSubject.asObservable();
    this.participants$ = store.participantsSubject.asObservable();
    this.localParticipant$ = store.localParticipant$;
    this.remoteParticipants$ = store.remoteParticipants$;
    this.pinnedParticipants$ = store.pinnedParticipants$;
    this.dominantSpeaker$ = store.dominantSpeakerSubject.asObservable();
    this.callStatsReport$ = store.callStatsReportSubject.asObservable();
    this.callRecordingInProgress$ =
      store.callRecordingInProgressSubject.asObservable();
    this.hasOngoingScreenShare$ = store.hasOngoingScreenShare$;
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
