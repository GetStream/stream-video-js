import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import * as RxUtils from './rxUtils';
import {
  isStreamVideoLocalParticipant,
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
  StreamVideoParticipantPatch,
  StreamVideoParticipantPatches,
} from '../rtc/types';
import { CallStatsReport } from '../stats/types';
import {
  CallRecording,
  CallResponse,
  MemberResponse,
  PermissionRequestEvent,
} from '../gen/coordinator';
import { TrackType } from '../gen/video/sfu/models/models';
import { Comparator } from '../sorting';
import * as SortingPreset from '../sorting/presets';

/**
 * Represents the state of the current call.
 */
export enum CallingState {
  /**
   * The call is in an idle state.
   */
  IDLE = 'idle',

  /**
   * The call is in the process of joining.
   */
  JOINING = 'joining',

  /**
   * The call is currently active.
   */
  JOINED = 'joined',

  /**
   * The call has been left.
   */
  LEFT = 'left',

  /**
   * The call is in the process of reconnecting.
   */
  RECONNECTING = 'reconnecting',

  /**
   * The call has failed to reconnect.
   */
  RECONNECTING_FAILED = 'reconnecting-failed',

  /**
   * The call is in offline mode.
   */
  OFFLINE = 'offline',
}

/**
 * Holds the state of the current call.
 * @react You don't have to use this class directly, as we are exposing the state through Hooks.
 */
export class CallState {
  /**
   * The raw call metadata object, as defined on the backend.
   *
   * @internal
   */
  private metadataSubject = new BehaviorSubject<CallResponse | undefined>(
    undefined,
  );

  /**
   * The list of members of the current call.
   *
   * @internal
   */
  private membersSubject = new BehaviorSubject<MemberResponse[]>([]);

  /**
   * The calling state.
   *
   * @internal
   */
  private callingStateSubject = new BehaviorSubject<CallingState>(
    CallingState.IDLE,
  );

  /**
   * All participants of the current call (including the logged-in user).
   *
   * @internal
   */
  private participantsSubject = new BehaviorSubject<
    (StreamVideoParticipant | StreamVideoLocalParticipant)[]
  >([]);

  /**
   * The latest stats report of the current call.
   * When stats gathering is enabled, this observable will emit a new value
   * at a regular (configurable) interval.
   *
   * Consumers of this observable can implement their own batching logic
   * in case they want to show historical stat data.
   *
   * @internal
   */
  private callStatsReportSubject = new BehaviorSubject<
    CallStatsReport | undefined
  >(undefined);

  /**
   * Emits a boolean indicating whether a call recording is currently in progress.
   *
   * @internal
   */
  // FIXME OL: might be derived from `this.call.recording`.
  private callRecordingInProgressSubject = new BehaviorSubject<boolean>(false);

  /**
   * Emits a list of details about recordings performed during the active call
   */
  private callRecordingListSubject = new BehaviorSubject<CallRecording[]>([]);

  /**
   * Emits the latest call permission request sent by any participant of the
   * active call. Or `undefined` if there is no active call or if the current
   * user doesn't have the necessary permission to handle these events.
   *
   * @internal
   */
  private callPermissionRequestSubject = new BehaviorSubject<
    PermissionRequestEvent | undefined
  >(undefined);

  // Derived state
  /**
   * All participants of the current call (this includes the current user and other participants as well).
   */
  participants$: Observable<
    (StreamVideoParticipant | StreamVideoLocalParticipant)[]
  >;
  /**

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

  /**
   * The currently elected dominant speaker in the active call.
   */
  dominantSpeaker$: Observable<StreamVideoParticipant | undefined>;

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
   * Emits a list of details about recordings performed during the active call
   */
  callRecordingList$: Observable<CallRecording[]>;

  /**
   * Emits the latest call permission request sent by any participant of the active call.
   * Or `undefined` if there is no active call or if the current user doesn't have the necessary permission to handle these events.
   */
  callPermissionRequest$: Observable<PermissionRequestEvent | undefined>;

  /**
   * The raw call metadata object, as defined on the backend.
   */
  metadata$: Observable<CallResponse | undefined>;

  /**
   * The list of members of the current call.
   */
  members$: Observable<MemberResponse[]>;

  /**
   * The calling state.
   */
  callingState$: Observable<CallingState>;

  /**
   * A list of comparators that are used to sort the participants.
   *
   * @private
   */
  private sortParticipantsBy: Comparator<StreamVideoParticipant>;

  /**
   * Creates a new instance of the CallState class.
   *
   * @param sortParticipantsBy the comparator that is used to sort the participants.
   */
  constructor(
    sortParticipantsBy: Comparator<StreamVideoParticipant> = SortingPreset.defaultSortPreset,
  ) {
    this.sortParticipantsBy = sortParticipantsBy;

    this.participants$ = this.participantsSubject.pipe(
      map((ps) => ps.sort(this.sortParticipantsBy)),
    );

    this.localParticipant$ = this.participants$.pipe(
      map((participants) => participants.find(isStreamVideoLocalParticipant)),
    );

    this.remoteParticipants$ = this.participants$.pipe(
      map((participants) => participants.filter((p) => !p.isLoggedInUser)),
    );

    this.pinnedParticipants$ = this.participants$.pipe(
      map((participants) => participants.filter((p) => p.isPinned)),
    );

    this.dominantSpeaker$ = this.participants$.pipe(
      map((participants) => participants.find((p) => p.isDominantSpeaker)),
    );

    this.hasOngoingScreenShare$ = this.participants$.pipe(
      map((participants) => {
        return participants.some((p) =>
          p.publishedTracks.includes(TrackType.SCREEN_SHARE),
        );
      }),
      distinctUntilChanged(),
    );

    this.callStatsReport$ = this.callStatsReportSubject.asObservable();
    this.callRecordingInProgress$ =
      this.callRecordingInProgressSubject.asObservable();
    this.callPermissionRequest$ =
      this.callPermissionRequestSubject.asObservable();
    this.callRecordingList$ = this.callRecordingListSubject.asObservable();
    this.metadata$ = this.metadataSubject.asObservable();
    this.members$ = this.membersSubject.asObservable();
    this.callingState$ = this.callingStateSubject.asObservable();
  }

  /**
   * Sets the list of criteria that are used to sort the participants.
   * To disable sorting, you can pass `noopComparator()`.
   *
   * @param comparator the comparator to use to sort the participants.
   */
  setSortParticipantsBy = (comparator: Comparator<StreamVideoParticipant>) => {
    this.sortParticipantsBy = comparator;
    // trigger re-sorting of participants
    this.setCurrentValue(this.participantsSubject, (ps) => ps);
  };

  /**
   * Gets the current value of an observable, or undefined if the observable has
   * not emitted a value yet.
   *
   * @param observable$ the observable to get the value from.
   */
  getCurrentValue = RxUtils.getCurrentValue;

  /**
   * Updates the value of the provided Subject.
   * An `update` can either be a new value or a function which takes
   * the current value and returns a new value.
   *
   * @internal
   *
   * @param subject the subject to update.
   * @param update the update to apply to the subject.
   * @return the updated value.
   */
  setCurrentValue = RxUtils.setCurrentValue;

  /**
   * The list of participants in the current call.
   */
  get participants() {
    return this.getCurrentValue(this.participants$);
  }

  /**
   * Sets the list of participants in the current call.
   *
   * @internal
   *
   * @param participants the list of participants.
   */
  set participants(participants: StreamVideoParticipant[]) {
    this.participantsSubject.next(participants);
  }

  /**
   * The local participant in the current call.
   */
  get localParticipant() {
    return this.getCurrentValue(this.localParticipant$);
  }

  /**
   * The list of remote participants in the current call.
   */
  get remoteParticipants() {
    return this.getCurrentValue(this.remoteParticipants$);
  }

  /**
   * The dominant speaker in the current call.
   */
  get dominantSpeaker() {
    return this.getCurrentValue(this.dominantSpeaker$);
  }

  /**
   * The list of pinned participants in the current call.
   */
  get pinnedParticipants() {
    return this.getCurrentValue(this.pinnedParticipants$);
  }

  /**
   * Tell if there is an ongoing screen share in this call.
   */
  get hasOngoingScreenShare() {
    return this.getCurrentValue(this.hasOngoingScreenShare$);
  }

  /**
   * The calling state.
   */
  get callingState() {
    return this.getCurrentValue(this.callingState$);
  }

  /**
   * Sets the calling state.
   *
   * @internal
   * @param state the new calling state.
   */
  set callingState(state: CallingState) {
    this.callingStateSubject.next(state);
  }

  /**
   * The list of call recordings.
   */
  get callRecordingsList() {
    return this.getCurrentValue(this.callRecordingList$);
  }

  /**
   * Sets the list of call recordings.
   *
   * @internal
   * @param recordings the list of call recordings.
   */
  set callRecordingsList(recordings: CallRecording[]) {
    this.callRecordingListSubject.next(recordings);
  }

  /**
   * Tells whether a call recording is in progress.
   */
  get callRecordingInProgress() {
    return this.getCurrentValue(this.callRecordingInProgress$);
  }

  /**
   * Sets whether a call recording is in progress.
   *
   * @param inProgress whether a call recording is in progress.
   */
  set callRecordingInProgress(inProgress: boolean) {
    this.callRecordingInProgressSubject.next(inProgress);
  }

  /**
   * The last call permission request.
   */
  get callPermissionRequest() {
    return this.getCurrentValue(this.callPermissionRequest$);
  }

  /**
   * Sets the last call permission request.
   *
   * @internal
   * @param request the last call permission request.
   */
  set callPermissionRequest(request: PermissionRequestEvent | undefined) {
    this.callPermissionRequestSubject.next(request);
  }

  /**
   * The call stats report.
   */
  get callStatsReport() {
    return this.getCurrentValue(this.callStatsReport$);
  }

  /**
   * Sets the call stats report.
   *
   * @internal
   * @param report the report to set.
   */
  set callStatsReport(report: CallStatsReport | undefined) {
    this.callStatsReportSubject.next(report);
  }

  /**
   * The metadata of the current call.
   */
  get metadata() {
    return this.getCurrentValue(this.metadata$);
  }

  /**
   * Sets the metadata of the current call.
   *
   * @internal
   *
   * @param metadata the metadata to set.
   */
  set metadata(metadata: CallResponse | undefined) {
    this.metadataSubject.next(metadata);
  }

  /**
   * The members of the current call.
   */
  get members() {
    return this.getCurrentValue(this.members$);
  }

  /**
   * Sets the members of the current call.
   *
   * @internal
   *
   * @param members the members to set.
   */
  set members(members: MemberResponse[]) {
    this.membersSubject.next(members);
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
    return this.participants.find((p) => p.sessionId === sessionId);
  };

  /**
   * Updates a participant in the active call identified by the given `sessionId`.
   * If the participant can't be found, this operation is no-op.
   *
   * @internal
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
   * @internal
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
