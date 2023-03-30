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
  UserResponse,
} from '../gen/coordinator';
import { TrackType } from '../gen/video/sfu/models/models';
import { Comparator } from '../sorting';
import * as SortingPreset from '../sorting/presets';

export type UserResponseMap = {
  [userId: string]: UserResponse;
};

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
  metadataSubject = new BehaviorSubject<CallResponse | undefined>(undefined);

  /**
   * The list of members of the current call.
   *
   * @internal
   */
  membersSubject = new BehaviorSubject<MemberResponse[]>([]);

  /**
   * All participants of the current call (including the logged-in user).
   *
   * @internal
   */
  participantsSubject = new BehaviorSubject<
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
  callStatsReportSubject = new BehaviorSubject<CallStatsReport | undefined>(
    undefined,
  );

  /**
   * Emits a boolean indicating whether a call recording is currently in progress.
   *
   * @internal
   */
  // FIXME OL: might be derived from `this.call.recording`.
  callRecordingInProgressSubject = new BehaviorSubject<boolean>(false);

  /**
   * Emits a list of details about recordings performed during the active call
   */
  callRecordingListSubject = new BehaviorSubject<CallRecording[]>([]);

  /**
   * Emits the latest call permission request sent by any participant of the
   * active call. Or `undefined` if there is no active call or if the current
   * user doesn't have the necessary permission to handle these events.
   *
   * @internal
   */
  callPermissionRequestSubject = new BehaviorSubject<
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
  callRecordingList$;

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
  members$: Observable<UserResponseMap>;

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
    // FIXME OL: is the shape of this observable ok? Shall we expose the whole MemberResponse instead?
    this.members$ = this.membersSubject.pipe(
      map((members) => {
        return members.reduce<UserResponseMap>((acc, member) => {
          const user = member.user;
          acc[user.id] = user;
          return acc;
        }, {});
      }),
    );
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
