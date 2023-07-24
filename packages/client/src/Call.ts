import { StreamSfuClient } from './StreamSfuClient';
import {
  Dispatcher,
  getGenericSdp,
  isSfuEvent,
  Publisher,
  SfuEventKinds,
  SfuEventListener,
  Subscriber,
} from './rtc';
import { muteTypeToTrackType } from './rtc/helpers/tracks';
import { GoAwayReason, TrackType } from './gen/video/sfu/models/models';
import {
  registerEventHandlers,
  registerRingingCallEventHandlers,
} from './events/callEventHandlers';
import {
  CallingState,
  CallState,
  StreamVideoWriteableStateStore,
} from './store';
import { createSubscription, getCurrentValue } from './store/rxUtils';
import {
  AcceptCallResponse,
  BlockUserRequest,
  BlockUserResponse,
  EndCallResponse,
  GetCallResponse,
  GetOrCreateCallRequest,
  GetOrCreateCallResponse,
  GoLiveResponse,
  ListRecordingsResponse,
  MuteUsersRequest,
  MuteUsersResponse,
  OwnCapability,
  QueryMembersRequest,
  QueryMembersResponse,
  RejectCallResponse,
  RequestPermissionRequest,
  RequestPermissionResponse,
  SendEventRequest,
  SendEventResponse,
  SendReactionRequest,
  SendReactionResponse,
  SFUResponse,
  StartBroadcastingResponse,
  StartRecordingResponse,
  StopBroadcastingResponse,
  StopLiveResponse,
  StopRecordingResponse,
  UnblockUserRequest,
  UnblockUserResponse,
  UpdateCallMembersRequest,
  UpdateCallMembersResponse,
  UpdateCallRequest,
  UpdateCallResponse,
  UpdateUserPermissionsRequest,
  UpdateUserPermissionsResponse,
} from './gen/coordinator';
import { join, reconcileParticipantLocalState } from './rtc/flows/join';
import {
  CallConstructor,
  CallLeaveOptions,
  DebounceType,
  JoinCallData,
  PublishOptions,
  StreamVideoParticipant,
  StreamVideoParticipantPatches,
  SubscriptionChanges,
  VisibilityState,
} from './types';
import {
  BehaviorSubject,
  debounce,
  filter,
  map,
  pairwise,
  Subject,
  takeWhile,
  tap,
  timer,
} from 'rxjs';
import { TrackSubscriptionDetails } from './gen/video/sfu/signal_rpc/signal';
import { JoinResponse, Migration } from './gen/video/sfu/event/events';
import { Timestamp } from './gen/google/protobuf/timestamp';
import {
  createStatsReporter,
  StatsReporter,
} from './stats/state-store-stats-reporter';
import { ViewportTracker } from './helpers/ViewportTracker';
import { PermissionsContext } from './permissions';
import { CallTypes } from './CallType';
import { StreamClient } from './coordinator/connection/client';
import {
  KnownCodes,
  retryInterval,
  sleep,
} from './coordinator/connection/utils';
import {
  CallEventHandler,
  CallEventTypes,
  EventHandler,
  Logger,
  StreamCallEvent,
} from './coordinator/connection/types';
import { getClientDetails } from './client-details';
import { getLogger } from './logger';

/**
 * An object representation of a `Call`.
 */
export class Call {
  /**
   * ViewportTracker instance
   */
  readonly viewportTracker = new ViewportTracker();

  /**
   * The type of the call.
   */
  readonly type: string;

  /**
   * The ID of the call.
   */
  readonly id: string;

  /**
   * The call CID.
   */
  readonly cid: string;

  /**
   * The state of this call.
   */
  readonly state = new CallState();

  /**
   * Flag indicating whether this call is "watched" and receives
   * updates from the backend.
   */
  watching: boolean;

  /**
   * Flag telling whether this call is a "ringing" call.
   */
  private readonly ringingSubject: Subject<boolean>;

  /**
   * The permissions context of this call.
   */
  readonly permissionsContext = new PermissionsContext();
  readonly logger: Logger;

  /**
   * The event dispatcher instance dedicated to this Call instance.
   * @private
   */
  private readonly dispatcher = new Dispatcher();

  private subscriber?: Subscriber;
  private publisher?: Publisher;
  private trackSubscriptionsSubject = new BehaviorSubject<{
    type: DebounceType;
    data: TrackSubscriptionDetails[];
  }>({ type: DebounceType.MEDIUM, data: [] });

  private statsReporter?: StatsReporter;
  private dropTimeout: ReturnType<typeof setTimeout> | undefined;

  private readonly clientStore: StreamVideoWriteableStateStore;
  private readonly streamClient: StreamClient;
  private sfuClient?: StreamSfuClient;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  /**
   * A list hooks/functions to invoke when the call is left.
   * A typical use case is to clean up some global event handlers.
   * @private
   */
  private readonly leaveCallHooks: Function[] = [];

  private readonly streamClientBasePath: string;
  private streamClientEventHandlers = new Map<Function, CallEventHandler>();

  /**
   * Constructs a new `Call` instance.
   *
   * NOTE: Don't call the constructor directly, instead
   * Use the [`StreamVideoClient.call`](./StreamVideoClient.md/#call)
   * method to construct a `Call` instance.
   */
  constructor({
    type,
    id,
    streamClient,
    metadata,
    members,
    ownCapabilities,
    sortParticipantsBy,
    clientStore,
    ringing = false,
    watching = false,
  }: CallConstructor) {
    this.type = type;
    this.id = id;
    this.cid = `${type}:${id}`;
    this.ringingSubject = new BehaviorSubject(ringing);
    this.watching = watching;
    this.streamClient = streamClient;
    this.clientStore = clientStore;
    this.streamClientBasePath = `/call/${this.type}/${this.id}`;
    this.logger = getLogger(['Call']);

    const callTypeConfig = CallTypes.get(type);
    const participantSorter =
      sortParticipantsBy || callTypeConfig.options.sortParticipantsBy;
    if (participantSorter) {
      this.state.setSortParticipantsBy(participantSorter);
    }

    this.state.setMetadata(metadata);
    this.state.setMembers(members || []);
    this.state.setOwnCapabilities(ownCapabilities || []);
    this.state.setCallingState(
      ringing ? CallingState.RINGING : CallingState.IDLE,
    );

    this.leaveCallHooks.push(
      registerEventHandlers(this, this.state, this.dispatcher),
    );
    this.registerEffects();

    this.leaveCallHooks.push(
      createSubscription(
        this.trackSubscriptionsSubject.pipe(
          debounce((v) => timer(v.type)),
          map((v) => v.data),
        ),
        (subscriptions) => this.sfuClient?.updateSubscriptions(subscriptions),
      ),
    );
  }

  private registerEffects() {
    this.leaveCallHooks.push(
      // handles updating the permissions context when the metadata changes.
      createSubscription(this.state.metadata$, (metadata) => {
        if (!metadata) return;
        this.permissionsContext.setCallSettings(metadata.settings);
      }),

      // handle the case when the user permissions are modified.
      createSubscription(this.state.ownCapabilities$, (ownCapabilities) => {
        // update the permission context.
        this.permissionsContext.setPermissions(ownCapabilities);

        if (!this.publisher) return;

        // check if the user still has publishing permissions and stop publishing if not.
        const permissionToTrackType = {
          [OwnCapability.SEND_AUDIO]: TrackType.AUDIO,
          [OwnCapability.SEND_VIDEO]: TrackType.VIDEO,
          [OwnCapability.SCREENSHARE]: TrackType.SCREEN_SHARE,
        };
        for (const [permission, trackType] of Object.entries(
          permissionToTrackType,
        )) {
          const hasPermission = this.permissionsContext.hasPermission(
            permission as OwnCapability,
          );
          if (!hasPermission && this.publisher.isPublishing(trackType)) {
            this.stopPublish(trackType).catch((err) => {
              this.logger('error', `Error stopping publish ${trackType}`, err);
            });
          }
        }
      }),

      // handles the case when the user is blocked by the call owner.
      createSubscription(this.state.metadata$, async (metadata) => {
        if (!metadata) return;
        const currentUserId = this.currentUserId;
        if (
          currentUserId &&
          metadata.blocked_user_ids.includes(currentUserId)
        ) {
          this.logger('info', 'Leaving call because of being blocked');
          await this.leave();
        }
      }),

      // watch for auto drop cancellation
      createSubscription(this.state.callingState$, (callingState) => {
        if (!this.ringing) return;
        if (
          callingState === CallingState.JOINED ||
          callingState === CallingState.JOINING ||
          callingState === CallingState.LEFT
        ) {
          clearTimeout(this.dropTimeout);
          this.dropTimeout = undefined;
        }
      }),

      // "ringing" mode effects and event handlers
      createSubscription(this.ringingSubject, (isRinging) => {
        if (!isRinging) return;
        this.scheduleAutoDrop();
        if (this.state.callingState === CallingState.IDLE) {
          this.state.setCallingState(CallingState.RINGING);
        }
        this.leaveCallHooks.push(registerRingingCallEventHandlers(this));
      }),
    );
  }

  /**
   * You can subscribe to WebSocket events provided by the API. To remove a subscription, call the `off` method.
   * Please note that subscribing to WebSocket events is an advanced use-case, for most use-cases it should be enough to watch for changes in the [reactive state store](./StreamVideoClient.md/#readonlystatestore).
   * @param eventName
   * @param fn
   * @returns a function which can be called to unsubscribe from the given event(s)
   */
  on(eventName: SfuEventKinds, fn: SfuEventListener): () => void;
  on(eventName: CallEventTypes, fn: CallEventHandler): () => void;
  on(
    eventName: SfuEventKinds | CallEventTypes,
    fn: SfuEventListener | CallEventHandler,
  ) {
    if (isSfuEvent(eventName)) {
      return this.dispatcher.on(eventName, fn as SfuEventListener);
    } else {
      const eventHandler: CallEventHandler = (event: StreamCallEvent) => {
        if (event.call_cid && event.call_cid === this.cid) {
          (fn as EventHandler)(event);
        }
      };
      this.streamClientEventHandlers.set(fn, eventHandler);

      return this.streamClient.on(eventName, eventHandler as EventHandler);
    }
  }

  /**
   * Remove subscription for WebSocket events that were created by the `on` method.
   * @param eventName
   * @param fn
   * @returns
   */
  off(eventName: SfuEventKinds, fn: SfuEventListener): void;
  off(eventName: CallEventTypes, fn: CallEventHandler): void;
  off(
    eventName: SfuEventKinds | CallEventTypes,
    fn: SfuEventListener | CallEventHandler,
  ) {
    if (isSfuEvent(eventName)) {
      return this.dispatcher.off(eventName, fn as SfuEventListener);
    } else {
      const registeredEventHandler = this.streamClientEventHandlers.get(fn);
      if (registeredEventHandler) {
        return this.streamClient.off(
          eventName,
          registeredEventHandler as EventHandler,
        );
      }
    }
  }

  /**
   * Leave the call and stop the media streams that were published by the call.
   */
  leave = async ({ reject = false }: CallLeaveOptions = {}) => {
    const callingState = this.state.callingState;
    if (callingState === CallingState.LEFT) {
      throw new Error('Cannot leave call that has already been left.');
    }

    if (callingState === CallingState.JOINING) {
      await this.assertCallJoined();
    }

    if (this.ringing) {
      // I'm the one who started the call, so I should cancel it.
      const hasOtherParticipants = this.state.remoteParticipants.length > 0;
      if (this.isCreatedByMe && !hasOtherParticipants) {
        // Signals other users that I have cancelled my call to them
        // before they accepted it.
        await this.reject();
      } else if (reject && callingState === CallingState.RINGING) {
        // Signals other users that I have rejected the incoming call.
        await this.reject();
      }
    }

    this.statsReporter?.stop();
    this.statsReporter = undefined;

    this.subscriber?.close();
    this.subscriber = undefined;

    this.publisher?.close();
    this.publisher = undefined;

    this.sfuClient?.close();
    this.sfuClient = undefined;

    this.dispatcher.offAll();

    // Call all leave call hooks, e.g. to clean up global event handlers
    this.leaveCallHooks.forEach((hook) => hook());

    this.clientStore.unregisterCall(this);
    this.state.setCallingState(CallingState.LEFT);
  };

  /**
   * A getter for the call metadata.
   */
  get data() {
    return this.state.metadata;
  }

  /**
   * A flag indicating whether the call is "ringing" type of call.
   */
  get ringing() {
    return getCurrentValue(this.ringingSubject);
  }

  /**
   * Retrieves the current user ID.
   */
  get currentUserId() {
    return this.clientStore.connectedUser?.id;
  }

  /**
   * A flag indicating whether the call was created by the current user.
   */
  get isCreatedByMe() {
    return this.state.metadata?.created_by.id === this.currentUserId;
  }

  /**
   * Loads the information about the call.
   *
   * @param params.ring if set to true, a `call.ring` event will be sent to the call members.
   * @param params.notify if set to true, a `call.notification` event will be sent to the call members.
   * @param params.members_limit the members limit.
   */
  get = async (params?: {
    ring?: boolean;
    notify?: boolean;
    members_limit?: number;
  }) => {
    const response = await this.streamClient.get<GetCallResponse>(
      this.streamClientBasePath,
      params,
    );

    if (params?.ring && !this.ringing) {
      this.ringingSubject.next(true);
    }

    this.state.setMetadata(response.call);
    this.state.setMembers(response.members);
    this.state.setOwnCapabilities(response.own_capabilities);

    if (this.streamClient._hasConnectionID()) {
      this.watching = true;
      this.clientStore.registerCall(this);
    }

    return response;
  };

  /**
   * Loads the information about the call and creates it if it doesn't exist.
   *
   * @param data the data to create the call with.
   */
  getOrCreate = async (data?: GetOrCreateCallRequest) => {
    const response = await this.streamClient.post<
      GetOrCreateCallResponse,
      GetOrCreateCallRequest
    >(this.streamClientBasePath, data);

    if (data?.ring && !this.ringing) {
      this.ringingSubject.next(true);
    }

    this.state.setMetadata(response.call);
    this.state.setMembers(response.members);
    this.state.setOwnCapabilities(response.own_capabilities);

    if (this.streamClient._hasConnectionID()) {
      this.watching = true;
      this.clientStore.registerCall(this);
    }

    return response;
  };

  /**
   * A shortcut for {@link Call.get} with `ring` parameter set to `true`.
   * Will send a `call.ring` event to the call members.
   */
  ring = async (): Promise<GetCallResponse> => {
    return await this.get({ ring: true });
  };

  /**
   * A shortcut for {@link Call.get} with `notify` parameter set to `true`.
   * Will send a `call.notification` event to the call members.
   */
  notify = async (): Promise<GetCallResponse> => {
    return await this.get({ notify: true });
  };

  /**
   * Marks the incoming call as accepted.
   *
   * This method should be used only for "ringing" call flows.
   * {@link Call.join} invokes this method automatically for you when joining a call.
   * Unless you are implementing a custom "ringing" flow, you should not use this method.
   */
  accept = async () => {
    return this.streamClient.post<AcceptCallResponse>(
      `${this.streamClientBasePath}/accept`,
    );
  };

  /**
   * Marks the incoming call as rejected.
   *
   * This method should be used only for "ringing" call flows.
   * {@link Call.leave} invokes this method automatically for you when you leave or reject this call.
   * Unless you are implementing a custom "ringing" flow, you should not use this method.
   */
  reject = async () => {
    return this.streamClient.post<RejectCallResponse>(
      `${this.streamClientBasePath}/reject`,
    );
  };

  /**
   * Will start to watch for call related WebSocket events and initiate a call session with the server.
   *
   * @returns a promise which resolves once the call join-flow has finished.
   */
  join = async (data?: JoinCallData) => {
    const callingState = this.state.callingState;
    if ([CallingState.JOINED, CallingState.JOINING].includes(callingState)) {
      this.logger(
        'warn',
        'Join method called twice, you should only call this once',
      );
      throw new Error(`Illegal State: Already joined.`);
    }

    if (callingState === CallingState.LEFT) {
      throw new Error(
        'Illegal State: Cannot join already left call. Create a new Call instance to join a call.',
      );
    }

    const isMigrating = callingState === CallingState.MIGRATING;
    this.state.setCallingState(CallingState.JOINING);
    this.logger('debug', 'Starting join flow');

    if (data?.ring && !this.ringing) {
      this.ringingSubject.next(true);
    }

    if (this.ringing && !this.isCreatedByMe) {
      // signals other users that I have accepted the incoming call.
      await this.accept();
    }

    let sfuServer: SFUResponse;
    let sfuToken: string;
    let connectionConfig: RTCConfiguration | undefined;
    try {
      const call = await join(this.streamClient, this.type, this.id, data);
      this.state.setMetadata(call.metadata);
      this.state.setMembers(call.members);
      this.state.setOwnCapabilities(call.ownCapabilities);
      connectionConfig = call.connectionConfig;
      sfuServer = call.sfuServer;
      sfuToken = call.token;

      if (this.streamClient._hasConnectionID()) {
        this.watching = true;
        this.clientStore.registerCall(this);
      }
    } catch (error) {
      // restore the previous call state if the join-flow fails
      this.state.setCallingState(callingState);
      throw error;
    }

    // FIXME OL: remove once cascading is implemented
    if (typeof window !== 'undefined' && window.location?.search) {
      const params = new URLSearchParams(window.location.search);
      sfuServer.url = params.get('sfuUrl') || sfuServer.url;
      sfuServer.ws_endpoint = params.get('sfuWsUrl') || sfuServer.ws_endpoint;
      sfuServer.edge_name = params.get('sfuUrl') || sfuServer.edge_name;
    }

    const previousSfuClient = this.sfuClient;
    const sfuClient = (this.sfuClient = new StreamSfuClient({
      dispatcher: this.dispatcher,
      sfuServer,
      token: sfuToken,
      sessionId: previousSfuClient?.sessionId,
    }));

    /**
     * A closure which hides away the re-connection logic.
     */
    const rejoin = async ({ migrate = false } = {}) => {
      this.reconnectAttempts++;
      this.state.setCallingState(
        migrate ? CallingState.MIGRATING : CallingState.RECONNECTING,
      );

      if (migrate) {
        this.logger(
          'debug',
          `[Migration]: migrating call ${this.cid} away from ${sfuServer.edge_name}`,
        );
        sfuClient.isMigratingAway = true;
      } else {
        this.logger(
          'debug',
          `[Rejoin]: Rejoining call ${this.cid} (${this.reconnectAttempts})...`,
        );
      }

      // take a snapshot of the current "local participant" state
      // we'll need it for restoring the previous publishing state later
      const localParticipant = this.state.localParticipant;

      const disconnectFromPreviousSfu = () => {
        if (!migrate) {
          this.subscriber?.close();
          this.subscriber = undefined;
          this.publisher?.close({ stopTracks: false });
          this.publisher = undefined;
          this.statsReporter?.stop();
          this.statsReporter = undefined;
        }
        previousSfuClient?.close(); // clean up previous connection
      };

      if (!migrate) {
        // in migration or recovery scenarios, we don't want to
        // wait before attempting to reconnect to an SFU server
        await sleep(retryInterval(this.reconnectAttempts));
        disconnectFromPreviousSfu();
      }
      await this.join({
        ...data,
        ...(migrate && { migrating_from: sfuServer.edge_name }),
      });

      if (migrate) {
        disconnectFromPreviousSfu();
      }

      this.logger(
        'info',
        `[Rejoin]: Attempt ${this.reconnectAttempts} successful!`,
      );
      // we shouldn't be republishing the streams if we're migrating
      // as the underlying peer connection will take care of it as part
      // of the ice-restart process
      if (localParticipant && !migrate) {
        const {
          audioStream,
          videoStream,
          screenShareStream: screenShare,
        } = localParticipant;

        // restore previous publishing state
        if (audioStream) await this.publishAudioStream(audioStream);
        if (videoStream) await this.publishVideoStream(videoStream);
        if (screenShare) await this.publishScreenShareStream(screenShare);
      }
      this.logger(
        'info',
        `[Rejoin]: State restored. Attempt: ${this.reconnectAttempts}`,
      );
    };

    // reconnect if the connection was closed unexpectedly. example:
    // - SFU crash or restart
    // - network change
    sfuClient.signalReady.then(() => {
      // register a handler for the "goAway" event
      const unregisterGoAway = this.dispatcher.on('goAway', (event) => {
        if (event.eventPayload.oneofKind !== 'goAway') return;
        const { reason } = event.eventPayload.goAway;
        this.logger(
          'info',
          `[Migration]: Going away from SFU... Reason: ${GoAwayReason[reason]}`,
        );
        rejoin({ migrate: true }).catch((err) => {
          this.logger(
            'warn',
            `[Migration]: Failed to migrate to another SFU.`,
            err,
          );
        });
      });

      sfuClient.signalWs.addEventListener('close', (e) => {
        // unregister the "goAway" handler, as we won't need it anymore for this connection.
        // the upcoming re-join will register a new handler anyway
        unregisterGoAway();
        // do nothing if the connection was closed on purpose
        if (e.code === KnownCodes.WS_CLOSED_SUCCESS) return;
        // do nothing if the connection was closed because of a policy violation
        // e.g., the user has been blocked by an admin or moderator
        if (e.code === KnownCodes.WS_POLICY_VIOLATION) return;
        // When the SFU is being shut down, it sends a goAway message.
        // While we migrate to another SFU, we might have the WS connection
        // to the old SFU closed abruptly. In this case, we don't want
        // to reconnect to the old SFU, but rather to the new one.
        if (
          e.code === KnownCodes.WS_CLOSED_ABRUPTLY &&
          sfuClient.isMigratingAway
        )
          return;
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          rejoin().catch((err) => {
            this.logger(
              'error',
              `[Rejoin]: Rejoin failed for ${this.reconnectAttempts} times. Giving up.`,
              err,
            );
            this.state.setCallingState(CallingState.RECONNECTING_FAILED);
          });
        } else {
          this.logger(
            'error',
            '[Rejoin]: Reconnect attempts exceeded. Giving up...',
          );
          this.state.setCallingState(CallingState.RECONNECTING_FAILED);
        }
      });
    });

    // handlers for connection online/offline events
    const unsubscribeOnlineEvent = this.streamClient.on(
      'connection.changed',
      (e) => {
        if (e.type !== 'connection.changed') return;
        if (!e.online) return;
        unsubscribeOnlineEvent();
        const currentCallingState = this.state.callingState;
        if (
          currentCallingState === CallingState.OFFLINE ||
          currentCallingState === CallingState.RECONNECTING_FAILED
        ) {
          this.logger('info', '[Rejoin]: Going online...');
          rejoin().catch((err) => {
            this.logger(
              'error',
              `[Rejoin]: Rejoin failed for ${this.reconnectAttempts} times. Giving up.`,
              err,
            );
            this.state.setCallingState(CallingState.RECONNECTING_FAILED);
          });
        }
      },
    );
    const unsubscribeOfflineEvent = this.streamClient.on(
      'connection.changed',
      (e) => {
        if (e.type !== 'connection.changed') return;
        if (e.online) return;
        unsubscribeOfflineEvent();
        this.state.setCallingState(CallingState.OFFLINE);
      },
    );

    this.leaveCallHooks.push(() => {
      unsubscribeOnlineEvent();
      unsubscribeOfflineEvent();
    });

    if (!this.subscriber) {
      this.subscriber = new Subscriber({
        sfuClient,
        dispatcher: this.dispatcher,
        state: this.state,
        connectionConfig,
      });
    }

    const audioSettings = this.data?.settings.audio;
    const isDtxEnabled = !!audioSettings?.opus_dtx_enabled;
    const isRedEnabled = !!audioSettings?.redundant_coding_enabled;

    if (!this.publisher) {
      this.publisher = new Publisher({
        sfuClient,
        dispatcher: this.dispatcher,
        state: this.state,
        connectionConfig,
        isDtxEnabled,
        isRedEnabled,
        preferredVideoCodec: this.streamClient.options.preferredVideoCodec,
      });
    }

    if (!isMigrating) {
      this.statsReporter = createStatsReporter({
        subscriber: this.subscriber,
        publisher: this.publisher,
        state: this.state,
      });
    }

    try {
      // 1. wait for the signal server to be ready before sending "joinRequest"
      sfuClient.signalReady
        .catch((err) => this.logger('error', 'Signal ready failed', err))
        // prepare a generic SDP and send it to the SFU.
        // this is a throw-away SDP that the SFU will use to determine
        // the capabilities of the client (codec support, etc.)
        .then(() =>
          getGenericSdp(
            'recvonly',
            isRedEnabled,
            this.streamClient.options.preferredVideoCodec,
          ),
        )
        .then((sdp) => {
          const subscriptions = getCurrentValue(this.trackSubscriptionsSubject);
          const migration: Migration | undefined = isMigrating
            ? {
                fromSfuId: data?.migrating_from || '',
                subscriptions: subscriptions.data || [],
                announcedTracks: this.publisher?.getCurrentTrackInfos() || [],
              }
            : undefined;

          return sfuClient.join({
            subscriberSdp: sdp || '',
            clientDetails: getClientDetails(),
            migration,
            fastReconnect: false,
          });
        });

      // 2. in parallel, wait for the SFU to send us the "joinResponse"
      // this will throw an error if the SFU rejects the join request or
      // fails to respond in time
      const { callState } = await this.waitForJoinResponse();
      if (isMigrating) {
        await this.subscriber.migrateTo(sfuClient, connectionConfig);
        await this.publisher.migrateTo(sfuClient, connectionConfig);
      }
      const currentParticipants = callState?.participants || [];
      const participantCount = callState?.participantCount;
      const startedAt = callState?.startedAt
        ? Timestamp.toDate(callState.startedAt)
        : new Date();
      this.state.setParticipants(() => {
        const participantLookup = this.state.getParticipantLookupBySessionId();
        return currentParticipants.map((p) => {
          const participant: StreamVideoParticipant = Object.assign(p, {
            isLocalParticipant: p.sessionId === sfuClient.sessionId,
            viewportVisibilityState: VisibilityState.UNKNOWN,
          });
          // We need to preserve some of the local state of the participant
          // (e.g. videoDimension, visibilityState, pinnedAt, etc.)
          // as it doesn't exist on the server.
          const existingParticipant = participantLookup[p.sessionId];
          return reconcileParticipantLocalState(
            participant,
            existingParticipant,
          );
        });
      });
      this.state.setParticipantCount(participantCount?.total || 0);
      this.state.setAnonymousParticipantCount(participantCount?.anonymous || 0);
      this.state.setStartedAt(startedAt);

      this.reconnectAttempts = 0; // reset the reconnect attempts counter
      this.state.setCallingState(CallingState.JOINED);
      this.logger('info', `Joined call ${this.cid}`);
    } catch (err) {
      // join failed, try to rejoin
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.logger(
          'error',
          `[Rejoin]: Rejoin ${this.reconnectAttempts} failed.`,
          err,
        );
        await rejoin();
        this.logger(
          'info',
          `[Rejoin]: Rejoin ${this.reconnectAttempts} successful!`,
        );
      } else {
        this.logger(
          'error',
          `[Rejoin]: Rejoin failed for ${this.reconnectAttempts} times. Giving up.`,
        );
        this.state.setCallingState(CallingState.RECONNECTING_FAILED);
        throw new Error('Join failed');
      }
    }
  };

  private waitForJoinResponse = (timeout: number = 5000) => {
    return new Promise<JoinResponse>((resolve, reject) => {
      const unsubscribe = this.on('joinResponse', (event) => {
        if (event.eventPayload.oneofKind !== 'joinResponse') return;
        clearTimeout(timeoutId);
        unsubscribe();
        resolve(event.eventPayload.joinResponse);
      });

      const timeoutId = setTimeout(() => {
        unsubscribe();
        reject(new Error('Waiting for "joinResponse" has timed out'));
      }, timeout);
    });
  };

  /**
   * Starts publishing the given video stream to the call.
   * The stream will be stopped if the user changes an input device, or if the user leaves the call.
   *
   * Consecutive calls to this method will replace the previously published stream.
   * The previous video stream will be stopped.
   *
   * @param videoStream the video stream to publish.
   * @param opts the options to use when publishing the stream.
   */
  publishVideoStream = async (
    videoStream: MediaStream,
    opts: PublishOptions = {},
  ) => {
    // we should wait until we get a JoinResponse from the SFU,
    // otherwise we risk breaking the ICETrickle flow.
    await this.assertCallJoined();
    if (!this.publisher) {
      this.logger('error', 'Trying to publish video before join is completed');
      throw new Error(`Call not joined yet.`);
    }

    const [videoTrack] = videoStream.getVideoTracks();
    if (!videoTrack) {
      this.logger('error', `There is no video track to publish in the stream.`);
      return;
    }

    await this.publisher.publishStream(
      videoStream,
      videoTrack,
      TrackType.VIDEO,
      opts,
    );
  };

  /**
   * Starts publishing the given audio stream to the call.
   * The stream will be stopped if the user changes an input device, or if the user leaves the call.
   *
   * Consecutive calls to this method will replace the audio stream that is currently being published.
   * The previous audio stream will be stopped.
   *
   *
   * @param audioStream the audio stream to publish.
   */
  publishAudioStream = async (audioStream: MediaStream) => {
    // we should wait until we get a JoinResponse from the SFU,
    // otherwise we risk breaking the ICETrickle flow.
    await this.assertCallJoined();
    if (!this.publisher) {
      this.logger('error', 'Trying to publish audio before join is completed');
      throw new Error(`Call not joined yet.`);
    }

    const [audioTrack] = audioStream.getAudioTracks();
    if (!audioTrack) {
      this.logger('error', `There is no audio track in the stream to publish`);
      return;
    }

    await this.publisher.publishStream(
      audioStream,
      audioTrack,
      TrackType.AUDIO,
    );
  };

  /**
   * Starts publishing the given screen-share stream to the call.
   *
   * Consecutive calls to this method will replace the previous screen-share stream.
   * The previous screen-share stream will be stopped.
   *
   *
   * @param screenShareStream the screen-share stream to publish.
   */
  publishScreenShareStream = async (screenShareStream: MediaStream) => {
    // we should wait until we get a JoinResponse from the SFU,
    // otherwise we risk breaking the ICETrickle flow.
    await this.assertCallJoined();
    if (!this.publisher) {
      this.logger(
        'error',
        'Trying to publish screen share before join is completed',
      );
      throw new Error(`Call not joined yet.`);
    }

    const [screenShareTrack] = screenShareStream.getVideoTracks();
    if (!screenShareTrack) {
      this.logger(
        'error',
        `There is no video track in the screen share stream to publish`,
      );
      return;
    }

    await this.publisher.publishStream(
      screenShareStream,
      screenShareTrack,
      TrackType.SCREEN_SHARE,
    );
  };

  /**
   * Stops publishing the given track type to the call, if it is currently being published.
   * Underlying track will be stopped and removed from the publisher.
   *
   * The `audioDeviceId`/`videoDeviceId` property of the [`localParticipant$`](./StreamVideoClient.md/#readonlystatestore) won't be updated, you can do that by calling the [`setAudioDevice`](#setaudiodevice)/[`setVideoDevice`](#setvideodevice) method.
   *
   *
   * @param trackType the track type to stop publishing.
   */
  stopPublish = async (trackType: TrackType) => {
    this.logger('info', `stopPublish ${TrackType[trackType]}`);
    await this.publisher?.unpublishStream(trackType);
  };

  /**
   * Update track subscription configuration for one or more participants.
   * You have to create a subscription for each participant for all the different kinds of tracks you want to receive.
   * You can only subscribe for tracks after the participant started publishing the given kind of track.
   *
   * @param kind the kind of subscription to update.
   * @param changes the list of subscription changes to do.
   * @param type the debounce type to use for the update.
   */
  updateSubscriptionsPartial = (
    kind: 'video' | 'screen',
    changes: SubscriptionChanges,
    type: DebounceType = DebounceType.SLOW,
  ) => {
    const participants = this.state.updateParticipants(
      Object.entries(changes).reduce<StreamVideoParticipantPatches>(
        (acc, [sessionId, change]) => {
          const prop: keyof StreamVideoParticipant | undefined =
            kind === 'video'
              ? 'videoDimension'
              : kind === 'screen'
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

    if (participants) {
      this.updateSubscriptions(participants, type);
    }
  };

  private updateSubscriptions = (
    participants: StreamVideoParticipant[],
    type: DebounceType = DebounceType.SLOW,
  ) => {
    const subscriptions: TrackSubscriptionDetails[] = [];
    participants.forEach((p) => {
      // we don't want to subscribe to our own tracks
      if (p.isLocalParticipant) return;

      // NOTE: audio tracks don't have to be requested explicitly
      // as the SFU will implicitly subscribe us to all of them,
      // once they become available.

      if (p.videoDimension && p.publishedTracks.includes(TrackType.VIDEO)) {
        subscriptions.push({
          userId: p.userId,
          sessionId: p.sessionId,
          trackType: TrackType.VIDEO,
          dimension: p.videoDimension,
        });
      }
      if (
        p.screenShareDimension &&
        p.publishedTracks.includes(TrackType.SCREEN_SHARE)
      ) {
        subscriptions.push({
          userId: p.userId,
          sessionId: p.sessionId,
          trackType: TrackType.SCREEN_SHARE,
          dimension: p.screenShareDimension,
        });
      }
    });
    // schedule update
    this.trackSubscriptionsSubject.next({ type, data: subscriptions });
  };

  /**
   * Will enhance the reported stats with additional participant-specific information (`callStatsReport$` state [store variable](./StreamVideoClient.md/#readonlystatestore)).
   * This is usually helpful when detailed stats for a specific participant are needed.
   *
   * @param sessionId the sessionId to start reporting for.
   */
  startReportingStatsFor = (sessionId: string) => {
    return this.statsReporter?.startReportingStatsFor(sessionId);
  };

  /**
   * Opposite of `startReportingStatsFor`.
   * Will turn off stats reporting for a specific participant.
   *
   * @param sessionId the sessionId to stop reporting for.
   */
  stopReportingStatsFor = (sessionId: string) => {
    return this.statsReporter?.stopReportingStatsFor(sessionId);
  };

  /**
   * Sets the used audio output device (`audioOutputDeviceId` of the [`localParticipant$`](./StreamVideoClient.md/#readonlystatestore).
   *
   * This method only stores the selection, if you're using custom UI components, you'll have to implement the audio switching, for more information see: https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/sinkId.
   *
   *
   * @param deviceId the selected device, `undefined` means the user wants to use the system's default audio output
   */
  setAudioOutputDevice = (deviceId?: string) => {
    this.state.updateParticipant(this.sfuClient!.sessionId, {
      audioOutputDeviceId: deviceId,
    });
  };

  /**
   * Sets the `audioDeviceId` property of the [`localParticipant$`](./StreamVideoClient.md/#readonlystatestore)).
   *
   * This method only stores the selection, if you want to start publishing a media stream call the [`publishAudioStream` method](#publishaudiostream) that will set `audioDeviceId` as well.
   *
   *
   * @param deviceId the selected device, pass `undefined` to clear the device selection
   */
  setAudioDevice = (deviceId?: string) => {
    this.state.updateParticipant(this.sfuClient!.sessionId, {
      audioDeviceId: deviceId,
    });
  };

  /**
   * Sets the `videoDeviceId` property of the [`localParticipant$`](./StreamVideoClient.md/#readonlystatestore).
   *
   * This method only stores the selection, if you want to start publishing a media stream call the [`publishVideoStream` method](#publishvideostream) that will set `videoDeviceId` as well.
   *
   * @param deviceId the selected device, pass `undefined` to clear the device selection
   */
  setVideoDevice = (deviceId?: string) => {
    this.state.updateParticipant(this.sfuClient!.sessionId, {
      videoDeviceId: deviceId,
    });
  };

  /**
   * Resets the last sent reaction for the user holding the given `sessionId`. This is a local action, it won't reset the reaction on the backend.
   *
   * @param sessionId the session id.
   */
  resetReaction = (sessionId: string) => {
    this.state.updateParticipant(sessionId, {
      reaction: undefined,
    });
  };

  /**
   * Sets the list of criteria to sort the participants by.
   *
   * @param criteria the list of criteria to sort the participants by.
   */
  setSortParticipantsBy: CallState['setSortParticipantsBy'] = (criteria) => {
    return this.state.setSortParticipantsBy(criteria);
  };

  /**
   * @internal
   * @param enabledRids
   * @returns
   */
  updatePublishQuality = async (enabledRids: string[]) => {
    return this.publisher?.updateVideoPublishQuality(enabledRids);
  };

  private assertCallJoined = () => {
    return new Promise<void>((resolve) => {
      this.state.callingState$
        .pipe(
          takeWhile((state) => state !== CallingState.JOINED, true),
          filter((s) => s === CallingState.JOINED),
        )
        .subscribe(() => resolve());
    });
  };

  /**
   * Sends a reaction to the other call participants.
   *
   * @param reaction the reaction to send.
   */
  sendReaction = async (
    reaction: SendReactionRequest,
  ): Promise<SendReactionResponse> => {
    return this.streamClient.post<SendReactionResponse, SendReactionRequest>(
      `${this.streamClientBasePath}/reaction`,
      reaction,
    );
  };

  /**
   * Blocks the user with the given `userId`.
   *
   * @param userId the id of the user to block.
   */
  blockUser = async (userId: string) => {
    return this.streamClient.post<BlockUserResponse, BlockUserRequest>(
      `${this.streamClientBasePath}/block`,
      {
        user_id: userId,
      },
    );
  };

  /**
   * Unblocks the user with the given `userId`.
   *
   * @param userId the id of the user to unblock.
   */
  unblockUser = async (userId: string) => {
    return this.streamClient.post<UnblockUserResponse, UnblockUserRequest>(
      `${this.streamClientBasePath}/unblock`,
      {
        user_id: userId,
      },
    );
  };

  /**
   * Mutes the current user.
   *
   * @param type the type of the mute operation.
   */
  muteSelf = (type: 'audio' | 'video' | 'screenshare') => {
    const myUserId = this.currentUserId;
    if (myUserId) {
      return this.muteUser(myUserId, type);
    }
  };

  /**
   * Mutes all the other participants.
   *
   * @param type the type of the mute operation.
   */
  muteOthers = (type: 'audio' | 'video' | 'screenshare') => {
    const trackType = muteTypeToTrackType(type);
    if (!trackType) return;
    const userIdsToMute: string[] = [];
    for (const participant of this.state.remoteParticipants) {
      if (participant.publishedTracks.includes(trackType)) {
        userIdsToMute.push(participant.userId);
      }
    }

    return this.muteUser(userIdsToMute, type);
  };

  /**
   * Mutes the user with the given `userId`.
   *
   * @param userId the id of the user to mute.
   * @param type the type of the mute operation.
   */
  muteUser = (
    userId: string | string[],
    type: 'audio' | 'video' | 'screenshare',
  ) => {
    return this.streamClient.post<MuteUsersResponse, MuteUsersRequest>(
      `${this.streamClientBasePath}/mute_users`,
      {
        user_ids: Array.isArray(userId) ? userId : [userId],
        [type]: true,
      },
    );
  };

  /**
   * Will mute all users in the call.
   *
   * @param type the type of the mute operation.
   */
  muteAllUsers = (type: 'audio' | 'video' | 'screenshare') => {
    return this.streamClient.post<MuteUsersResponse, MuteUsersRequest>(
      `${this.streamClientBasePath}/mute_users`,
      {
        mute_all_users: true,
        [type]: true,
      },
    );
  };

  /**
   * Starts recording the call
   */
  startRecording = async () => {
    return this.streamClient.post<StartRecordingResponse>(
      `${this.streamClientBasePath}/start_recording`,
      {},
    );
  };

  /**
   * Stops recording the call
   */
  stopRecording = async () => {
    return this.streamClient.post<StopRecordingResponse>(
      `${this.streamClientBasePath}/stop_recording`,
      {},
    );
  };

  /**
   * Sends a `call.permission_request` event to all users connected to the call. The call settings object contains infomration about which permissions can be requested during a call (for example a user might be allowed to request permission to publish audio, but not video).
   */
  requestPermissions = async (
    data: RequestPermissionRequest,
  ): Promise<RequestPermissionResponse> => {
    const { permissions } = data;
    const canRequestPermissions = permissions.every((permission) =>
      this.permissionsContext.canRequest(permission as OwnCapability),
    );
    if (!canRequestPermissions) {
      throw new Error(
        `You are not allowed to request permissions: ${permissions.join(', ')}`,
      );
    }
    return this.streamClient.post<
      RequestPermissionResponse,
      RequestPermissionRequest
    >(`${this.streamClientBasePath}/request_permission`, data);
  };

  /**
   * Allows you to grant certain permissions to a user in a call.
   * The permissions are specific to the call experience and do not survive the call itself.
   *
   * Supported permissions that can be granted are:
   * - `send-audio`
   * - `send-video`
   * - `screenshare`
   *
   * @param userId the id of the user to grant permissions to.
   * @param permissions the permissions to grant.
   */
  grantPermissions = async (userId: string, permissions: string[]) => {
    return this.updateUserPermissions({
      user_id: userId,
      grant_permissions: permissions,
    });
  };

  /**
   * Allows you to revoke certain permissions from a user in a call.
   * The permissions are specific to the call experience and do not survive the call itself.
   *
   * Supported permissions that can be revoked are:
   * - `send-audio`
   * - `send-video`
   * - `screenshare`
   *
   * @param userId the id of the user to revoke permissions from.
   * @param permissions the permissions to revoke.
   */
  revokePermissions = async (userId: string, permissions: string[]) => {
    return this.updateUserPermissions({
      user_id: userId,
      revoke_permissions: permissions,
    });
  };

  /**
   * Allows you to grant or revoke a specific permission to a user in a call. The permissions are specific to the call experience and do not survive the call itself.
   *
   * When revoking a permission, this endpoint will also mute the relevant track from the user. This is similar to muting a user with the difference that the user will not be able to unmute afterwards.
   *
   * Supported permissions that can be granted or revoked: `send-audio`, `send-video` and `screenshare`.
   *
   * `call.permissions_updated` event is sent to all members of the call.
   *
   */
  updateUserPermissions = async (data: UpdateUserPermissionsRequest) => {
    return this.streamClient.post<
      UpdateUserPermissionsResponse,
      UpdateUserPermissionsRequest
    >(`${this.streamClientBasePath}/user_permissions`, data);
  };

  /**
   * Starts the livestreaming of the call.
   */
  goLive = async (notify?: boolean) => {
    return this.streamClient.post<GoLiveResponse>(
      `${this.streamClientBasePath}/go_live${notify ? '?notify=true' : ''}`,
      {},
    );
  };

  /**
   * Stops the livestreaming of the call.
   */
  stopLive = async () => {
    return this.streamClient.post<StopLiveResponse>(
      `${this.streamClientBasePath}/stop_live`,
      {},
    );
  };

  /**
   * Starts the broadcasting of the call.
   */
  startBroadcasting = async () => {
    return this.streamClient.post<StartBroadcastingResponse>(
      `${this.streamClientBasePath}/start_broadcasting`,
      {},
    );
  };

  /**
   * Stops the broadcasting of the call.
   */
  stopBroadcasting = async () => {
    return this.streamClient.post<StopBroadcastingResponse>(
      `${this.streamClientBasePath}/stop_broadcasting`,
      {},
    );
  };

  /**
   * Updates the call settings or custom data.
   *
   * @param updates the updates to apply to the call.
   */
  update = async (updates: UpdateCallRequest) => {
    const response = await this.streamClient.patch<
      UpdateCallResponse,
      UpdateCallRequest
    >(`${this.streamClientBasePath}`, updates);

    const { call, members, own_capabilities } = response;
    this.state.setMetadata(call);
    this.state.setMembers(members);
    this.state.setOwnCapabilities(own_capabilities);

    return response;
  };

  /**
   * Ends the call. Once the call is ended, it cannot be re-joined.
   */
  endCall = async () => {
    return this.streamClient.post<EndCallResponse>(
      `${this.streamClientBasePath}/mark_ended`,
    );
  };

  /**
   * Sets the `participant.pinnedAt` value.
   * @param sessionId the session id of the participant
   * @param pinnedAt the value to set the participant.pinnedAt
   * @returns
   */
  setParticipantPinnedAt = (sessionId: string, pinnedAt?: number): void => {
    this.state.updateParticipant(sessionId, {
      pinnedAt,
    });
  };

  /**
   * Query call members with filter query. The result won't be stored in call state.
   * @param request
   * @returns
   */
  queryMembers = (request: Omit<QueryMembersRequest, 'type' | 'id'>) => {
    return this.streamClient.post<QueryMembersResponse, QueryMembersRequest>(
      '/call/members',
      {
        ...request,
        id: this.id,
        type: this.type,
      },
    );
  };

  /**
   * Will update the call members.
   *
   * @param data the request data.
   */
  updateCallMembers = async (
    data: UpdateCallMembersRequest,
  ): Promise<UpdateCallMembersResponse> => {
    return this.streamClient.post<
      UpdateCallMembersResponse,
      UpdateCallMembersRequest
    >(`${this.streamClientBasePath}/members`, data);
  };

  private scheduleAutoDrop = () => {
    if (this.dropTimeout) clearTimeout(this.dropTimeout);
    const subscription = this.state.metadata$
      .pipe(
        pairwise(),
        tap(([prevMeta, currentMeta]) => {
          if (!(currentMeta && this.clientStore.connectedUser)) return;

          const isOutgoingCall =
            this.currentUserId === currentMeta.created_by.id;

          const [prevTimeoutMs, timeoutMs] = isOutgoingCall
            ? [
                prevMeta?.settings.ring.auto_cancel_timeout_ms,
                currentMeta.settings.ring.auto_cancel_timeout_ms,
              ]
            : [
                prevMeta?.settings.ring.incoming_call_timeout_ms,
                currentMeta.settings.ring.incoming_call_timeout_ms,
              ];
          if (
            typeof timeoutMs === 'undefined' ||
            timeoutMs === prevTimeoutMs ||
            timeoutMs === 0
          )
            return;

          if (this.dropTimeout) clearTimeout(this.dropTimeout);
          this.dropTimeout = setTimeout(() => this.leave(), timeoutMs);
        }),
        takeWhile(
          () => !!this.clientStore.calls.find((call) => call.cid === this.cid),
        ),
      )
      .subscribe();

    this.leaveCallHooks.push(() => {
      !subscription.closed && subscription.unsubscribe();
    });
  };

  /**
   * Retrieves the list of recordings for the current call or call session.
   * Updates the call state with the returned array of CallRecording objects.
   *
   * If `callSessionId` is provided, it will return the recordings for that call session.
   * Otherwise, all recordings for the current call will be returned.
   *
   * @param callSessionId the call session id to retrieve recordings for.
   */
  queryRecordings = async (
    callSessionId?: string,
  ): Promise<ListRecordingsResponse> => {
    let endpoint = this.streamClientBasePath;
    if (callSessionId) {
      endpoint = `${endpoint}/${callSessionId}`;
    }
    const response = await this.streamClient.get<ListRecordingsResponse>(
      `${endpoint}/recordings`,
    );

    this.state.setCallRecordingsList(response.recordings);

    return response;
  };

  /**
   * Sends a custom event to all call participants.
   *
   * @param payload the payload to send.
   */
  sendCustomEvent = async (payload: { [key: string]: any }) => {
    return this.streamClient.post<SendEventResponse, SendEventRequest>(
      `${this.streamClientBasePath}/event`,
      { custom: payload },
    );
  };
}
