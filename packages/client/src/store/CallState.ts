import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  map,
  Observable,
  ReplaySubject,
  shareReplay,
  startWith,
} from 'rxjs';
import {
  getCurrentValue,
  isShallowArrayEqual,
  type Patch,
  setCurrentValue,
  updateValue,
} from './rxUtils';
import { CallingState } from './CallingState';
import {
  type CallRecordingType,
  type ClosedCaptionsSettings,
  type StreamVideoParticipant,
  type StreamVideoParticipantPatch,
  type StreamVideoParticipantPatches,
  type SubscriptionChanges,
  VideoTrackType,
  VisibilityState,
} from '../types';
import { CallStatsReport } from '../stats';
import {
  BlockedUserEvent,
  CallClosedCaption,
  CallIngressResponse,
  CallMemberAddedEvent,
  CallMemberRemovedEvent,
  CallMemberUpdatedEvent,
  CallMemberUpdatedPermissionEvent,
  CallReactionEvent,
  CallResponse,
  CallSessionParticipantCountsUpdatedEvent,
  CallSessionParticipantJoinedEvent,
  CallSessionParticipantLeftEvent,
  CallSessionResponse,
  CallSettingsResponse,
  ClosedCaptionEvent,
  EgressResponse,
  MemberResponse,
  OwnCapability,
  ThumbnailResponse,
  UnblockedUserEvent,
  UpdatedCallPermissionsEvent,
  UserResponse,
  VideoEvent,
} from '../gen/coordinator';
import { Timestamp } from '../gen/google/protobuf/timestamp';
import { ReconnectDetails } from '../gen/video/sfu/event/events';
import {
  CallGrants,
  CallState as SfuCallState,
  Pin,
  TrackType,
} from '../gen/video/sfu/models/models';
import { Comparator, defaultSortPreset } from '../sorting';
import { ensureExhausted } from '../helpers/ensureExhausted';
import { hasScreenShare } from '../helpers/participantUtils';
import { videoLoggerSystem } from '../logger';
import type { AllEventHandlers, CallStateEventHandlers } from './types';

/** Returns the default egress object - when no egress data is available. */
const defaultEgress: EgressResponse = {
  broadcasting: false,
  hls: { playlist_url: '', status: '' },
  rtmps: [],
};

type OrphanedTrack = {
  id: string;
  trackLookupPrefix: string;
  trackType: TrackType;
  track: MediaStream;
  receiver?: RTCRtpReceiver;
};

/**
 * Creates an Observable from the given subject by piping it to the
 * `distinctUntilChanged()` operator.
 */
const duc = <T>(
  source: BehaviorSubject<T>,
  comparator?: (a: T, b: T) => boolean,
): Observable<T> => source.pipe(distinctUntilChanged(comparator));

/**
 * Multicasts the given Observable, replaying the latest computed value to
 * every new subscriber instead of re-running the pipeline for each of them.
 */
const shared = <T>(source: Observable<T>): Observable<T> =>
  source.pipe(shareReplay({ bufferSize: 1, refCount: true }));

/** Creates a BehaviorSubject seeded with the given value. */
function subject<T>(initialValue: T): BehaviorSubject<T>;
/** Creates a BehaviorSubject which starts out holding `undefined`. */
function subject<T>(): BehaviorSubject<T | undefined>;
function subject<T>(initialValue?: T) {
  return new BehaviorSubject(initialValue);
}

/**
 * Holds the state of the current call.
 * @react You don't have to use this class directly, as we are exposing the state through Hooks.
 */
export class CallState {
  readonly logger = videoLoggerSystem.getLogger('CallState');
  /** A list of comparators that are used to sort the participants. */
  private sortParticipantsBy = defaultSortPreset;

  private backstageSubject = subject(true);
  private blockedUserIdsSubject = subject<string[]>([]);
  private createdAtSubject = subject(new Date());
  private endedAtSubject = subject<Date>();
  private startsAtSubject = subject<Date>();
  private updatedAtSubject = subject(new Date());
  private createdBySubject = subject<UserResponse>();
  private customSubject = subject<Record<string, any>>({});
  private egressSubject = subject<EgressResponse>();
  private ingressSubject = subject<CallIngressResponse>();
  private recordingSubject = subject(false);
  private individualRecordingSubject = subject(false);
  private rawRecordingSubject = subject(false);
  private sessionSubject = subject<CallSessionResponse>();
  private settingsSubject = subject<CallSettingsResponse>();
  private transcribingSubject = subject(false);
  private captioningSubject = subject(false);
  private e2eeEnabledSubject = subject(false);
  private endedBySubject = subject<UserResponse>();
  private thumbnailsSubject = subject<ThumbnailResponse>();
  private membersSubject = subject<MemberResponse[]>([]);
  private ownCapabilitiesSubject = subject<OwnCapability[]>([]);
  private callingStateSubject = subject<CallingState>(CallingState.UNKNOWN);
  private startedAtSubject = subject<Date>();
  private participantCountSubject = subject(0);
  private anonymousParticipantCountSubject = subject(0);
  private participantsSubject = subject<StreamVideoParticipant[]>([]);
  private callStatsReportSubject = subject<CallStatsReport>();
  private closedCaptionsSubject = subject<CallClosedCaption[]>([]);
  private callGrantsSubject = new ReplaySubject<CallGrants>(1);

  /** The backstage state. */
  backstage$ = duc(this.backstageSubject);

  /** Will provide the list of blocked user IDs. */
  blockedUserIds$ = duc(this.blockedUserIdsSubject, isShallowArrayEqual);

  /** Will provide the time when this call has been created. */
  createdAt$ = this.createdAtSubject.asObservable();

  /** Will provide the time when this call has been ended. */
  endedAt$ = this.endedAtSubject.asObservable();

  /** Will provide the time when this call has been scheduled to start. */
  startsAt$ = this.startsAtSubject.asObservable();

  /** Will provide the time when this call has been updated. */
  updatedAt$ = this.updatedAtSubject.asObservable();

  /** Will provide the user who created this call. */
  createdBy$ = this.createdBySubject.asObservable();

  /** Will provide the custom data of this call. */
  custom$ = this.customSubject.asObservable();

  /** Will provide the egress data of this call. */
  egress$ = this.egressSubject.asObservable();

  /** Will provide the ingress data of this call. */
  ingress$ = this.ingressSubject.asObservable();

  /** Will provide the recording state of this call. */
  recording$ = duc(this.recordingSubject);

  /** Will provide the recording state of this call. */
  individualRecording$ = duc(this.individualRecordingSubject);

  /** Will provide the recording state of this call. */
  rawRecording$ = duc(this.rawRecordingSubject);

  /** Will provide the session data of this call. */
  session$ = this.sessionSubject.asObservable();

  /** Will provide the settings of this call. */
  settings$ = this.settingsSubject.asObservable();

  /** Will provide the transcribing state of this call. */
  transcribing$ = duc(this.transcribingSubject);

  /** Will provide the closed captioning state of this call. */
  captioning$ = duc(this.captioningSubject);

  /**
   * Whether end-to-end encryption is active for this call, as reported by the
   * SFU in the join response.
   */
  e2eeEnabled$ = duc(this.e2eeEnabledSubject);

  /** Will provide the user who ended this call. */
  endedBy$ = this.endedBySubject.asObservable();

  /** Will provide the thumbnails of this call. */
  thumbnails$ = this.thumbnailsSubject.asObservable();

  /** The list of members in the current call. */
  members$ = this.membersSubject.asObservable();

  /** The calling state. */
  callingState$ = duc(this.callingStateSubject);

  /**
   * The time the call session actually started.
   * Useful for displaying the call duration.
   */
  startedAt$ = this.startedAtSubject.asObservable();

  /**
   * The server-side counted number of participants connected to the current call.
   * This number includes the anonymous participants as well.
   */
  participantCount$ = duc(this.participantCountSubject);

  /**
   * The server-side counted number of anonymous participants connected to the current call.
   * This number excludes the regular participants.
   */
  anonymousParticipantCount$ = duc(this.anonymousParticipantCountSubject);

  /**
   * All participants of the current call (this includes the current user and other participants as well),
   * unsorted. This observable only updates when participants join or leave the call.
   */
  rawParticipants$ = shared(this.participantsSubject.asObservable());

  /** All participants of the current call sorted according to the current `sortByParticipantsBy` setting. */
  participants$ = shared(
    this.participantsSubject.asObservable().pipe(
      // maintain stable-sort by mutating the participants stored in the original subject
      map((ps) => ps.sort(this.sortParticipantsBy)),
    ),
  );

  /** The local participant of the current call. */
  localParticipant$ = shared(
    this.participants$.pipe(map((ps) => ps.find((p) => p.isLocalParticipant))),
  );

  /** Remote participants of the current call (all except the local participant). */
  remoteParticipants$ = shared(
    this.participants$.pipe(
      map((ps) => ps.filter((p) => !p.isLocalParticipant)),
    ),
  );

  /** Pinned participants of the current call. */
  pinnedParticipants$ = shared(
    this.participants$.pipe(map((ps) => ps.filter((p) => !!p.pin))),
  );

  /** The currently elected dominant speaker in the current call. */
  dominantSpeaker$ = shared(
    this.participants$.pipe(map((ps) => ps.find((p) => p.isDominantSpeaker))),
  );

  /** Emits true whenever there is an active screen sharing session within the current call. */
  hasOngoingScreenShare$ = shared(
    this.participants$.pipe(
      map((ps) => ps.some((p) => hasScreenShare(p))),
      distinctUntilChanged(),
    ),
  );

  /**
   * The latest stats report of the current call.
   * When stats gathering is enabled, this observable will emit a new value
   * at a regular (configurable) interval.
   *
   * Consumers of this observable can implement their own batching logic
   * in case they want to show historical stats data.
   */
  callStatsReport$ = this.callStatsReportSubject.asObservable();

  /** The queue of closed captions. */
  closedCaptions$ = this.closedCaptionsSubject.asObservable();

  /** The list of capabilities of the current user. */
  ownCapabilities$ = shared(
    combineLatest([
      this.ownCapabilitiesSubject,
      this.callGrantsSubject.pipe(startWith(undefined)),
    ]).pipe(
      map(([capabilities, grants]) => {
        if (!grants) return capabilities;

        const { canPublishAudio, canPublishVideo, canScreenshare } = grants;

        const update = {
          [OwnCapability.SEND_AUDIO]: canPublishAudio,
          [OwnCapability.SEND_VIDEO]: canPublishVideo,
          [OwnCapability.SCREENSHARE]: canScreenshare,
        } as const;

        const nextCapabilities = [...capabilities];

        for (const _capability in update) {
          const capability = _capability as keyof typeof update;
          const allowed = update[capability];

          // grants take precedence over capabilities, reconstruct the capabilities
          if (allowed && !nextCapabilities.includes(capability)) {
            nextCapabilities.push(capability);
          } else if (!allowed && nextCapabilities.includes(capability)) {
            const index = nextCapabilities.indexOf(capability);
            nextCapabilities.splice(index, 1);
          }
        }

        return nextCapabilities;
      }),
      distinctUntilChanged(isShallowArrayEqual),
    ),
  );

  // These are tracks that were delivered to the Subscriber's onTrack event
  // that we couldn't associate with a participant yet.
  // This happens when the participantJoined event hasn't been received yet.
  // We keep these tracks around until we can associate them with a participant.
  private orphanedTracks: OrphanedTrack[] = [];

  /** The closed captions configuration. */
  private closedCaptionsSettings: ClosedCaptionsSettings | undefined;
  private closedCaptionsTasks = new Map<string, NodeJS.Timeout>();

  private readonly eventHandlers: Partial<AllEventHandlers>;

  /** Creates a new instance of the CallState class. */
  constructor() {
    this.eventHandlers = {
      'call.accepted': (e) => this.updateFromCallResponse(e.call),
      'call.blocked_user': this.blockUser,
      'call.closed_caption': this.updateFromClosedCaptions,
      'call.closed_captions_failed': () => {
        setCurrentValue(this.captioningSubject, false);
      },
      'call.closed_captions_started': () => {
        setCurrentValue(this.captioningSubject, true);
      },
      'call.closed_captions_stopped': () => {
        setCurrentValue(this.captioningSubject, false);
      },
      'call.created': (e) => this.updateFromCallResponse(e.call),
      'call.deleted': (e) => this.updateFromCallResponse(e.call),
      'call.ended': (e) => {
        this.updateFromCallResponse(e.call);
        setCurrentValue(this.endedBySubject, e.user);
      },
      'call.frame_recording_failed': (e) => {
        this.updateFromCallResponse(e.call);
      },
      'call.frame_recording_started': (e) => {
        this.updateFromCallResponse(e.call);
      },
      'call.frame_recording_stopped': (e) => {
        this.updateFromCallResponse(e.call);
      },
      'call.hls_broadcasting_failed': this.updateFromHLSBroadcastingFailed,
      'call.hls_broadcasting_started': (e) => {
        this.updateFromCallResponse(e.call);
      },
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
      'call.recording_started': (e) => {
        this.updateFromRecordingEvent(e.recording_type, true);
      },
      'call.recording_stopped': (e) => {
        this.updateFromRecordingEvent(e.recording_type, false);
      },
      'call.recording_failed': (e) => {
        this.updateFromRecordingEvent(e.recording_type, false);
      },
      'call.rejected': (e) => this.updateFromCallResponse(e.call),
      'call.ring': (e) => this.updateFromCallResponse(e.call),
      'call.missed': (e) => this.updateFromCallResponse(e.call),
      'call.session_ended': (e) => this.updateFromCallResponse(e.call),
      'call.session_participant_count_updated':
        this.updateFromSessionParticipantCountUpdate,
      'call.session_participant_joined':
        this.updateFromSessionParticipantJoined,
      'call.session_participant_left': this.updateFromSessionParticipantLeft,
      'call.session_started': (e) => this.updateFromCallResponse(e.call),
      'call.transcription_started': () => {
        setCurrentValue(this.transcribingSubject, true);
      },
      'call.transcription_stopped': () => {
        setCurrentValue(this.transcribingSubject, false);
      },
      'call.transcription_failed': () => {
        setCurrentValue(this.transcribingSubject, false);
      },
      'call.unblocked_user': this.unblockUser,
      'call.updated': (e) => this.updateFromCallResponse(e.call),
    } satisfies CallStateEventHandlers;
  }

  /** Runs the cleanup tasks. */
  dispose = () => {
    for (const [ccKey, taskId] of this.closedCaptionsTasks.entries()) {
      clearTimeout(taskId);
      this.closedCaptionsTasks.delete(ccKey);
    }
    this.removeAllOrphanedTracks();
  };

  /**
   * Sets the list of criteria that are used to sort the participants.
   * To disable sorting, you can pass `noopComparator()`.
   *
   * @param comparator the comparator to use to sort the participants.
   */
  setSortParticipantsBy = (comparator: Comparator<StreamVideoParticipant>) => {
    this.sortParticipantsBy = comparator;
    // trigger re-sorting of participants
    setCurrentValue(this.participantsSubject, (ps) => ps);
  };

  /** Returns the comparator currently used to sort the participants. */
  getSortParticipantsBy = (): Comparator<StreamVideoParticipant> => {
    return this.sortParticipantsBy;
  };

  /**
   * The server-side counted number of participants connected to the current call.
   * This number includes the anonymous participants as well.
   */
  get participantCount() {
    return getCurrentValue(this.participantCountSubject);
  }

  /**
   * Sets the number of participants in the current call.
   *
   * @internal
   * @param count the number of participants.
   */
  setParticipantCount = (count: Patch<number>) => {
    return setCurrentValue(this.participantCountSubject, count);
  };

  /**
   * The time the call session actually started.
   * Useful for displaying the call duration.
   */
  get startedAt() {
    return getCurrentValue(this.startedAtSubject);
  }

  /**
   * Sets the time the call session actually started.
   *
   * @internal
   * @param startedAt the time the call session actually started.
   */
  setStartedAt = (startedAt: Patch<Date | undefined>) => {
    return setCurrentValue(this.startedAtSubject, startedAt);
  };

  /** Returns whether closed captions are enabled in the current call. */
  get captioning() {
    return getCurrentValue(this.captioningSubject);
  }

  /**
   * Sets the closed captioning state of the current call.
   *
   * @internal
   * @param captioning the closed captioning state.
   */
  setCaptioning = (captioning: boolean) => {
    return updateValue(this.captioningSubject, captioning);
  };

  /**
   * The server-side counted number of anonymous participants connected to the current call.
   * This number includes the anonymous participants as well.
   */
  get anonymousParticipantCount() {
    return getCurrentValue(this.anonymousParticipantCountSubject);
  }

  /**
   * Sets the number of anonymous participants in the current call.
   *
   * @internal
   * @param count the number of anonymous participants.
   */
  setAnonymousParticipantCount = (count: Patch<number>) => {
    return setCurrentValue(this.anonymousParticipantCountSubject, count);
  };

  /** The list of participants in the current call. */
  get participants() {
    return getCurrentValue(this.participants$);
  }

  /** The stable list of participants in the current call, unsorted. */
  get rawParticipants() {
    return getCurrentValue(this.rawParticipants$);
  }

  /**
   * Returns the current participants array directly from the BehaviorSubject.
   * This bypasses the observable pipeline and is guaranteed to be synchronous.
   * Use this when you need the absolute latest value without any potential
   * timing issues from shareReplay/refCount.
   *
   * @internal
   */
  getParticipantsSnapshot = () => {
    return this.participantsSubject.getValue();
  };

  /**
   * Sets the list of participants in the current call.
   *
   * @internal
   *
   * @param participants the list of participants.
   */
  setParticipants = (participants: Patch<StreamVideoParticipant[]>) => {
    return setCurrentValue(this.participantsSubject, participants);
  };

  /** The local participant in the current call. */
  get localParticipant() {
    return getCurrentValue(this.localParticipant$);
  }

  /** The list of remote participants in the current call. */
  get remoteParticipants() {
    return getCurrentValue(this.remoteParticipants$);
  }

  /** The dominant speaker in the current call. */
  get dominantSpeaker() {
    return getCurrentValue(this.dominantSpeaker$);
  }

  /** The list of pinned participants in the current call. */
  get pinnedParticipants() {
    return getCurrentValue(this.pinnedParticipants$);
  }

  /** Tell if there is an ongoing screen share in this call. */
  get hasOngoingScreenShare() {
    return getCurrentValue(this.hasOngoingScreenShare$);
  }

  /** The calling state. */
  get callingState() {
    return getCurrentValue(this.callingStateSubject);
  }

  /**
   * Sets the calling state.
   *
   * @internal
   * @param state the new calling state.
   */
  setCallingState = (state: Patch<CallingState>) => {
    return setCurrentValue(this.callingStateSubject, state);
  };

  /** The call stats report. */
  get callStatsReport() {
    return getCurrentValue(this.callStatsReportSubject);
  }

  /**
   * Returns whether the call stats report is being observed or not.
   * @internal
   */
  get isCallStatsReportObserved() {
    return this.callStatsReportSubject.observed;
  }

  /**
   * Sets the call stats report.
   *
   * @internal
   * @param report the report to set.
   */
  setCallStatsReport = (report: Patch<CallStatsReport | undefined>) => {
    return setCurrentValue(this.callStatsReportSubject, report);
  };

  /** The members of the current call. */
  get members() {
    return getCurrentValue(this.membersSubject);
  }

  /**
   * Sets the members of the current call.
   *
   * @internal
   * @param members the members to set.
   */
  setMembers = (members: Patch<MemberResponse[]>) => {
    setCurrentValue(this.membersSubject, members);
  };

  /** The capabilities of the current user for the current call. */
  get ownCapabilities() {
    return getCurrentValue(this.ownCapabilities$);
  }

  /**
   * Sets the own capabilities.
   *
   * @internal
   * @param capabilities the capabilities to set.
   */
  setOwnCapabilities = (capabilities: Patch<OwnCapability[]>) => {
    return setCurrentValue(this.ownCapabilitiesSubject, capabilities);
  };

  /**
   * Sets the call grants (used for own capabilities).
   *
   * @internal
   * @param grants the grants to set.
   */
  setCallGrants = (grants: Patch<CallGrants>) => {
    return setCurrentValue(this.callGrantsSubject, grants);
  };

  /** The backstage state. */
  get backstage() {
    return getCurrentValue(this.backstageSubject);
  }

  /**
   * Sets the backstage state.
   * @param backstage the backstage state.
   */
  setBackstage = (backstage: Patch<boolean>) => {
    return setCurrentValue(this.backstageSubject, backstage);
  };

  /** Will provide the list of blocked user IDs. */
  get blockedUserIds() {
    return getCurrentValue(this.blockedUserIdsSubject);
  }

  /** Will provide the time when this call has been created. */
  get createdAt() {
    return getCurrentValue(this.createdAtSubject);
  }

  /** Will provide the time when this call has been ended. */
  get endedAt() {
    return getCurrentValue(this.endedAtSubject);
  }

  /**
   * Sets the time when this call has been ended.
   * @param endedAt the time when this call has been ended.
   */
  setEndedAt = (endedAt: Patch<Date | undefined>) => {
    return setCurrentValue(this.endedAtSubject, endedAt);
  };

  /** Will provide the time when this call has been scheduled to start. */
  get startsAt() {
    return getCurrentValue(this.startsAtSubject);
  }

  /** Will provide the time when this call has been updated. */
  get updatedAt() {
    return getCurrentValue(this.updatedAtSubject);
  }

  /** Will provide the user who created this call. */
  get createdBy() {
    return getCurrentValue(this.createdBySubject);
  }

  /** Will provide the custom data of this call. */
  get custom() {
    return getCurrentValue(this.customSubject);
  }

  /**
   * Will provide the egress data of this call.
   */
  get egress() {
    return getCurrentValue(this.egressSubject);
  }

  /** Will provide the ingress data of this call. */
  get ingress() {
    return getCurrentValue(this.ingressSubject);
  }

  /** Will provide the composite recording state of this call. */
  get recording() {
    return getCurrentValue(this.recordingSubject);
  }

  /** Will provide the individual recording state of this call. */
  get individualRecording() {
    return getCurrentValue(this.individualRecordingSubject);
  }

  /** Will provide the raw recording state of this call. */
  get rawRecording() {
    return getCurrentValue(this.rawRecordingSubject);
  }

  /** Will provide the session data of this call. */
  get session() {
    return getCurrentValue(this.sessionSubject);
  }

  /** Will provide the settings of this call. */
  get settings() {
    return getCurrentValue(this.settingsSubject);
  }

  /** Will provide the transcribing state of this call. */
  get transcribing() {
    return getCurrentValue(this.transcribingSubject);
  }

  /** Whether end-to-end encryption is active for this call. */
  get e2eeEnabled() {
    return getCurrentValue(this.e2eeEnabledSubject);
  }

  /** Will provide the user who ended this call. */
  get endedBy() {
    return getCurrentValue(this.endedBySubject);
  }

  /**
   * Will provide the thumbnails of this call, if enabled in the call settings.
   */
  get thumbnails() {
    return getCurrentValue(this.thumbnailsSubject);
  }

  /** Returns the current queue of closed captions. */
  get closedCaptions() {
    return getCurrentValue(this.closedCaptionsSubject);
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

  /** Returns a new lookup table of participants indexed by their session ID. */
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
      this.logger.debug(`Participant with sessionId ${sessionId} not found`);
      return;
    }

    const thePatch = typeof patch === 'function' ? patch(participant) : patch;
    const updatedParticipant: StreamVideoParticipant = {
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
   * @param patch an optional patch to apply to the participant.
   */
  updateOrAddParticipant = (
    sessionId: string,
    participant: StreamVideoParticipant,
    patch?:
      | StreamVideoParticipantPatch
      | ((p: StreamVideoParticipant) => StreamVideoParticipantPatch),
  ) => {
    return this.setParticipants((participants) => {
      let add = true;
      const nextParticipants = participants.map((p) => {
        if (p.sessionId === sessionId) {
          add = false;
          const updated: StreamVideoParticipant = { ...p, ...participant };
          const thePatch = typeof patch === 'function' ? patch(updated) : patch;
          return Object.assign(updated, thePatch);
        }
        return p;
      });
      if (add) nextParticipants.push(participant);
      return nextParticipants;
    });
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
    if (Object.keys(patch).length === 0) return this.participants;
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
   * Update track subscription configuration for one or more participants.
   * You have to create a subscription for each participant for all the different kinds of tracks you want to receive.
   * You can only subscribe for tracks after the participant started publishing the given kind of track.
   *
   * @param trackType the kind of subscription to update.
   * @param changes the list of subscription changes to do.
   */
  updateParticipantTracks = (
    trackType: VideoTrackType,
    changes: SubscriptionChanges,
  ) => {
    return this.updateParticipants(
      Object.entries(changes).reduce<StreamVideoParticipantPatches>(
        (acc, [sessionId, change]) => {
          if (change.dimension) {
            change.dimension.height = Math.ceil(change.dimension.height);
            change.dimension.width = Math.ceil(change.dimension.width);
          }
          const prop: keyof StreamVideoParticipant | undefined =
            trackType === 'videoTrack'
              ? 'videoDimension'
              : trackType === 'screenShareTrack'
                ? 'screenShareDimension'
                : undefined;
          if (prop) {
            acc[sessionId] = {
              [prop]: change.dimension,
            };
          }
          return acc;
        },
        {},
      ),
    );
  };

  /**
   * Updates the call state with the data received from the server.
   *
   * @internal
   *
   * @param event the video event that our backend sent us.
   */
  updateFromEvent = (event: VideoEvent) => {
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
    const now = Date.now();
    const unknownSymbol = Symbol('unknown');

    // generate a lookup table of pinnedAt timestamps by userId and sessionId
    // if there are multiple pins for the same userId, then we set the pinnedAt
    // to `unknown` (for that userId lookup) so that we don't apply any pin for that participant
    // this is to avoid conflicts during reconstruction of the pin state after reconnections
    // as sessionIds can change
    const pinnedAtByIdentifier = pins.reduce<
      Record<string, number | undefined | typeof unknownSymbol>
    >((lookup, pin, index) => {
      const pinnedAt = now + (pins.length - index);

      if (lookup[pin.userId]) {
        lookup[pin.userId] = unknownSymbol;
      } else {
        lookup[pin.userId] = pinnedAt;
      }

      lookup[pin.sessionId] ??= pinnedAt;

      return lookup;
    }, {});

    return this.setParticipants((participants) =>
      participants.map((participant) => {
        // first check by sessionId as that is 100% correct, then by attempt reconstruction by userId
        const serverSidePinnedAt =
          pinnedAtByIdentifier[participant.sessionId] ??
          pinnedAtByIdentifier[participant.userId];

        // the participant is newly pinned
        if (
          typeof serverSidePinnedAt === 'number' &&
          typeof participant.pin?.pinnedAt !== 'number'
        ) {
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
        if (
          typeof serverSidePinnedAt !== 'number' &&
          participant.pin?.isLocalPin === false
        ) {
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
   * Adds an orphaned track to the call state.
   *
   * @internal
   *
   * @param orphanedTrack the orphaned track to add.
   */
  registerOrphanedTrack = (orphanedTrack: OrphanedTrack) => {
    this.orphanedTracks.push(orphanedTrack);
  };

  /**
   * Removes an orphaned track from the call state.
   *
   * @internal
   *
   * @param id the ID of the orphaned track to remove.
   */
  removeOrphanedTrack = (id: string) => {
    this.orphanedTracks = this.orphanedTracks.filter((o) => o.id !== id);
  };

  /**
   * Drops every orphaned track. Call this when the peer connections that own
   * the stored receivers go away (full leave, reconnect, or migration):
   * `pc.close()` does not raise the track `ended` event, so the per-track
   * cleanup never fires and the receivers + their closed PCs would otherwise
   * leak for the call's lifetime.
   *
   * @internal
   */
  removeAllOrphanedTracks = () => {
    this.orphanedTracks = [];
  };

  /**
   * Takes all orphaned tracks with the given track lookup prefix.
   * All orphaned tracks with the given track lookup prefix are removed from the call state.
   *
   * @internal
   *
   * @param trackLookupPrefix the track lookup prefix to match the orphaned tracks by.
   */
  takeOrphanedTracks = (trackLookupPrefix: string): OrphanedTrack[] => {
    const orphans = this.orphanedTracks.filter(
      (orphan) => orphan.trackLookupPrefix === trackLookupPrefix,
    );
    if (orphans.length > 0) {
      this.orphanedTracks = this.orphanedTracks.filter(
        (orphan) => orphan.trackLookupPrefix !== trackLookupPrefix,
      );
    }
    return orphans;
  };

  /**
   * Updates the closed captions settings.
   *
   * @param config the new closed captions settings.
   */
  updateClosedCaptionSettings = (config: Partial<ClosedCaptionsSettings>) => {
    this.closedCaptionsSettings = { ...this.closedCaptionsSettings, ...config };
  };

  /**
   * Updates the call state with the data received from the server.
   *
   * @internal
   *
   * @param call the call response from the server.
   */
  updateFromCallResponse = (call: CallResponse) => {
    this.setBackstage(call.backstage);
    setCurrentValue(this.blockedUserIdsSubject, call.blocked_user_ids);
    setCurrentValue(this.createdAtSubject, new Date(call.created_at));
    setCurrentValue(this.updatedAtSubject, new Date(call.updated_at));
    setCurrentValue(
      this.startsAtSubject,
      call.starts_at ? new Date(call.starts_at) : undefined,
    );
    this.setEndedAt(call.ended_at ? new Date(call.ended_at) : undefined);
    setCurrentValue(this.createdBySubject, call.created_by);
    setCurrentValue(this.customSubject, call.custom);
    setCurrentValue(this.egressSubject, call.egress);
    setCurrentValue(this.ingressSubject, call.ingress);
    const { individual_recording, composite_recording, raw_recording } =
      call.egress;
    setCurrentValue(
      this.recordingSubject,
      call.recording || composite_recording?.status === 'running',
    );
    setCurrentValue(
      this.individualRecordingSubject,
      individual_recording?.status === 'running',
    );
    setCurrentValue(
      this.rawRecordingSubject,
      raw_recording?.status === 'running',
    );

    const s = setCurrentValue(this.sessionSubject, call.session);
    this.updateParticipantCountFromSession(s);
    setCurrentValue(this.settingsSubject, call.settings);
    setCurrentValue(this.transcribingSubject, call.transcribing);
    setCurrentValue(this.captioningSubject, call.captioning);
    setCurrentValue(this.thumbnailsSubject, call.thumbnails);
  };

  /**
   * Updates the call state with the data received from the SFU server.
   *
   * @internal
   *
   * @param callState the call state from the SFU server.
   * @param currentSessionId the session ID of the current user.
   * @param reconnectDetails optional reconnect details.
   */
  updateFromSfuCallState = (
    callState: SfuCallState,
    currentSessionId: string,
    reconnectDetails?: ReconnectDetails,
  ) => {
    const { participants, participantCount, startedAt, pins, e2EeEnabled } =
      callState;
    const localPublishedTracks =
      reconnectDetails?.announcedTracks.map((t) => t.trackType) ?? [];
    this.setParticipants(() => {
      const participantLookup = this.getParticipantLookupBySessionId();
      return participants.map<StreamVideoParticipant>((p) => {
        // We need to preserve the local state of the participant
        // (e.g. videoDimension, visibilityState, pinnedAt, etc.)
        // as it doesn't exist on the server.
        const existingParticipant = participantLookup[p.sessionId];
        const isLocalParticipant = p.sessionId === currentSessionId;
        return Object.assign({}, existingParticipant, p, {
          isLocalParticipant,
          publishedTracks: isLocalParticipant
            ? localPublishedTracks
            : p.publishedTracks,
          viewportVisibilityState:
            existingParticipant?.viewportVisibilityState ?? {
              videoTrack: VisibilityState.UNKNOWN,
              screenShareTrack: VisibilityState.UNKNOWN,
            },
        } satisfies Partial<StreamVideoParticipant>);
      });
    });

    this.setParticipantCount(participantCount?.total || 0);
    this.setAnonymousParticipantCount(participantCount?.anonymous || 0);
    this.setStartedAt(startedAt ? Timestamp.toDate(startedAt) : new Date());
    this.setServerSidePins(pins);
    setCurrentValue(this.e2eeEnabledSubject, e2EeEnabled);
  };

  private updateFromMemberRemoved = (event: CallMemberRemovedEvent) => {
    this.updateFromCallResponse(event.call);
    setCurrentValue(this.membersSubject, (members) =>
      members.filter((m) => event.members.indexOf(m.user_id) === -1),
    );
  };

  private updateFromMemberAdded = (event: CallMemberAddedEvent) => {
    this.updateFromCallResponse(event.call);
    setCurrentValue(this.membersSubject, (members) => [
      ...members,
      ...event.members,
    ]);
  };

  private updateFromHLSBroadcastStopped = () => {
    setCurrentValue(this.egressSubject, (egress = defaultEgress) => ({
      ...egress,
      broadcasting: false,
      hls: {
        ...egress.hls!,
        status: '',
      },
    }));
  };

  private updateFromHLSBroadcastingFailed = () => {
    setCurrentValue(this.egressSubject, (egress = defaultEgress) => ({
      ...egress,
      broadcasting: false,
      hls: {
        ...egress.hls!,
        status: '',
      },
    }));
  };

  private updateFromRecordingEvent = (
    type: CallRecordingType | undefined,
    running: boolean,
  ) => {
    // handle the legacy format, where `type` is absent in the emitted events
    if (type === undefined || type === 'composite') {
      setCurrentValue(this.recordingSubject, running);
    } else if (type === 'individual') {
      setCurrentValue(this.individualRecordingSubject, running);
    } else if (type === 'raw') {
      setCurrentValue(this.rawRecordingSubject, running);
    } else {
      ensureExhausted(type, 'Unknown recording type');
    }
  };

  private updateParticipantCountFromSession = (
    session: CallSessionResponse | undefined,
  ) => {
    // when in JOINED state, we should use the participant count coming through
    // the SFU healthcheck event, as it's more accurate.
    if (!session || this.callingState === CallingState.JOINED) return;
    const byRoleCount = Object.values(
      session.participants_count_by_role,
    ).reduce((total, countByRole) => total + countByRole, 0);
    const participantCount = Math.max(byRoleCount, session.participants.length);
    this.setParticipantCount(participantCount);
    this.setAnonymousParticipantCount(session.anonymous_participant_count || 0);
  };

  private updateFromSessionParticipantCountUpdate = (
    event: CallSessionParticipantCountsUpdatedEvent,
  ) => {
    const s = setCurrentValue(this.sessionSubject, (session) => {
      if (!session) return session;
      return {
        ...session,
        anonymous_participant_count: event.anonymous_participant_count,
        participants_count_by_role: event.participants_count_by_role,
      };
    });
    this.updateParticipantCountFromSession(s);
  };

  private updateFromSessionParticipantLeft = (
    event: CallSessionParticipantLeftEvent,
  ) => {
    const s = setCurrentValue(this.sessionSubject, (session) => {
      if (!session) return session;
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
    this.updateParticipantCountFromSession(s);
  };

  private updateFromSessionParticipantJoined = (
    event: CallSessionParticipantJoinedEvent,
  ) => {
    const s = setCurrentValue(this.sessionSubject, (session) => {
      if (!session) return session;
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
    this.updateParticipantCountFromSession(s);
  };

  private updateMembers = (
    event: CallMemberUpdatedEvent | CallMemberUpdatedPermissionEvent,
  ) => {
    this.updateFromCallResponse(event.call);
    setCurrentValue(this.membersSubject, (members) =>
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
    setCurrentValue(this.blockedUserIdsSubject, (current) => {
      if (!current) return current;
      return current.filter((id) => id !== event.user.id);
    });
  };

  private blockUser = (event: BlockedUserEvent) => {
    setCurrentValue(this.blockedUserIdsSubject, (current) => [
      ...(current || []),
      event.user.id,
    ]);
  };

  private updateOwnCapabilities = (event: UpdatedCallPermissionsEvent) => {
    if (event.user.id === this.localParticipant?.userId) {
      this.setOwnCapabilities(event.own_capabilities);
    }
  };

  private updateFromClosedCaptions = (event: ClosedCaptionEvent) => {
    setCurrentValue(this.closedCaptionsSubject, (queue) => {
      const { closed_caption } = event;

      const keyOf = (c: CallClosedCaption) => `${c.speaker_id}/${c.start_time}`;
      const currentKey = keyOf(closed_caption);

      const duplicate = queue.some((caption) => keyOf(caption) === currentKey);
      if (duplicate) return queue;

      const nextQueue = [...queue, closed_caption];

      const { visibilityDurationMs = 2700, maxVisibleCaptions = 2 } =
        this.closedCaptionsSettings || {};
      // schedule the removal of the closed caption after the retention time
      if (visibilityDurationMs > 0) {
        const taskId = setTimeout(() => {
          setCurrentValue(this.closedCaptionsSubject, (captions) =>
            captions.filter((caption) => caption !== closed_caption),
          );
          this.closedCaptionsTasks.delete(currentKey);
        }, visibilityDurationMs);
        this.closedCaptionsTasks.set(currentKey, taskId);

        // cancel the cleanup tasks for the closed captions that are no longer in the queue
        for (let i = 0; i < nextQueue.length - maxVisibleCaptions; i++) {
          const key = keyOf(nextQueue[i]);
          const task = this.closedCaptionsTasks.get(key);
          clearTimeout(task);
          this.closedCaptionsTasks.delete(key);
        }
      }

      // trim the queue
      return nextQueue.slice(-maxVisibleCaptions);
    });
  };
}
