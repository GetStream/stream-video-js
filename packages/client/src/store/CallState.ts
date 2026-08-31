import { StateStore } from '@stream-io/state-store';
import { field, type Subscribable } from './subscribable';
import { type Patch, preserveArrayIdentity, resolvePatch } from './patch';
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

/**
 * Returns the default egress object - when no egress data is available.
 */
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
 * The shape of the call state.
 *
 * Declared as a `type` rather than an `interface` on purpose: `StateStore`
 * constrains its state to `Record<string, unknown>`, which an interface does
 * not satisfy (it has no implicit index signature).
 */
export type CallStateShape = {
  // -- state driven by the coordinator and the SFU --
  backstage: boolean;
  blockedUserIds: string[];
  callingState: CallingState;

  /**
   * The latest stats report, or `undefined` while nothing is watching.
   *
   * Collecting WebRTC stats is expensive, so the SDK only does it while
   * something has registered interest. Subscribing to
   * {@link CallState.callStatsReport$} (or using the `useCallStatsReport`
   * hook) registers that for you. Reading this field off the store instead -
   * through `useCallStateSelector` or `store.subscribeWithSelector` - cannot
   * be detected, so call {@link CallState.observeCallStatsReport} yourself or
   * this stays `undefined` forever.
   */
  callStatsReport: CallStatsReport | undefined;
  captioning: boolean;
  closedCaptions: CallClosedCaption[];
  createdAt: Date;
  createdBy: UserResponse | undefined;
  custom: Record<string, any>;
  e2eeEnabled: boolean;
  egress: EgressResponse | undefined;
  endedAt: Date | undefined;
  endedBy: UserResponse | undefined;
  individualRecording: boolean;
  ingress: CallIngressResponse | undefined;
  members: MemberResponse[];
  participantCount: number;
  anonymousParticipantCount: number;
  rawRecording: boolean;
  recording: boolean;
  session: CallSessionResponse | undefined;
  settings: CallSettingsResponse | undefined;
  startedAt: Date | undefined;
  startsAt: Date | undefined;
  thumbnails: ThumbnailResponse | undefined;
  transcribing: boolean;
  updatedAt: Date;

  /**
   * All participants of the call, sorted by the active sort preset.
   */
  participants: StreamVideoParticipant[];

  /**
   * The capabilities as reported by the coordinator, before the SFU's call
   * grants are applied. Read {@link CallStateShape.ownCapabilities} instead.
   */
  ownCapabilitiesRaw: OwnCapability[];

  /**
   * The latest call grants from the SFU, if any have been received.
   */
  callGrants: CallGrants | undefined;

  // -- derived state, maintained by the preprocessor; never write these --
  localParticipant: StreamVideoParticipant | undefined;
  remoteParticipants: StreamVideoParticipant[];
  pinnedParticipants: StreamVideoParticipant[];
  dominantSpeaker: StreamVideoParticipant | undefined;
  hasOngoingScreenShare: boolean;
  ownCapabilities: OwnCapability[];

  /**
   * Participants indexed by session ID.
   *
   * Built once per participant change so that the many per-participant
   * subscribers in a call (one per tile, plus the Dynascale bindings) can look
   * themselves up in constant time. Scanning the array in each of them instead
   * makes a single participant update cost O(participants x subscribers).
   */
  participantsBySessionId: Record<string, StreamVideoParticipant | undefined>;
};

const initialCallState = (): CallStateShape => ({
  backstage: true,
  blockedUserIds: [],
  callingState: CallingState.UNKNOWN,
  callStatsReport: undefined,
  captioning: false,
  closedCaptions: [],
  createdAt: new Date(),
  createdBy: undefined,
  custom: {},
  e2eeEnabled: false,
  egress: undefined,
  endedAt: undefined,
  endedBy: undefined,
  individualRecording: false,
  ingress: undefined,
  members: [],
  participantCount: 0,
  anonymousParticipantCount: 0,
  rawRecording: false,
  recording: false,
  session: undefined,
  settings: undefined,
  startedAt: undefined,
  startsAt: undefined,
  thumbnails: undefined,
  transcribing: false,
  updatedAt: new Date(),

  participants: [],
  ownCapabilitiesRaw: [],
  callGrants: undefined,

  localParticipant: undefined,
  remoteParticipants: [],
  pinnedParticipants: [],
  dominantSpeaker: undefined,
  hasOngoingScreenShare: false,
  ownCapabilities: [],
  participantsBySessionId: {},
});

/**
 * Applies the SFU's call grants on top of the coordinator's capabilities.
 * Grants take precedence.
 */
const applyCallGrants = (
  capabilities: OwnCapability[],
  grants: CallGrants | undefined,
): OwnCapability[] => {
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

    if (allowed && !nextCapabilities.includes(capability)) {
      nextCapabilities.push(capability);
    } else if (!allowed && nextCapabilities.includes(capability)) {
      const index = nextCapabilities.indexOf(capability);
      nextCapabilities.splice(index, 1);
    }
  }
  return nextCapabilities;
};

/**
 * Applies the server's pin list to a participant list, returning a new list.
 *
 * Pure so that callers which also replace the participants (the SFU join
 * payload) can apply both in a single store write, rather than letting
 * subscribers observe the new participants with stale pins in between.
 */
const applyServerSidePins = (
  participants: StreamVideoParticipant[],
  pins: Pin[],
): StreamVideoParticipant[] => {
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

  return participants.map((participant) => {
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
  });
};

/**
 * Holds the state of the current call.
 *
 * All state lives in a single {@link StateStore}, so a server payload that
 * touches many fields is applied as one atomic update - subscribers never
 * observe a partially applied change.
 *
 * @react You don't have to use this class directly, as we are exposing the state through Hooks.
 */
export class CallState {
  /**
   * The backing store holding the entire call state.
   *
   * Use it to read or subscribe to several values at once; the individual
   * `$` properties below are views over it.
   */
  readonly store = new StateStore<CallStateShape>(initialCallState());

  /**
   * All participants of the current call (this includes the current user and other participants as well),
   * sorted according to the current `sortByParticipantsBy` setting
   */
  readonly participants$: Subscribable<StreamVideoParticipant[]>;

  /**
   * All participants of the current call (this includes the current user and other participants as well).
   *
   * @deprecated sorting is applied in place, so this is the same array as
   * {@link CallState.participants$}. Use that instead.
   */
  readonly rawParticipants$: Subscribable<StreamVideoParticipant[]>;

  /**
   * Remote participants of the current call (this includes every participant except the logged-in user).
   */
  readonly remoteParticipants$: Subscribable<StreamVideoParticipant[]>;

  /**
   * The local participant of the current call (the logged-in user).
   */
  readonly localParticipant$: Subscribable<StreamVideoParticipant | undefined>;

  /**
   * Pinned participants of the current call.
   */
  readonly pinnedParticipants$: Subscribable<StreamVideoParticipant[]>;

  /**
   * The currently elected dominant speaker in the current call.
   */
  readonly dominantSpeaker$: Subscribable<StreamVideoParticipant | undefined>;

  /**
   * Emits true whenever there is an active screen sharing session within
   * the current call.
   */
  readonly hasOngoingScreenShare$: Subscribable<boolean>;

  /**
   * The time the call session actually started.
   */
  readonly startedAt$: Subscribable<Date | undefined>;

  /**
   * The server-side counted number of participants connected to the current call.
   */
  readonly participantCount$: Subscribable<number>;

  /**
   * The server-side counted number of anonymous participants.
   */
  readonly anonymousParticipantCount$: Subscribable<number>;

  /**
   * The latest stats report of the current call.
   */
  readonly callStatsReport$: Subscribable<CallStatsReport | undefined>;

  /**
   * The list of members in the current call.
   */
  readonly members$: Subscribable<MemberResponse[]>;

  /**
   * The list of capabilities of the current user.
   */
  readonly ownCapabilities$: Subscribable<OwnCapability[]>;

  /**
   * The calling state.
   */
  readonly callingState$: Subscribable<CallingState>;

  /**
   * The backstage state.
   */
  readonly backstage$: Subscribable<boolean>;

  /**
   * Will provide the list of blocked user IDs.
   */
  readonly blockedUserIds$: Subscribable<string[]>;

  /**
   * Will provide the time when this call has been created.
   */
  readonly createdAt$: Subscribable<Date>;

  /**
   * Will provide the time when this call has been ended.
   */
  readonly endedAt$: Subscribable<Date | undefined>;

  /**
   * Will provide the time when this call has been scheduled to start.
   */
  readonly startsAt$: Subscribable<Date | undefined>;

  /**
   * Will provide the time when this call has been updated.
   */
  readonly updatedAt$: Subscribable<Date>;

  /**
   * Will provide the user who created this call.
   */
  readonly createdBy$: Subscribable<UserResponse | undefined>;

  /**
   * Will provide the custom data of this call.
   */
  readonly custom$: Subscribable<Record<string, any>>;

  /**
   * Will provide the egress data of this call.
   */
  readonly egress$: Subscribable<EgressResponse | undefined>;

  /**
   * Will provide the ingress data of this call.
   */
  readonly ingress$: Subscribable<CallIngressResponse | undefined>;

  /**
   * Will provide the composite recording state of this call.
   */
  readonly recording$: Subscribable<boolean>;

  /**
   * Will provide the individual recording state of this call.
   */
  readonly individualRecording$: Subscribable<boolean>;

  /**
   * Will provide the raw recording state of this call.
   */
  readonly rawRecording$: Subscribable<boolean>;

  /**
   * Will provide the session data of this call.
   */
  readonly session$: Subscribable<CallSessionResponse | undefined>;

  /**
   * Will provide the settings of this call.
   */
  readonly settings$: Subscribable<CallSettingsResponse | undefined>;

  /**
   * Will provide the transcribing state of this call.
   */
  readonly transcribing$: Subscribable<boolean>;

  /**
   * Will provide the closed captioning state of this call.
   */
  readonly captioning$: Subscribable<boolean>;

  /**
   * Whether end-to-end encryption is active for this call, as reported by the
   * SFU in the join response.
   */
  readonly e2eeEnabled$: Subscribable<boolean>;

  /**
   * Will provide the user who ended this call.
   */
  readonly endedBy$: Subscribable<UserResponse | undefined>;

  /**
   * Will provide the thumbnails of this call.
   */
  readonly thumbnails$: Subscribable<ThumbnailResponse | undefined>;

  /**
   * The queue of closed captions.
   */
  readonly closedCaptions$: Subscribable<CallClosedCaption[]>;

  readonly logger = videoLoggerSystem.getLogger('CallState');

  // These are tracks that were delivered to the Subscriber's onTrack event
  // that we couldn't associate with a participant yet.
  private orphanedTracks: OrphanedTrack[] = [];

  /**
   * A list of comparators that are used to sort the participants.
   */
  private sortParticipantsBy = defaultSortPreset;

  /**
   * The closed captions configuration.
   */
  private closedCaptionsSettings: ClosedCaptionsSettings | undefined;
  private closedCaptionsTasks = new Map<string, NodeJS.Timeout>();

  /**
   * Open registrations made through {@link CallState.observeCallStatsReport}.
   */
  private callStatsReportObservers = 0;

  private readonly eventHandlers: {
    [EventType in VideoEvent['type']]:
      ((event: Extract<VideoEvent, { type: EventType }>) => void) | undefined;
  };

  /**
   * Creates a new instance of the CallState class.
   */
  constructor() {
    // derived state is recomputed here, so that every subscriber observes one
    // atomic, internally consistent snapshot
    this.store.addPreprocessor((next, previous) => {
      if (next.participants !== previous?.participants) {
        // sorting is in place, deliberately: it keeps the sort stable across
        // updates and avoids allocating a second array
        const participants = next.participants.sort(this.sortParticipantsBy);

        // One pass, not six. Each derived collection used to be its own
        // find/filter/some over the roster, so a participant update walked it
        // six times on top of the sort.
        //
        // `participantsBySessionId` is a plain property, not a lazy getter:
        // `Object.defineProperty` on every state object pushes it into V8
        // dictionary mode, which made *all* state reads an order of magnitude
        // slower. Unrelated updates carry it forward through the spread, so it
        // is rebuilt only when the participant list itself changes.
        const bySessionId: Record<string, StreamVideoParticipant | undefined> =
          {};
        let localParticipant: StreamVideoParticipant | undefined;
        const remoteParticipants: StreamVideoParticipant[] = [];
        const pinnedParticipants: StreamVideoParticipant[] = [];
        let dominantSpeaker: StreamVideoParticipant | undefined;
        let hasOngoingScreenShare = false;

        for (const participant of participants) {
          bySessionId[participant.sessionId] = participant;

          if (participant.isLocalParticipant) {
            // first one wins, matching the `find` this replaces
            localParticipant ??= participant;
          } else {
            remoteParticipants.push(participant);
          }

          if (participant.pin) pinnedParticipants.push(participant);

          if (!dominantSpeaker && participant.isDominantSpeaker) {
            dominantSpeaker = participant;
          }

          // `some` short-circuited, so don't keep asking once it is known
          if (!hasOngoingScreenShare && hasScreenShare(participant)) {
            hasOngoingScreenShare = true;
          }
        }

        next.localParticipant = localParticipant;
        next.remoteParticipants = remoteParticipants;
        next.pinnedParticipants = pinnedParticipants;
        next.dominantSpeaker = dominantSpeaker;
        next.hasOngoingScreenShare = hasOngoingScreenShare;
        next.participantsBySessionId = bySessionId;
      }

      if (
        next.ownCapabilitiesRaw !== previous?.ownCapabilitiesRaw ||
        next.callGrants !== previous?.callGrants
      ) {
        next.ownCapabilities = preserveArrayIdentity(
          previous?.ownCapabilities ?? [],
          applyCallGrants(next.ownCapabilitiesRaw, next.callGrants),
        );
      }
    });

    this.participants$ = field(this.store, 'participants');
    this.rawParticipants$ = this.participants$;
    this.localParticipant$ = field(this.store, 'localParticipant');
    this.remoteParticipants$ = field(this.store, 'remoteParticipants');
    this.pinnedParticipants$ = field(this.store, 'pinnedParticipants');
    this.dominantSpeaker$ = field(this.store, 'dominantSpeaker');
    this.hasOngoingScreenShare$ = field(this.store, 'hasOngoingScreenShare');
    this.ownCapabilities$ = field(this.store, 'ownCapabilities');

    this.anonymousParticipantCount$ = field(
      this.store,
      'anonymousParticipantCount',
    );
    this.backstage$ = field(this.store, 'backstage');
    this.blockedUserIds$ = field(this.store, 'blockedUserIds');
    this.callingState$ = field(this.store, 'callingState');
    this.callStatsReport$ = field(this.store, 'callStatsReport');
    this.captioning$ = field(this.store, 'captioning');
    this.closedCaptions$ = field(this.store, 'closedCaptions');
    this.createdAt$ = field(this.store, 'createdAt');
    this.createdBy$ = field(this.store, 'createdBy');
    this.custom$ = field(this.store, 'custom');
    this.e2eeEnabled$ = field(this.store, 'e2eeEnabled');
    this.egress$ = field(this.store, 'egress');
    this.endedAt$ = field(this.store, 'endedAt');
    this.endedBy$ = field(this.store, 'endedBy');
    this.individualRecording$ = field(this.store, 'individualRecording');
    this.ingress$ = field(this.store, 'ingress');
    this.members$ = field(this.store, 'members');
    this.participantCount$ = field(this.store, 'participantCount');
    this.rawRecording$ = field(this.store, 'rawRecording');
    this.recording$ = field(this.store, 'recording');
    this.session$ = field(this.store, 'session');
    this.settings$ = field(this.store, 'settings');
    this.startedAt$ = field(this.store, 'startedAt');
    this.startsAt$ = field(this.store, 'startsAt');
    this.thumbnails$ = field(this.store, 'thumbnails');
    this.transcribing$ = field(this.store, 'transcribing');
    this.updatedAt$ = field(this.store, 'updatedAt');

    this.eventHandlers = {
      // these events are not updating the call state:
      'call.frame_recording_ready': undefined,
      'call.kicked_user': undefined,
      'call.moderation_blur': undefined,
      'call.moderation_warning': undefined,
      'call.permission_request': undefined,
      'call.recording_ready': undefined,
      'call.rtmp_broadcast_failed': undefined,
      'call.rtmp_broadcast_started': undefined,
      'call.rtmp_broadcast_stopped': undefined,
      'call.stats_report_ready': undefined,
      'call.transcription_ready': undefined,
      'call.user_feedback_submitted': undefined,
      'call.user_muted': undefined,
      'connection.error': undefined,
      'connection.ok': undefined,
      'health.check': undefined,
      'user.updated': undefined,
      custom: undefined,

      // events that update call state:
      'call.accepted': (e) => this.updateFromCallResponse(e.call),
      'call.blocked_user': this.blockUser,
      'call.closed_caption': this.updateFromClosedCaptions,
      'call.closed_captions_failed': () => {
        this.store.partialNext({ captioning: false });
      },
      'call.closed_captions_started': () => {
        this.store.partialNext({ captioning: true });
      },
      'call.closed_captions_stopped': () => {
        this.store.partialNext({ captioning: false });
      },
      'call.created': (e) => this.updateFromCallResponse(e.call),
      'call.deleted': (e) => this.updateFromCallResponse(e.call),
      'call.ended': (e) => {
        this.updateFromCallResponse(e.call);
        this.store.partialNext({ endedBy: e.user });
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
        this.store.partialNext({ transcribing: true });
      },
      'call.transcription_stopped': () => {
        this.store.partialNext({ transcribing: false });
      },
      'call.transcription_failed': () => {
        this.store.partialNext({ transcribing: false });
      },
      'call.unblocked_user': this.unblockUser,
      'call.updated': (e) => this.updateFromCallResponse(e.call),
    };
  }

  /**
   * Runs the cleanup tasks.
   */
  dispose = () => {
    for (const [ccKey, taskId] of this.closedCaptionsTasks.entries()) {
      clearTimeout(taskId);
      this.closedCaptionsTasks.delete(ccKey);
    }
    this.removeAllOrphanedTracks();
  };

  /**
   * Applies a partial update to the call state.
   *
   * @internal
   * @param patch the fields to update.
   */
  setState = (patch: Partial<CallStateShape>) => {
    this.store.partialNext(patch);
  };

  /**
   * Sets the list of criteria that are used to sort the participants.
   * To disable sorting, you can pass `noopComparator()`.
   *
   * @param comparator the comparator to use to sort the participants.
   */
  setSortParticipantsBy = (comparator: Comparator<StreamVideoParticipant>) => {
    this.sortParticipantsBy = comparator;
    // a fresh array makes the preprocessor re-run and re-sort
    this.setParticipants((participants) => [...participants]);
  };

  /**
   * Returns the comparator currently used to sort the participants.
   */
  getSortParticipantsBy = (): Comparator<StreamVideoParticipant> => {
    return this.sortParticipantsBy;
  };

  /**
   * The server-side counted number of participants connected to the current call.
   * This number includes the anonymous participants as well.
   */
  get participantCount() {
    return this.store.getLatestValue().participantCount;
  }

  /**
   * Sets the number of participants in the current call.
   *
   * @internal
   * @param count the number of participants.
   */
  setParticipantCount = (count: Patch<number>) => {
    const participantCount = resolvePatch(count, this.participantCount);
    this.store.partialNext({ participantCount });
    return participantCount;
  };

  /**
   * The time the call session actually started.
   * Useful for displaying the call duration.
   */
  get startedAt() {
    return this.store.getLatestValue().startedAt;
  }

  /**
   * Sets the time the call session actually started.
   *
   * @internal
   * @param startedAt the time the call session actually started.
   */
  setStartedAt = (startedAt: Patch<Date | undefined>) => {
    const next = resolvePatch(startedAt, this.startedAt);
    this.store.partialNext({ startedAt: next });
    return next;
  };

  /**
   * Returns whether closed captions are enabled in the current call.
   */
  get captioning() {
    return this.store.getLatestValue().captioning;
  }

  /**
   * Sets the closed captioning state of the current call.
   *
   * Returns the previous value together with a `rollback` function, so callers
   * can update optimistically and undo the change if the request fails.
   *
   * @internal
   * @param captioning the closed captioning state.
   */
  setCaptioning = (captioning: boolean) => {
    const lastValue = this.captioning;
    this.store.partialNext({ captioning });
    return {
      lastValue,
      value: captioning,
      rollback: () => this.store.partialNext({ captioning: lastValue }),
    };
  };

  /**
   * The server-side counted number of anonymous participants connected to the current call.
   */
  get anonymousParticipantCount() {
    return this.store.getLatestValue().anonymousParticipantCount;
  }

  /**
   * Sets the number of anonymous participants in the current call.
   *
   * @internal
   * @param count the number of anonymous participants.
   */
  setAnonymousParticipantCount = (count: Patch<number>) => {
    const next = resolvePatch(count, this.anonymousParticipantCount);
    this.store.partialNext({ anonymousParticipantCount: next });
    return next;
  };

  /**
   * The list of participants in the current call.
   */
  get participants() {
    return this.store.getLatestValue().participants;
  }

  /**
   * The list of participants in the current call.
   *
   * @deprecated sorting is applied in place, so this is the same array as
   * {@link CallState.participants}. Use that instead.
   */
  get rawParticipants() {
    return this.participants;
  }

  /**
   * Sets the list of participants in the current call.
   *
   * @internal
   *
   * @param participants the list of participants.
   */
  setParticipants = (participants: Patch<StreamVideoParticipant[]>) => {
    const next = resolvePatch(participants, this.participants);
    this.store.partialNext({ participants: next });
    // read back, so callers observe the sorted array the preprocessor produced
    return this.participants;
  };

  /**
   * The local participant in the current call.
   */
  get localParticipant() {
    return this.store.getLatestValue().localParticipant;
  }

  /**
   * The list of remote participants in the current call.
   */
  get remoteParticipants() {
    return this.store.getLatestValue().remoteParticipants;
  }

  /**
   * The dominant speaker in the current call.
   */
  get dominantSpeaker() {
    return this.store.getLatestValue().dominantSpeaker;
  }

  /**
   * The list of pinned participants in the current call.
   */
  get pinnedParticipants() {
    return this.store.getLatestValue().pinnedParticipants;
  }

  /**
   * Tell if there is an ongoing screen share in this call.
   */
  get hasOngoingScreenShare() {
    return this.store.getLatestValue().hasOngoingScreenShare;
  }

  /**
   * The calling state.
   */
  get callingState() {
    return this.store.getLatestValue().callingState;
  }

  /**
   * Sets the calling state.
   *
   * @internal
   * @param state the new calling state.
   */
  setCallingState = (state: Patch<CallingState>) => {
    const callingState = resolvePatch(state, this.callingState);
    this.store.partialNext({ callingState });
    return callingState;
  };

  /**
   * The call stats report.
   */
  get callStatsReport() {
    return this.store.getLatestValue().callStatsReport;
  }

  /**
   * Registers interest in {@link CallState.callStatsReport}, and returns a
   * function that withdraws it again. Calling the returned function more than
   * once is a no-op.
   *
   * Collecting WebRTC stats is expensive, so the SDK only does it while
   * something is watching. Subscribing to {@link CallState.callStatsReport$}
   * already counts, so the `useCallStatsReport` hook needs nothing extra. Use
   * this when you read the field off the store instead - through
   * `useCallStateSelector` or `store.subscribeWithSelector` - since a store
   * subscription cannot say which fields it cares about.
   */
  observeCallStatsReport = (): (() => void) => {
    this.callStatsReportObservers++;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.callStatsReportObservers--;
    };
  };

  /**
   * Returns whether the call stats report is being observed or not.
   *
   * True while anything is subscribed to {@link CallState.callStatsReport$},
   * or while an {@link CallState.observeCallStatsReport} registration is open.
   *
   * @internal
   */
  get isCallStatsReportObserved() {
    return this.callStatsReportObservers > 0 || this.callStatsReport$.observed;
  }

  /**
   * Sets the call stats report.
   *
   * @internal
   * @param report the report to set.
   */
  setCallStatsReport = (report: Patch<CallStatsReport | undefined>) => {
    const callStatsReport = resolvePatch(report, this.callStatsReport);
    this.store.partialNext({ callStatsReport });
    return callStatsReport;
  };

  /**
   * The members of the current call.
   */
  get members() {
    return this.store.getLatestValue().members;
  }

  /**
   * Sets the members of the current call.
   *
   * @internal
   * @param members the members to set.
   */
  setMembers = (members: Patch<MemberResponse[]>) => {
    this.store.partialNext({ members: resolvePatch(members, this.members) });
  };

  /**
   * The capabilities of the current user for the current call.
   */
  get ownCapabilities() {
    return this.store.getLatestValue().ownCapabilities;
  }

  /**
   * Sets the own capabilities.
   *
   * @internal
   * @param capabilities the capabilities to set.
   */
  setOwnCapabilities = (capabilities: Patch<OwnCapability[]>) => {
    const { ownCapabilitiesRaw } = this.store.getLatestValue();
    const next = preserveArrayIdentity(
      ownCapabilitiesRaw,
      resolvePatch(capabilities, ownCapabilitiesRaw),
    );
    this.store.partialNext({ ownCapabilitiesRaw: next });
    return this.ownCapabilities;
  };

  /**
   * Sets the call grants (used for own capabilities).
   *
   * @internal
   * @param grants the grants to set.
   */
  setCallGrants = (grants: Patch<CallGrants>) => {
    const { callGrants } = this.store.getLatestValue();
    const next = resolvePatch(grants, callGrants as CallGrants);
    this.store.partialNext({ callGrants: next });
    return next;
  };

  /**
   * The backstage state.
   */
  get backstage() {
    return this.store.getLatestValue().backstage;
  }

  /**
   * Sets the backstage state.
   * @param backstage the backstage state.
   */
  setBackstage = (backstage: Patch<boolean>) => {
    const next = resolvePatch(backstage, this.backstage);
    this.store.partialNext({ backstage: next });
    return next;
  };

  /**
   * Will provide the list of blocked user IDs.
   */
  get blockedUserIds() {
    return this.store.getLatestValue().blockedUserIds;
  }

  /**
   * Will provide the time when this call has been created.
   */
  get createdAt() {
    return this.store.getLatestValue().createdAt;
  }

  /**
   * Will provide the time when this call has been ended.
   */
  get endedAt() {
    return this.store.getLatestValue().endedAt;
  }

  /**
   * Sets the time when this call has been ended.
   * @param endedAt the time when this call has been ended.
   */
  setEndedAt = (endedAt: Patch<Date | undefined>) => {
    const next = resolvePatch(endedAt, this.endedAt);
    this.store.partialNext({ endedAt: next });
    return next;
  };

  /**
   * Will provide the time when this call has been scheduled to start.
   */
  get startsAt() {
    return this.store.getLatestValue().startsAt;
  }

  /**
   * Will provide the time when this call has been updated.
   */
  get updatedAt() {
    return this.store.getLatestValue().updatedAt;
  }

  /**
   * Will provide the user who created this call.
   */
  get createdBy() {
    return this.store.getLatestValue().createdBy;
  }

  /**
   * Will provide the custom data of this call.
   */
  get custom() {
    return this.store.getLatestValue().custom;
  }

  /**
   * Will provide the egress data of this call.
   */
  get egress() {
    return this.store.getLatestValue().egress;
  }

  /**
   * Will provide the ingress data of this call.
   */
  get ingress() {
    return this.store.getLatestValue().ingress;
  }

  /**
   * Will provide the composite recording state of this call.
   */
  get recording() {
    return this.store.getLatestValue().recording;
  }

  /**
   * Will provide the individual recording state of this call.
   */
  get individualRecording() {
    return this.store.getLatestValue().individualRecording;
  }

  /**
   * Will provide the raw recording state of this call.
   */
  get rawRecording() {
    return this.store.getLatestValue().rawRecording;
  }

  /**
   * Will provide the session data of this call.
   */
  get session() {
    return this.store.getLatestValue().session;
  }

  /**
   * Will provide the settings of this call.
   */
  get settings() {
    return this.store.getLatestValue().settings;
  }

  /**
   * Will provide the transcribing state of this call.
   */
  get transcribing() {
    return this.store.getLatestValue().transcribing;
  }

  /**
   * Whether end-to-end encryption is active for this call.
   */
  get e2eeEnabled() {
    return this.store.getLatestValue().e2eeEnabled;
  }

  /**
   * Will provide the user who ended this call.
   */
  get endedBy() {
    return this.store.getLatestValue().endedBy;
  }

  /**
   * Will provide the thumbnails of this call, if enabled in the call settings.
   */
  get thumbnails() {
    return this.store.getLatestValue().thumbnails;
  }

  /**
   * Returns the current queue of closed captions.
   */
  get closedCaptions() {
    return this.store.getLatestValue().closedCaptions;
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
    return this.store.getLatestValue().participantsBySessionId[sessionId];
  };

  /**
   * Returns the lookup table of participants indexed by their session ID.
   *
   * This is the live index held inside the current state, not a copy - it is
   * rebuilt whenever the participant list changes. **Treat it as read-only**:
   * mutating it corrupts the state every participant lookup in the SDK reads
   * from, without emitting a change. Copy it first if you need to edit one.
   */
  getParticipantLookupBySessionId = (): Readonly<{
    [sessionId: string]: StreamVideoParticipant | undefined;
  }> => {
    return this.store.getLatestValue().participantsBySessionId;
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
    return this.setParticipants((participants) =>
      applyServerSidePins(participants, pins),
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
   * Applied as a single atomic update, so subscribers never observe a
   * partially applied server payload.
   *
   * @internal
   *
   * @param call the call response from the server.
   */
  updateFromCallResponse = (call: CallResponse) => {
    const { individual_recording, composite_recording, raw_recording } =
      call.egress;

    this.store.next((state) => ({
      ...state,
      backstage: call.backstage,
      blockedUserIds: preserveArrayIdentity(
        state.blockedUserIds,
        call.blocked_user_ids,
      ),
      createdAt: new Date(call.created_at),
      updatedAt: new Date(call.updated_at),
      startsAt: call.starts_at ? new Date(call.starts_at) : undefined,
      endedAt: call.ended_at ? new Date(call.ended_at) : undefined,
      createdBy: call.created_by,
      custom: call.custom,
      egress: call.egress,
      ingress: call.ingress,
      recording: call.recording || composite_recording?.status === 'running',
      individualRecording: individual_recording?.status === 'running',
      rawRecording: raw_recording?.status === 'running',
      session: call.session,
      settings: call.settings,
      transcribing: call.transcribing,
      captioning: call.captioning,
      thumbnails: call.thumbnails,
      ...this.participantCountsFromSession(call.session, state.callingState),
    }));
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

    const participantLookup = this.getParticipantLookupBySessionId();
    const nextParticipants = participants.map<StreamVideoParticipant>((p) => {
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

    // pins are applied here rather than through `setServerSidePins`, so the
    // whole SFU payload lands as one update - a second write would let
    // subscribers observe the new participants with the previous pin state
    this.store.next((state) => ({
      ...state,
      participants: applyServerSidePins(nextParticipants, pins),
      participantCount: participantCount?.total || 0,
      anonymousParticipantCount: participantCount?.anonymous || 0,
      startedAt: startedAt ? Timestamp.toDate(startedAt) : new Date(),
      e2eeEnabled: e2EeEnabled,
    }));
  };

  private updateFromMemberRemoved = (event: CallMemberRemovedEvent) => {
    this.updateFromCallResponse(event.call);
    this.setMembers((members) =>
      members.filter((m) => event.members.indexOf(m.user_id) === -1),
    );
  };

  private updateFromMemberAdded = (event: CallMemberAddedEvent) => {
    this.updateFromCallResponse(event.call);
    this.setMembers((members) => [...members, ...event.members]);
  };

  private updateFromHLSBroadcastStopped = () => {
    this.stopHLSBroadcast();
  };

  private updateFromHLSBroadcastingFailed = () => {
    this.stopHLSBroadcast();
  };

  private stopHLSBroadcast = () => {
    this.store.next((state) => {
      const egress = state.egress ?? defaultEgress;
      return {
        ...state,
        egress: {
          ...egress,
          broadcasting: false,
          hls: {
            ...egress.hls!,
            status: '',
          },
        },
      };
    });
  };

  private updateFromRecordingEvent = (
    type: CallRecordingType | undefined,
    running: boolean,
  ) => {
    // handle the legacy format, where `type` is absent in the emitted events
    if (type === undefined || type === 'composite') {
      this.store.partialNext({ recording: running });
    } else if (type === 'individual') {
      this.store.partialNext({ individualRecording: running });
    } else if (type === 'raw') {
      this.store.partialNext({ rawRecording: running });
    } else {
      ensureExhausted(type, 'Unknown recording type');
    }
  };

  /**
   * The participant counts implied by a session, as a patch to fold into the
   * same store write that applies the session itself. Writing them separately
   * would let subscribers observe the new session alongside the old counts.
   *
   * Returns an empty patch when the counts should not be taken from the
   * session at all.
   */
  private participantCountsFromSession = (
    session: CallSessionResponse | undefined,
    callingState: CallingState,
  ): Partial<CallStateShape> => {
    // when in JOINED state, we should use the participant count coming through
    // the SFU healthcheck event, as it's more accurate.
    if (!session || callingState === CallingState.JOINED) return {};
    const byRoleCount = Object.values(
      session.participants_count_by_role,
    ).reduce((total, countByRole) => total + countByRole, 0);
    return {
      participantCount: Math.max(byRoleCount, session.participants.length),
      anonymousParticipantCount: session.anonymous_participant_count || 0,
    };
  };

  private updateSession = (
    patch: (session: CallSessionResponse) => CallSessionResponse,
  ) => {
    if (!this.store.getLatestValue().session) return;
    this.store.next((state) => {
      if (!state.session) return state;
      const session = patch(state.session);
      return {
        ...state,
        session,
        ...this.participantCountsFromSession(session, state.callingState),
      };
    });
  };

  private updateFromSessionParticipantCountUpdate = (
    event: CallSessionParticipantCountsUpdatedEvent,
  ) => {
    this.updateSession((session) => ({
      ...session,
      anonymous_participant_count: event.anonymous_participant_count,
      participants_count_by_role: event.participants_count_by_role,
    }));
  };

  private updateFromSessionParticipantLeft = (
    event: CallSessionParticipantLeftEvent,
  ) => {
    this.updateSession((session) => {
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
    this.updateSession((session) => {
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
    this.updateFromCallResponse(event.call);
    this.setMembers((members) =>
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
    this.store.next((state) => ({
      ...state,
      blockedUserIds: state.blockedUserIds.filter((id) => id !== event.user.id),
    }));
  };

  private blockUser = (event: BlockedUserEvent) => {
    this.store.next((state) => ({
      ...state,
      blockedUserIds: [...state.blockedUserIds, event.user.id],
    }));
  };

  private updateOwnCapabilities = (event: UpdatedCallPermissionsEvent) => {
    if (event.user.id === this.localParticipant?.userId) {
      this.setOwnCapabilities(event.own_capabilities);
    }
  };

  private setClosedCaptions = (
    patch: (queue: CallClosedCaption[]) => CallClosedCaption[],
  ) => {
    this.store.next((state) => ({
      ...state,
      closedCaptions: patch(state.closedCaptions),
    }));
  };

  private updateFromClosedCaptions = (event: ClosedCaptionEvent) => {
    this.setClosedCaptions((queue) => {
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
          this.setClosedCaptions((captions) =>
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
