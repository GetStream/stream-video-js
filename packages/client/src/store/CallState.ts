import {
  BehaviorSubject,
  distinctUntilChanged,
  map,
  Observable,
  shareReplay,
} from 'rxjs';
import type { Patch } from './rxUtils';
import * as RxUtils from './rxUtils';
import {
  StreamVideoParticipant,
  StreamVideoParticipantPatch,
  StreamVideoParticipantPatches,
} from '../types';
import { CallStatsReport } from '../stats/types';
import {
  BlockedUserEvent,
  CallHLSBroadcastingStartedEvent,
  CallIngressResponse,
  CallMemberAddedEvent,
  CallMemberRemovedEvent,
  CallMemberUpdatedEvent,
  CallMemberUpdatedPermissionEvent,
  CallReactionEvent,
  CallResponse,
  CallSessionParticipantJoinedEvent,
  CallSessionParticipantLeftEvent,
  CallSessionResponse,
  CallSettingsResponse,
  EgressResponse,
  MemberResponse,
  OwnCapability,
  ThumbnailResponse,
  UnblockedUserEvent,
  UpdatedCallPermissionsEvent,
  UserResponse,
  WSEvent,
} from '../gen/coordinator';
import { Pin, TrackType } from '../gen/video/sfu/models/models';
import { Comparator } from '../sorting';
import * as SortingPreset from '../sorting/presets';
import { getLogger } from '../logger';
import { Logger } from '../coordinator/connection/types';

/**
 * Represents the state of the current call.
 */
export enum CallingState {
  /**
   * The call is in an unknown state.
   */
  UNKNOWN = 'unknown',
  /**
   * The call is in an idle state.
   */
  IDLE = 'idle',

  /**
   * The call is in the process of ringing.
   * (User hasn't accepted nor rejected the call yet.)
   */
  RINGING = 'ringing',

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
   * The call is in the process of migrating from one node to another.
   */
  MIGRATING = 'migrating',

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
  private backstageSubject = new BehaviorSubject<boolean>(true);
  private blockedUserIdsSubject = new BehaviorSubject<string[]>([]);
  private createdAtSubject = new BehaviorSubject<Date>(new Date());
  private endedAtSubject = new BehaviorSubject<Date | undefined>(undefined);
  private startsAtSubject = new BehaviorSubject<Date | undefined>(undefined);
  private updatedAtSubject = new BehaviorSubject<Date>(new Date());
  private createdBySubject = new BehaviorSubject<UserResponse | undefined>(
    undefined,
  );
  private customSubject = new BehaviorSubject<Record<string, any>>({});
  private egressSubject = new BehaviorSubject<EgressResponse | undefined>(
    undefined,
  );
  private ingressSubject = new BehaviorSubject<CallIngressResponse | undefined>(
    undefined,
  );
  private recordingSubject = new BehaviorSubject<boolean>(false);
  private sessionSubject = new BehaviorSubject<CallSessionResponse | undefined>(
    undefined,
  );
  private settingsSubject = new BehaviorSubject<
    CallSettingsResponse | undefined
  >(undefined);
  private transcribingSubject = new BehaviorSubject<boolean>(false);
  private endedBySubject = new BehaviorSubject<UserResponse | undefined>(
    undefined,
  );
  private thumbnailsSubject = new BehaviorSubject<
    ThumbnailResponse | undefined
  >(undefined);
  private membersSubject = new BehaviorSubject<MemberResponse[]>([]);
  private ownCapabilitiesSubject = new BehaviorSubject<OwnCapability[]>([]);
  private callingStateSubject = new BehaviorSubject<CallingState>(
    CallingState.UNKNOWN,
  );
  private startedAtSubject = new BehaviorSubject<Date | undefined>(undefined);
  private participantCountSubject = new BehaviorSubject<number>(0);
  private anonymousParticipantCountSubject = new BehaviorSubject<number>(0);
  private participantsSubject = new BehaviorSubject<StreamVideoParticipant[]>(
    [],
  );
  private callStatsReportSubject = new BehaviorSubject<
    CallStatsReport | undefined
  >(undefined);

  // Derived state

  /**
   * The time the call session actually started.
   * Useful for displaying the call duration.
   */
  startedAt$: Observable<Date | undefined>;

  /**
   * The server-side counted number of participants connected to the current call.
   * This number includes the anonymous participants as well.
   */
  participantCount$: Observable<number>;

  /**
   * The server-side counted number of anonymous participants connected to the current call.
   * This number excludes the regular participants.
   */
  anonymousParticipantCount$: Observable<number>;

  /**
   * All participants of the current call (this includes the current user and other participants as well).
   */
  participants$: Observable<StreamVideoParticipant[]>;

  /**
   * Remote participants of the current call (this includes every participant except the logged-in user).
   */
  remoteParticipants$: Observable<StreamVideoParticipant[]>;

  /**
   * The local participant of the current call (the logged-in user).
   */
  localParticipant$: Observable<StreamVideoParticipant | undefined>;

  /**
   * Pinned participants of the current call.
   */
  pinnedParticipants$: Observable<StreamVideoParticipant[]>;

  /**
   * The currently elected dominant speaker in the current call.
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
   * The list of members in the current call.
   */
  members$: Observable<MemberResponse[]>;

  /**
   * The list of capabilities of the current user.
   */
  ownCapabilities$: Observable<OwnCapability[]>;

  /**
   * The calling state.
   */
  callingState$: Observable<CallingState>;

  /**
   * The backstage state.
   */
  backstage$: Observable<boolean>;

  /**
   * Will provide the list of blocked user IDs.
   */
  blockedUserIds$: Observable<string[]>;

  /**
   * Will provide the time when this call has been created.
   */
  createdAt$: Observable<Date>;

  /**
   * Will provide the time when this call has been ended.
   */
  endedAt$: Observable<Date | undefined>;

  /**
   * Will provide the time when this call has been scheduled to start.
   */
  startsAt$: Observable<Date | undefined>;

  /**
   * Will provide the time when this call has been updated.
   */
  updatedAt$: Observable<Date>;

  /**
   * Will provide the user who created this call.
   */
  createdBy$: Observable<UserResponse | undefined>;

  /**
   * Will provide the custom data of this call.
   */
  custom$: Observable<Record<string, any>>;

  /**
   * Will provide the egress data of this call.
   */
  egress$: Observable<EgressResponse | undefined>;

  /**
   * Will provide the ingress data of this call.
   */
  ingress$: Observable<CallIngressResponse | undefined>;

  /**
   * Will provide the recording state of this call.
   */
  recording$: Observable<boolean>;

  /**
   * Will provide the session data of this call.
   */
  session$: Observable<CallSessionResponse | undefined>;

  /**
   * Will provide the settings of this call.
   */
  settings$: Observable<CallSettingsResponse | undefined>;

  /**
   * Will provide the transcribing state of this call.
   */
  transcribing$: Observable<boolean>;

  /**
   * Will provide the user who ended this call.
   */
  endedBy$: Observable<UserResponse | undefined>;

  /**
   * Will provide the thumbnails of this call.
   */
  thumbnails$: Observable<ThumbnailResponse | undefined>;

  readonly logger: Logger;

  /**
   * A list of comparators that are used to sort the participants.
   *
   * @private
   */
  private sortParticipantsBy: Comparator<StreamVideoParticipant> =
    SortingPreset.defaultSortPreset;

  private readonly eventHandlers: {
    [EventType in WSEvent['type']]:
      | ((event: Extract<WSEvent, { type: EventType }>) => void)
      | undefined;
  };

  /**
   * Creates a new instance of the CallState class.
   *
   */
  constructor() {
    this.logger = getLogger(['CallState']);
    this.participants$ = this.participantsSubject.asObservable().pipe(
      // maintain stable-sort by mutating the participants stored
      // in the original subject
      map((ps) => ps.sort(this.sortParticipantsBy)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    this.localParticipant$ = this.participants$.pipe(
      map((participants) => participants.find((p) => p.isLocalParticipant)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    this.remoteParticipants$ = this.participants$.pipe(
      map((participants) => participants.filter((p) => !p.isLocalParticipant)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    this.pinnedParticipants$ = this.participants$.pipe(
      map((participants) => participants.filter((p) => !!p.pin)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    this.dominantSpeaker$ = this.participants$.pipe(
      map((participants) => participants.find((p) => p.isDominantSpeaker)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    this.hasOngoingScreenShare$ = this.participants$.pipe(
      map((participants) =>
        participants.some((p) =>
          p.publishedTracks.includes(TrackType.SCREEN_SHARE),
        ),
      ),
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    this.startedAt$ = this.startedAtSubject.asObservable();
    this.participantCount$ = this.participantCountSubject.asObservable();
    this.anonymousParticipantCount$ =
      this.anonymousParticipantCountSubject.asObservable();

    this.callStatsReport$ = this.callStatsReportSubject.asObservable();
    this.members$ = this.membersSubject.asObservable();
    this.ownCapabilities$ = this.ownCapabilitiesSubject.asObservable();
    this.callingState$ = this.callingStateSubject.asObservable();

    this.backstage$ = this.backstageSubject.asObservable();
    this.blockedUserIds$ = this.blockedUserIdsSubject.asObservable();
    this.createdAt$ = this.createdAtSubject.asObservable();
    this.endedAt$ = this.endedAtSubject.asObservable();
    this.startsAt$ = this.startsAtSubject.asObservable();
    this.updatedAt$ = this.updatedAtSubject.asObservable();
    this.createdBy$ = this.createdBySubject.asObservable();
    this.custom$ = this.customSubject.asObservable();
    this.egress$ = this.egressSubject.asObservable();
    this.ingress$ = this.ingressSubject.asObservable();
    this.recording$ = this.recordingSubject.asObservable();
    this.session$ = this.sessionSubject.asObservable();
    this.settings$ = this.settingsSubject.asObservable();
    this.transcribing$ = this.transcribingSubject.asObservable();
    this.endedBy$ = this.endedBySubject.asObservable();
    this.thumbnails$ = this.thumbnailsSubject.asObservable();

    this.eventHandlers = {
      // these events are not updating the call state:
      'call.permission_request': undefined,
      'call.recording_failed': undefined,
      'call.recording_ready': undefined,
      'call.user_muted': undefined,
      'connection.error': undefined,
      'connection.ok': undefined,
      'call.deleted': undefined,
      // 'health.check': undefined,
      // custom: undefined,

      // events that update call state:
      'call.accepted': (e) => this.updateFromCallResponse(e.call),
      'call.blocked_user': this.blockUser,
      'call.created': (e) => this.updateFromCallResponse(e.call),
      'call.ended': (e) => {
        this.updateFromCallResponse(e.call);
        this.setCurrentValue(this.endedBySubject, e.user);
      },
      'call.hls_broadcasting_failed': this.updateFromHLSBroadcastingFailed,
      'call.hls_broadcasting_started': this.updateFromHLSBroadcastStarted,
      'call.hls_broadcasting_stopped': this.updateFromHLSBroadcastStopped,
      'call.live_started': (e) => this.updateFromCallResponse(e.call),
      'call.member_added': this.updateFromMemberAdded,
      'call.member_removed': this.updateFromMemberRemoved,
      'call.member_updated_permission': this.updateMembers,
      'call.member_updated': this.updateMembers,
      'call.notification': (e) => {
        this.updateFromCallResponse(e.call);
        this.setMembers(e.members);
      },
      'call.permissions_updated': this.updateOwnCapabilities,
      'call.reaction_new': this.updateParticipantReaction,
      'call.recording_started': () =>
        this.setCurrentValue(this.recordingSubject, true),
      'call.recording_stopped': () =>
        this.setCurrentValue(this.recordingSubject, false),
      'call.rejected': (e) => this.updateFromCallResponse(e.call),
      'call.ring': (e) => this.updateFromCallResponse(e.call),
      'call.session_ended': (e) => this.updateFromCallResponse(e.call),
      'call.session_participant_joined':
        this.updateFromSessionParticipantJoined,
      'call.session_participant_left': this.updateFromSessionParticipantLeft,
      'call.session_started': (e) => this.updateFromCallResponse(e.call),
      'call.unblocked_user': this.unblockUser,
      'call.updated': (e) => this.updateFromCallResponse(e.call),
    };
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
   * The server-side counted number of participants connected to the current call.
   * This number includes the anonymous participants as well.
   */
  get participantCount() {
    return this.getCurrentValue(this.participantCount$);
  }

  /**
   * Sets the number of participants in the current call.
   *
   * @internal
   * @param count the number of participants.
   */
  setParticipantCount = (count: Patch<number>) => {
    return this.setCurrentValue(this.participantCountSubject, count);
  };

  /**
   * The time the call session actually started.
   * Useful for displaying the call duration.
   */
  get startedAt() {
    return this.getCurrentValue(this.startedAt$);
  }

  /**
   * Sets the time the call session actually started.
   *
   * @internal
   * @param startedAt the time the call session actually started.
   */
  setStartedAt = (startedAt: Patch<Date | undefined>) => {
    return this.setCurrentValue(this.startedAtSubject, startedAt);
  };

  /**
   * The server-side counted number of anonymous participants connected to the current call.
   * This number includes the anonymous participants as well.
   */
  get anonymousParticipantCount() {
    return this.getCurrentValue(this.anonymousParticipantCount$);
  }

  /**
   * Sets the number of anonymous participants in the current call.
   *
   * @internal
   * @param count the number of anonymous participants.
   */
  setAnonymousParticipantCount = (count: Patch<number>) => {
    return this.setCurrentValue(this.anonymousParticipantCountSubject, count);
  };

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
  setParticipants = (participants: Patch<StreamVideoParticipant[]>) => {
    return this.setCurrentValue(this.participantsSubject, participants);
  };

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
  setCallingState = (state: Patch<CallingState>) => {
    return this.setCurrentValue(this.callingStateSubject, state);
  };

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
  setCallStatsReport = (report: Patch<CallStatsReport | undefined>) => {
    return this.setCurrentValue(this.callStatsReportSubject, report);
  };

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
   * @param members the members to set.
   */
  setMembers = (members: Patch<MemberResponse[]>) => {
    this.setCurrentValue(this.membersSubject, members);
  };

  /**
   * The capabilities of the current user for the current call.
   */
  get ownCapabilities() {
    return this.getCurrentValue(this.ownCapabilities$);
  }

  /**
   * Sets the own capabilities.
   *
   * @internal
   * @param capabilities the capabilities to set.
   */
  setOwnCapabilities = (capabilities: Patch<OwnCapability[]>) => {
    return this.setCurrentValue(this.ownCapabilitiesSubject, capabilities);
  };

  /**
   * The backstage state.
   */
  get backstage() {
    return this.getCurrentValue(this.backstage$);
  }

  /**
   * Will provide the list of blocked user IDs.
   */
  get blockedUserIds() {
    return this.getCurrentValue(this.blockedUserIds$);
  }

  /**
   * Will provide the time when this call has been created.
   */
  get createdAt() {
    return this.getCurrentValue(this.createdAt$);
  }

  /**
   * Will provide the time when this call has been ended.
   */
  get endedAt() {
    return this.getCurrentValue(this.endedAt$);
  }

  /**
   * Will provide the time when this call has been scheduled to start.
   */
  get startsAt() {
    return this.getCurrentValue(this.startsAt$);
  }

  /**
   * Will provide the time when this call has been updated.
   */
  get updatedAt() {
    return this.getCurrentValue(this.updatedAt$);
  }

  /**
   * Will provide the user who created this call.
   */
  get createdBy() {
    return this.getCurrentValue(this.createdBy$);
  }

  /**
   * Will provide the custom data of this call.
   */
  get custom() {
    return this.getCurrentValue(this.custom$);
  }

  /**
   * Will provide the egress data of this call.
   */
  get egress() {
    return this.getCurrentValue(this.egress$);
  }

  /**
   * Will provide the ingress data of this call.
   */
  get ingress() {
    return this.getCurrentValue(this.ingress$);
  }

  /**
   * Will provide the recording state of this call.
   */
  get recording() {
    return this.getCurrentValue(this.recording$);
  }

  /**
   * Will provide the session data of this call.
   */
  get session() {
    return this.getCurrentValue(this.session$);
  }

  /**
   * Will provide the settings of this call.
   */
  get settings() {
    return this.getCurrentValue(this.settings$);
  }

  /**
   * Will provide the transcribing state of this call.
   */
  get transcribing() {
    return this.getCurrentValue(this.transcribing$);
  }

  /**
   * Will provide the user who ended this call.
   */
  get endedBy() {
    return this.getCurrentValue(this.endedBy$);
  }

  /**
   * Will provide the thumbnails of this call, if enabled in the call settings.
   */
  get thumbnails() {
    return this.getCurrentValue(this.thumbnails$);
  }

  /**
   * Will try to find the participant with the given sessionId in the current call.
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
   * Returns a new lookup table of participants indexed by their session ID.
   */
  getParticipantLookupBySessionId = () => {
    return this.participants.reduce<{
      [sessionId: string]: StreamVideoParticipant | undefined;
    }>((lookupTable, participant) => {
      lookupTable[participant.sessionId] = participant;
      return lookupTable;
    }, {});
  };

  /**
   * Updates a participant in the current call identified by the given `sessionId`.
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
      this.logger('warn', `Participant with sessionId ${sessionId} not found`);
      return;
    }

    const thePatch = typeof patch === 'function' ? patch(participant) : patch;
    const updatedParticipant: StreamVideoParticipant = {
      // FIXME OL: this is not a deep merge, we might want to revisit this
      ...participant,
      ...thePatch,
    };
    return this.setParticipants((participants) =>
      participants.map((p) =>
        p.sessionId === sessionId ? updatedParticipant : p,
      ),
    );
  };

  /**
   * Updates a participant in the current call identified by the given `sessionId`.
   * If a participant with matching `sessionId` can't be found, the provided
   * `participant` is added to the list of participants.
   *
   * @param sessionId the session ID of the participant to update.
   * @param participant the participant to update or add.
   */
  updateOrAddParticipant = (
    sessionId: string,
    participant: StreamVideoParticipant,
  ) => {
    if (!this.findParticipantBySessionId(sessionId)) {
      return this.setParticipants((participants) => [
        ...participants,
        participant,
      ]);
    }
    return this.setParticipants((participants) =>
      participants.map((p) => {
        if (p.sessionId === sessionId) {
          return {
            ...p,
            ...participant,
          };
        }
        return p;
      }),
    );
  };

  /**
   * Updates all participants in the current call whose session ID is in the given `sessionIds`.
   * If no patches are provided, this operation is no-op.
   *
   * @internal
   *
   * @param patch the patch to apply to the participants.
   * @returns all participants, with all patch applied.
   */
  updateParticipants = (patch: StreamVideoParticipantPatches) => {
    if (Object.keys(patch).length === 0) return;
    return this.setParticipants((participants) =>
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

  /**
   * Updates the call state with the data received from the server.
   *
   * @internal
   *
   * @param event the video event that our backend sent us.
   */
  updateFromEvent = (event: WSEvent) => {
    const update = this.eventHandlers[event.type];
    if (update) {
      update(event as any);
    }
  };

  /**
   * Updates the participant pinned state with server side pinning data.
   *
   * @param pins the latest pins from the server.
   */
  setServerSidePins = (pins: Pin[]) => {
    const pinsLookup = pins.reduce<{ [sessionId: string]: number | undefined }>(
      (lookup, pin) => {
        lookup[pin.sessionId] = Date.now();
        return lookup;
      },
      {},
    );

    return this.setParticipants((participants) =>
      participants.map((participant) => {
        const serverSidePinnedAt = pinsLookup[participant.sessionId];
        // the participant is newly pinned
        if (serverSidePinnedAt) {
          return {
            ...participant,
            pin: {
              isLocalPin: false,
              pinnedAt: serverSidePinnedAt,
            },
          };
        }
        // the participant is no longer pinned server side
        // we need to reset the pin
        if (participant.pin && !participant.pin.isLocalPin) {
          return {
            ...participant,
            pin: undefined,
          };
        }
        // no changes to be applied
        return participant;
      }),
    );
  };

  /**
   * Updates the call state with the data received from the server.
   *
   * @internal
   *
   * @param call the call response from the server.
   */
  updateFromCallResponse = (call: CallResponse) => {
    this.setCurrentValue(this.backstageSubject, call.backstage);
    this.setCurrentValue(this.blockedUserIdsSubject, call.blocked_user_ids);
    this.setCurrentValue(this.createdAtSubject, new Date(call.created_at));
    this.setCurrentValue(this.updatedAtSubject, new Date(call.updated_at));
    this.setCurrentValue(
      this.startsAtSubject,
      call.starts_at ? new Date(call.starts_at) : undefined,
    );
    this.setCurrentValue(
      this.endedAtSubject,
      call.ended_at ? new Date(call.ended_at) : undefined,
    );
    this.setCurrentValue(this.createdBySubject, call.created_by);
    this.setCurrentValue(this.customSubject, call.custom);
    this.setCurrentValue(this.egressSubject, call.egress);
    this.setCurrentValue(this.ingressSubject, call.ingress);
    this.setCurrentValue(this.recordingSubject, call.recording);
    this.setCurrentValue(this.sessionSubject, call.session);
    this.setCurrentValue(this.settingsSubject, call.settings);
    this.setCurrentValue(this.transcribingSubject, call.transcribing);
    this.setCurrentValue(this.thumbnailsSubject, call.thumbnails);
  };

  private updateFromMemberRemoved = (event: CallMemberRemovedEvent) => {
    this.setCurrentValue(this.membersSubject, (members) =>
      members.filter((m) => event.members.indexOf(m.user_id) === -1),
    );
  };

  private updateFromMemberAdded = (event: CallMemberAddedEvent) => {
    this.setCurrentValue(this.membersSubject, (members) => [
      ...members,
      ...event.members,
    ]);
  };

  private updateFromHLSBroadcastStopped = () => {
    this.setCurrentValue(this.egressSubject, (egress) => ({
      ...egress!,
      broadcasting: false,
    }));
  };

  private updateFromHLSBroadcastingFailed = () => {
    this.setCurrentValue(this.egressSubject, (egress) => ({
      ...egress!,
      broadcasting: false,
    }));
  };

  private updateFromHLSBroadcastStarted = (
    event: CallHLSBroadcastingStartedEvent,
  ) => {
    this.setCurrentValue(this.egressSubject, (egress) => ({
      ...egress!,
      broadcasting: true,
      hls: {
        ...egress!.hls,
        playlist_url: event.hls_playlist_url,
      },
    }));
  };

  private updateFromSessionParticipantLeft = (
    event: CallSessionParticipantLeftEvent,
  ) => {
    this.setCurrentValue(this.sessionSubject, (session) => {
      if (!session) {
        this.logger(
          'warn',
          `Received call.session_participant_left event but no session is available.`,
          event,
        );
        return session;
      }
      const { participants, participants_count_by_role } = session;
      const { user, user_session_id } = event.participant;
      return {
        ...session,
        participants: participants.filter(
          (p) => p.user_session_id !== user_session_id,
        ),
        participants_count_by_role: {
          ...participants_count_by_role,
          [user.role]: Math.max(
            0,
            (participants_count_by_role[user.role] || 0) - 1,
          ),
        },
      };
    });
  };

  private updateFromSessionParticipantJoined = (
    event: CallSessionParticipantJoinedEvent,
  ) => {
    this.setCurrentValue(this.sessionSubject, (session) => {
      if (!session) {
        this.logger(
          'warn',
          `Received call.session_participant_joined event but no session is available.`,
          event,
        );
        return session;
      }
      const { participants, participants_count_by_role } = session;
      const { user, user_session_id } = event.participant;
      // It could happen that the backend delivers the same participant more than once.
      // Once with the call.session_started event and once again with the
      // call.session_participant_joined event. In this case,
      // we should update the existing participant and prevent duplicating it.
      let shouldInsertParticipant = true;
      const updatedParticipants = participants.map((p) => {
        if (p.user_session_id === user_session_id) {
          shouldInsertParticipant = false;
          return event.participant;
        }
        return p;
      });
      if (shouldInsertParticipant) {
        // this is a new array, we can safely push the new participant
        updatedParticipants.push(event.participant);
      }

      // If we are updating an existing participant, we don't want to increment
      // the participant_by_role count.
      const increment = shouldInsertParticipant ? 1 : 0;
      return {
        ...session,
        participants: updatedParticipants,
        participants_count_by_role: {
          ...participants_count_by_role,
          [user.role]: (participants_count_by_role[user.role] || 0) + increment,
        },
      };
    });
  };

  private updateMembers = (
    event: CallMemberUpdatedEvent | CallMemberUpdatedPermissionEvent,
  ) => {
    this.setCurrentValue(this.membersSubject, (members) =>
      members.map((member) => {
        const memberUpdate = event.members.find(
          (m) => m.user_id === member.user_id,
        );
        return memberUpdate ? memberUpdate : member;
      }),
    );
  };

  private updateParticipantReaction = (event: CallReactionEvent) => {
    const { user, custom, type, emoji_code } = event.reaction;
    this.setParticipants((participants) => {
      return participants.map((p) => {
        // skip if the reaction is not for this participant
        if (p.userId !== user.id) return p;
        // update the participant with the new reaction
        return {
          ...p,
          reaction: {
            type,
            emoji_code,
            custom,
          },
        };
      });
    });
  };

  private unblockUser = (event: UnblockedUserEvent) => {
    this.setCurrentValue(this.blockedUserIdsSubject, (current) => {
      if (!current) return current;
      return current.filter((id) => id !== event.user.id);
    });
  };

  private blockUser = (event: BlockedUserEvent) => {
    this.setCurrentValue(this.blockedUserIdsSubject, (current) => [
      ...(current || []),
      event.user.id,
    ]);
  };

  private updateOwnCapabilities = (event: UpdatedCallPermissionsEvent) => {
    if (event.user.id === this.localParticipant?.userId) {
      this.setCurrentValue(this.ownCapabilitiesSubject, event.own_capabilities);
    }
  };
}
