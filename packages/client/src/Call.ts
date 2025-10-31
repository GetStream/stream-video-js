import { StreamSfuClient } from './StreamSfuClient';
import {
  Dispatcher,
  getGenericSdp,
  isAudioTrackType,
  isSfuEvent,
  muteTypeToTrackType,
  Publisher,
  Subscriber,
  toRtcConfiguration,
  TrackPublishOptions,
  trackTypeToParticipantStreamKey,
} from './rtc';
import {
  registerEventHandlers,
  registerRingingCallEventHandlers,
} from './events/callEventHandlers';
import {
  CallingState,
  CallState,
  StreamVideoWriteableStateStore,
} from './store';
import {
  createSafeAsyncSubscription,
  createSubscription,
  getCurrentValue,
} from './store/rxUtils';
import { ScopedLogger, videoLoggerSystem } from './logger';
import type {
  AcceptCallResponse,
  BlockUserRequest,
  BlockUserResponse,
  CallRingEvent,
  CallSettingsResponse,
  CollectUserFeedbackRequest,
  CollectUserFeedbackResponse,
  Credentials,
  DeleteCallRequest,
  DeleteCallResponse,
  EndCallResponse,
  GetCallReportResponse,
  GetCallResponse,
  GetCallSessionParticipantStatsDetailsResponse,
  GetOrCreateCallRequest,
  GetOrCreateCallResponse,
  GoLiveRequest,
  GoLiveResponse,
  JoinCallRequest,
  JoinCallResponse,
  KickUserRequest,
  KickUserResponse,
  ListRecordingsResponse,
  ListTranscriptionsResponse,
  MuteUsersRequest,
  MuteUsersResponse,
  PinRequest,
  PinResponse,
  QueryCallMembersRequest,
  QueryCallMembersResponse,
  QueryCallSessionParticipantStatsResponse,
  QueryCallSessionParticipantStatsTimelineResponse,
  RejectCallRequest,
  RejectCallResponse,
  RequestPermissionRequest,
  RequestPermissionResponse,
  SendCallEventRequest,
  SendCallEventResponse,
  SendReactionRequest,
  SendReactionResponse,
  StartClosedCaptionsRequest,
  StartClosedCaptionsResponse,
  StartFrameRecordingRequest,
  StartFrameRecordingResponse,
  StartHLSBroadcastingResponse,
  StartRecordingRequest,
  StartRecordingResponse,
  StartRTMPBroadcastsRequest,
  StartRTMPBroadcastsResponse,
  StartTranscriptionRequest,
  StartTranscriptionResponse,
  StatsOptions,
  StopAllRTMPBroadcastsResponse,
  StopClosedCaptionsRequest,
  StopClosedCaptionsResponse,
  StopFrameRecordingResponse,
  StopHLSBroadcastingResponse,
  StopLiveRequest,
  StopLiveResponse,
  StopRecordingResponse,
  StopRTMPBroadcastsResponse,
  StopTranscriptionResponse,
  UnblockUserRequest,
  UnblockUserResponse,
  UnpinRequest,
  UnpinResponse,
  UpdateCallMembersRequest,
  UpdateCallMembersResponse,
  UpdateCallRequest,
  UpdateCallResponse,
  UpdateUserPermissionsRequest,
  UpdateUserPermissionsResponse,
} from './gen/coordinator';
import { OwnCapability } from './gen/coordinator';
import {
  AudioTrackType,
  CallConstructor,
  CallLeaveOptions,
  ClientPublishOptions,
  ClosedCaptionsSettings,
  JoinCallData,
  TrackMuteType,
  VideoTrackType,
} from './types';
import { BehaviorSubject, Subject, takeWhile } from 'rxjs';
import { ReconnectDetails } from './gen/video/sfu/event/events';
import {
  ClientCapability,
  ClientDetails,
  Codec,
  ParticipantSource,
  PublishOption,
  SubscribeOption,
  TrackType,
  VideoDimension,
  WebsocketReconnectStrategy,
} from './gen/video/sfu/models/models';
import {
  createStatsReporter,
  getSdkSignature,
  SfuStatsReporter,
  StatsReporter,
  Tracer,
} from './stats';
import { DynascaleManager } from './helpers/DynascaleManager';
import { PermissionsContext } from './permissions';
import { CallTypes } from './CallType';
import { StreamClient } from './coordinator/connection/client';
import { retryInterval, sleep } from './coordinator/connection/utils';
import {
  AllCallEvents,
  CallEventListener,
  ErrorFromResponse,
  RejectReason,
  StreamCallEvent,
} from './coordinator/connection/types';
import { getClientDetails } from './helpers/client-details';
import {
  CameraManager,
  MicrophoneManager,
  ScreenShareManager,
  SpeakerManager,
} from './devices';
import { hasPending, withoutConcurrency } from './helpers/concurrency';
import { ensureExhausted } from './helpers/ensureExhausted';
import { pushToIfMissing } from './helpers/array';
import {
  makeSafePromise,
  PromiseWithResolvers,
  promiseWithResolvers,
} from './helpers/promise';
import { GetCallStatsResponse } from './gen/shims';

/**
 * An object representation of a `Call`.
 */
export class Call {
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
   * Device manager for the camera
   */
  readonly camera: CameraManager;

  /**
   * Device manager for the microphone.
   */
  readonly microphone: MicrophoneManager;

  /**
   * Device manager for the speaker.
   */
  readonly speaker: SpeakerManager;

  /**
   * Device manager for the screen.
   */
  readonly screenShare: ScreenShareManager;

  /**
   * The DynascaleManager instance.
   */
  readonly dynascaleManager: DynascaleManager;

  subscriber?: Subscriber;
  publisher?: Publisher;

  /**
   * Flag telling whether this call is a "ringing" call.
   */
  private readonly ringingSubject: Subject<boolean>;

  /**
   * The permissions context of this call.
   */
  readonly permissionsContext = new PermissionsContext();
  readonly tracer = new Tracer(null);
  readonly logger: ScopedLogger;

  /**
   * The event dispatcher instance dedicated to this Call instance.
   * @private
   */
  private readonly dispatcher = new Dispatcher();

  private clientPublishOptions?: ClientPublishOptions;
  private currentPublishOptions?: PublishOption[];
  private statsReportingIntervalInMs: number = 2000;
  private statsReporter?: StatsReporter;
  private sfuStatsReporter?: SfuStatsReporter;
  private dropTimeout: ReturnType<typeof setTimeout> | undefined;

  private readonly clientStore: StreamVideoWriteableStateStore;
  public readonly streamClient: StreamClient;
  private sfuClient?: StreamSfuClient;
  private sfuClientTag = 0;
  private unifiedSessionId?: string;

  private readonly reconnectConcurrencyTag = Symbol('reconnectConcurrencyTag');
  private reconnectAttempts = 0;
  private reconnectStrategy = WebsocketReconnectStrategy.UNSPECIFIED;
  private reconnectReason = '';
  private fastReconnectDeadlineSeconds: number = 0;
  private disconnectionTimeoutSeconds: number = 0;
  private lastOfflineTimestamp: number = 0;
  private networkAvailableTask: PromiseWithResolvers<void> | undefined;
  // maintain the order of publishing tracks to restore them after a reconnection
  // it shouldn't contain duplicates
  private trackPublishOrder: TrackType[] = [];
  private joinCallData?: JoinCallData;
  private hasJoinedOnce = false;
  private deviceSettingsAppliedOnce = false;
  private credentials?: Credentials;

  private initialized = false;
  private readonly joinLeaveConcurrencyTag = Symbol('joinLeaveConcurrencyTag');

  /**
   * A list hooks/functions to invoke when the call is left.
   * A typical use case is to clean up some global event handlers.
   * @private
   */
  private readonly leaveCallHooks: Set<Function> = new Set();

  private readonly streamClientBasePath: string;
  private streamClientEventHandlers = new Map<Function, () => void>();

  /**
   * A list of capabilities that the client supports and are enabled.
   */
  private clientCapabilities = new Set<ClientCapability>([
    ClientCapability.SUBSCRIBER_VIDEO_PAUSE,
  ]);

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
    this.logger = videoLoggerSystem.getLogger('Call');

    const callTypeConfig = CallTypes.get(type);
    const participantSorter =
      sortParticipantsBy || callTypeConfig.options.sortParticipantsBy;
    if (participantSorter) {
      this.state.setSortParticipantsBy(participantSorter);
    }

    this.state.setMembers(members || []);
    this.state.setOwnCapabilities(ownCapabilities || []);
    this.state.setCallingState(
      ringing ? CallingState.RINGING : CallingState.IDLE,
    );

    this.camera = new CameraManager(this);
    this.microphone = new MicrophoneManager(this);
    this.speaker = new SpeakerManager(this);
    this.screenShare = new ScreenShareManager(this);
    this.dynascaleManager = new DynascaleManager(this.state, this.speaker);
  }

  /**
   * Sets up the call instance.
   *
   * @internal an internal method and should not be used outside the SDK.
   */
  setup = async () => {
    await withoutConcurrency(this.joinLeaveConcurrencyTag, async () => {
      if (this.initialized) return;

      this.leaveCallHooks.add(
        this.on('all', (event) => {
          // update state with the latest event data
          this.state.updateFromEvent(event);
        }),
      );

      this.leaveCallHooks.add(
        this.on('changePublishOptions', (event) => {
          this.currentPublishOptions = event.publishOptions;
        }),
      );

      this.leaveCallHooks.add(registerEventHandlers(this, this.dispatcher));
      this.registerEffects();
      this.registerReconnectHandlers();

      this.camera.setup();
      this.microphone.setup();
      this.screenShare.setup();
      this.speaker.setup();

      if (this.state.callingState === CallingState.LEFT) {
        this.state.setCallingState(CallingState.IDLE);
      }

      this.initialized = true;
    });
  };

  private registerEffects = () => {
    this.leaveCallHooks.add(
      // handles updating the permissions context when the settings change.
      createSubscription(this.state.settings$, (settings) => {
        if (!settings) return;
        this.permissionsContext.setCallSettings(settings);
      }),
    );

    this.leaveCallHooks.add(
      // handle the case when the user permissions are modified.
      createSafeAsyncSubscription(
        this.state.ownCapabilities$,
        this.handleOwnCapabilitiesUpdated,
      ),
    );

    this.leaveCallHooks.add(
      // handles the case when the user is blocked by the call owner.
      createSubscription(this.state.blockedUserIds$, async (blockedUserIds) => {
        if (!blockedUserIds || blockedUserIds.length === 0) return;
        const currentUserId = this.currentUserId;
        if (currentUserId && blockedUserIds.includes(currentUserId)) {
          this.logger.info('Leaving call because of being blocked');
          await this.leave({ message: 'user blocked' }).catch((err) => {
            this.logger.error('Error leaving call after being blocked', err);
          });
        }
      }),
    );

    if (this.ringing) {
      // if the call is ringing, we need to register the ringing call effects
      this.handleRingingCall();
    } else {
      // if the call is not ringing, we need to register the ringing call subscriptions
      // to handle the case when the call gets ringing flag after creation event
      this.leaveCallHooks.add(
        // "ringing" mode effects and event handlers
        createSubscription(this.ringingSubject, (isRinging) => {
          if (!isRinging) return;
          this.handleRingingCall();
        }),
      );
    }

    this.leaveCallHooks.add(
      // cancel auto-drop when call is accepted or rejected
      createSubscription(this.state.session$, (session) => {
        if (!this.ringing) return;

        const receiverId = this.clientStore.connectedUser?.id;
        if (!receiverId) return;

        const isAcceptedByMe = Boolean(session?.accepted_by[receiverId]);
        const isRejectedByMe = Boolean(session?.rejected_by[receiverId]);

        if (isAcceptedByMe || isRejectedByMe) {
          this.cancelAutoDrop();
        }

        const isAcceptedElsewhere =
          isAcceptedByMe && this.state.callingState === CallingState.RINGING;

        if (
          (isAcceptedElsewhere || isRejectedByMe) &&
          !hasPending(this.joinLeaveConcurrencyTag)
        ) {
          this.leave().catch(() => {
            this.logger.error(
              'Could not leave a call that was accepted or rejected elsewhere',
            );
          });
        }
      }),
    );
  };

  private handleRingingCall = () => {
    const callSession = this.state.session;
    const receiver_id = this.clientStore.connectedUser?.id;
    const ended_at = callSession?.ended_at;
    const created_by_id = this.state.createdBy?.id;
    const rejected_by = callSession?.rejected_by;
    const accepted_by = callSession?.accepted_by;
    let leaveCallIdle = false;
    if (ended_at) {
      // call was ended before it was accepted or rejected so we should leave it to idle
      leaveCallIdle = true;
    } else if (created_by_id && rejected_by) {
      if (rejected_by[created_by_id]) {
        // call was cancelled by the caller
        leaveCallIdle = true;
      }
    } else if (receiver_id && rejected_by) {
      if (rejected_by[receiver_id]) {
        // call was rejected by the receiver in some other device
        leaveCallIdle = true;
      }
    } else if (receiver_id && accepted_by) {
      if (accepted_by[receiver_id]) {
        // call was accepted by the receiver in some other device
        leaveCallIdle = true;
      }
    }
    if (leaveCallIdle) {
      if (this.state.callingState !== CallingState.IDLE) {
        this.state.setCallingState(CallingState.IDLE);
      }
    } else {
      if (this.state.callingState === CallingState.IDLE) {
        this.state.setCallingState(CallingState.RINGING);
      }
      this.scheduleAutoDrop();
      this.leaveCallHooks.add(registerRingingCallEventHandlers(this));
    }
  };

  private handleOwnCapabilitiesUpdated = async (
    ownCapabilities: OwnCapability[],
  ) => {
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
      if (hasPermission) continue;
      try {
        switch (trackType) {
          case TrackType.AUDIO:
            if (this.microphone.enabled) await this.microphone.disable();
            break;
          case TrackType.VIDEO:
            if (this.camera.enabled) await this.camera.disable();
            break;
          case TrackType.SCREEN_SHARE:
            if (this.screenShare.enabled) await this.screenShare.disable();
            break;
        }
      } catch (err) {
        this.logger.error(
          `Can't disable mic/camera/screenshare after revoked permissions`,
          err,
        );
      }
    }
  };

  /**
   * You can subscribe to WebSocket events provided by the API. To remove a subscription, call the `off` method.
   * Please note that subscribing to WebSocket events is an advanced use-case.
   * For most use-cases, it should be enough to watch for state changes.
   *
   * @param eventName the event name.
   * @param fn the event handler.
   */
  on = <E extends keyof AllCallEvents>(
    eventName: E,
    fn: CallEventListener<E>,
  ) => {
    if (isSfuEvent(eventName)) {
      return this.dispatcher.on(eventName, fn);
    }

    const offHandler = this.streamClient.on(eventName, (e) => {
      const event = e as StreamCallEvent;
      if (event.call_cid && event.call_cid === this.cid) {
        fn(event as AllCallEvents[E]);
      }
    });

    // keep the 'off' reference returned by the stream client
    this.streamClientEventHandlers.set(fn, offHandler);
    return () => {
      this.off(eventName, fn);
    };
  };

  /**
   * Remove subscription for WebSocket events that were created by the `on` method.
   *
   * @param eventName the event name.
   * @param fn the event handler.
   */
  off = <E extends keyof AllCallEvents>(
    eventName: E,
    fn: CallEventListener<E>,
  ) => {
    if (isSfuEvent(eventName)) {
      return this.dispatcher.off(eventName, fn);
    }

    // unsubscribe from the stream client event by using the 'off' reference
    const registeredOffHandler = this.streamClientEventHandlers.get(fn);
    if (registeredOffHandler) {
      registeredOffHandler();
    }
  };

  /**
   * Leave the call and stop the media streams that were published by the call.
   */
  leave = async ({ reject, reason, message }: CallLeaveOptions = {}) => {
    if (this.state.callingState === CallingState.LEFT) {
      throw new Error('Cannot leave call that has already been left.');
    }

    await withoutConcurrency(this.joinLeaveConcurrencyTag, async () => {
      const callingState = this.state.callingState;

      if (callingState === CallingState.LEFT) {
        return;
      }

      if (callingState === CallingState.JOINING) {
        const waitUntilCallJoined = () => {
          return new Promise<void>((resolve) => {
            this.state.callingState$
              .pipe(takeWhile((state) => state !== CallingState.JOINED, true))
              .subscribe(() => resolve());
          });
        };
        await waitUntilCallJoined();
      }

      if (callingState === CallingState.RINGING && reject !== false) {
        if (reject) {
          await this.reject(reason ?? 'decline');
        } else {
          // if reject was undefined, we still have to cancel the call automatically
          // when I am the creator and everyone else left the call
          const hasOtherParticipants = this.state.remoteParticipants.length > 0;
          if (this.isCreatedByMe && !hasOtherParticipants) {
            await this.reject('cancel');
          }
        }
      }

      this.statsReporter?.stop();
      this.statsReporter = undefined;

      this.sfuStatsReporter?.flush();
      this.sfuStatsReporter?.stop();
      this.sfuStatsReporter = undefined;

      this.subscriber?.dispose();
      this.subscriber = undefined;

      this.publisher?.dispose();
      this.publisher = undefined;

      await this.sfuClient?.leaveAndClose(
        message ?? reason ?? 'user is leaving the call',
      );
      this.sfuClient = undefined;
      this.dynascaleManager.setSfuClient(undefined);
      await this.dynascaleManager.dispose();

      this.state.setCallingState(CallingState.LEFT);
      this.state.setParticipants([]);
      this.state.dispose();

      // Call all leave call hooks, e.g. to clean up global event handlers
      this.leaveCallHooks.forEach((hook) => hook());
      this.initialized = false;
      this.hasJoinedOnce = false;
      this.unifiedSessionId = undefined;
      this.ringingSubject.next(false);
      this.cancelAutoDrop();
      this.clientStore.unregisterCall(this);

      this.camera.dispose();
      this.microphone.dispose();
      this.screenShare.dispose();
      this.speaker.dispose();
      this.deviceSettingsAppliedOnce = false;

      const stopOnLeavePromises: Promise<void>[] = [];
      if (this.camera.stopOnLeave) {
        stopOnLeavePromises.push(this.camera.disable(true));
      }
      if (this.microphone.stopOnLeave) {
        stopOnLeavePromises.push(this.microphone.disable(true));
      }
      if (this.screenShare.stopOnLeave) {
        stopOnLeavePromises.push(this.screenShare.disable(true));
      }
      await Promise.all(stopOnLeavePromises);
    });
  };

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
    return this.state.createdBy?.id === this.currentUserId;
  }

  /**
   * Update from the call response from the "call.ring" event
   * @internal
   */
  updateFromRingingEvent = async (event: CallRingEvent) => {
    await this.setup();
    // call.ring event excludes the call creator in the members list
    // as the creator does not get the ring event
    // so update the member list accordingly
    const { created_by, settings } = event.call;
    const creator = this.state.members.find((m) => m.user.id === created_by.id);
    if (!creator) {
      this.state.setMembers(event.members);
    } else {
      this.state.setMembers([creator, ...event.members]);
    }
    // update the call state with the latest event data
    this.state.updateFromCallResponse(event.call);
    this.watching = true;
    this.ringingSubject.next(true);
    // we remove the instance from the calls list to enable the following filter in useCalls hook
    // const calls = useCalls().filter((c) => c.ringing);
    const calls = this.clientStore.calls.filter((c) => c.cid !== this.cid);
    this.clientStore.setCalls([this, ...calls]);
    await this.applyDeviceConfig(settings, false);
  };

  /**
   * Loads the information about the call.
   *
   * @param params.ring if set to true, a `call.ring` event will be sent to the call members.
   * @param params.notify if set to true, a `call.notification` event will be sent to the call members.
   * @param params.members_limit the total number of members to return as part of the response.
   */
  get = async (params?: {
    ring?: boolean;
    notify?: boolean;
    members_limit?: number;
  }) => {
    await this.setup();
    const response = await this.streamClient.get<GetCallResponse>(
      this.streamClientBasePath,
      params,
    );

    this.state.updateFromCallResponse(response.call);
    this.state.setMembers(response.members);
    this.state.setOwnCapabilities(response.own_capabilities);

    if (params?.ring) {
      this.ringingSubject.next(true);
    }

    if (this.streamClient._hasConnectionID()) {
      this.watching = true;
      this.clientStore.registerCall(this);
    }

    await this.applyDeviceConfig(response.call.settings, false);

    return response;
  };

  /**
   * Loads the information about the call and creates it if it doesn't exist.
   *
   * @param data the data to create the call with.
   */
  getOrCreate = async (data?: GetOrCreateCallRequest) => {
    await this.setup();
    const response = await this.streamClient.post<
      GetOrCreateCallResponse,
      GetOrCreateCallRequest
    >(this.streamClientBasePath, data);

    this.state.updateFromCallResponse(response.call);
    this.state.setMembers(response.members);
    this.state.setOwnCapabilities(response.own_capabilities);

    if (data?.ring) {
      this.ringingSubject.next(true);
    }

    if (this.streamClient._hasConnectionID()) {
      this.watching = true;
      this.clientStore.registerCall(this);
    }

    await this.applyDeviceConfig(response.call.settings, false);

    return response;
  };

  /**
   * Creates a call
   *
   * @param data the data to create the call with.
   */
  create = async (data?: GetOrCreateCallRequest) => {
    return this.getOrCreate(data);
  };

  /**
   * Deletes the call.
   */
  delete = async (
    data: DeleteCallRequest = {},
  ): Promise<DeleteCallResponse> => {
    return this.streamClient.post<DeleteCallResponse, DeleteCallRequest>(
      `${this.streamClientBasePath}/delete`,
      data,
    );
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
   *
   * @param reason the reason for rejecting the call.
   */
  reject = async (
    reason: RejectReason = 'decline',
  ): Promise<RejectCallResponse> => {
    return this.streamClient.post<RejectCallResponse, RejectCallRequest>(
      `${this.streamClientBasePath}/reject`,
      { reason: reason },
    );
  };

  /**
   * Will start to watch for call related WebSocket events and initiate a call session with the server.
   *
   * @returns a promise which resolves once the call join-flow has finished.
   */
  join = async ({
    maxJoinRetries = 3,
    ...data
  }: JoinCallData & {
    maxJoinRetries?: number;
  } = {}): Promise<void> => {
    await this.setup();
    const callingState = this.state.callingState;

    if ([CallingState.JOINED, CallingState.JOINING].includes(callingState)) {
      throw new Error(`Illegal State: call.join() shall be called only once`);
    }

    // we will count the number of join failures per SFU.
    // once the number of failures reaches 2, we will piggyback on the `migrating_from`
    // field to force the coordinator to provide us another SFU
    const sfuJoinFailures = new Map<string, number>();
    const joinData: JoinCallData = data;
    maxJoinRetries = Math.max(maxJoinRetries, 1);
    for (let attempt = 0; attempt < maxJoinRetries; attempt++) {
      try {
        this.logger.trace(`Joining call (${attempt})`, this.cid);
        await this.doJoin(data);
        delete joinData.migrating_from;
        break;
      } catch (err) {
        this.logger.warn(`Failed to join call (${attempt})`, this.cid);
        if (err instanceof ErrorFromResponse && err.unrecoverable) {
          // if the error is unrecoverable, we should not retry as that signals
          // that connectivity is good, but the coordinator doesn't allow the user
          // to join the call due to some reason (e.g., ended call, expired token...)
          throw err;
        }

        const sfuId = this.credentials?.server.edge_name || '';
        const failures = (sfuJoinFailures.get(sfuId) || 0) + 1;
        sfuJoinFailures.set(sfuId, failures);
        if (failures >= 2) {
          joinData.migrating_from = sfuId;
        }

        if (attempt === maxJoinRetries - 1) {
          throw err;
        }
      }

      await sleep(retryInterval(attempt));
    }
  };

  /**
   * Will make a single attempt to watch for call related WebSocket events
   * and initiate a call session with the server.
   *
   * @returns a promise which resolves once the call join-flow has finished.
   */
  private doJoin = async (data?: JoinCallData): Promise<void> => {
    const connectStartTime = Date.now();
    const callingState = this.state.callingState;

    this.joinCallData = data;

    this.logger.debug('Starting join flow');
    this.state.setCallingState(CallingState.JOINING);

    const performingMigration =
      this.reconnectStrategy === WebsocketReconnectStrategy.MIGRATE;
    const performingRejoin =
      this.reconnectStrategy === WebsocketReconnectStrategy.REJOIN;
    const performingFastReconnect =
      this.reconnectStrategy === WebsocketReconnectStrategy.FAST;

    let statsOptions = this.sfuStatsReporter?.options;
    if (
      !this.credentials ||
      !statsOptions ||
      performingRejoin ||
      performingMigration
    ) {
      try {
        const joinResponse = await this.doJoinRequest(data);
        this.credentials = joinResponse.credentials;
        statsOptions = joinResponse.stats_options;
      } catch (error) {
        // prevent triggering reconnect flow if the state is OFFLINE
        const avoidRestoreState =
          this.state.callingState === CallingState.OFFLINE;

        if (!avoidRestoreState) {
          // restore the previous call state if the join-flow fails
          this.state.setCallingState(callingState);
        }
        throw error;
      }
    }

    const previousSfuClient = this.sfuClient;
    const previousSessionId = previousSfuClient?.sessionId;
    const isWsHealthy = !!previousSfuClient?.isHealthy;
    const sfuClient =
      performingRejoin || performingMigration || !isWsHealthy
        ? new StreamSfuClient({
            tag: String(this.sfuClientTag++),
            cid: this.cid,
            dispatcher: this.dispatcher,
            credentials: this.credentials,
            streamClient: this.streamClient,
            enableTracing: statsOptions.enable_rtc_stats,
            // a new session_id is necessary for the REJOIN strategy.
            // we use the previous session_id if available
            sessionId: performingRejoin ? undefined : previousSessionId,
            onSignalClose: (reason) =>
              this.handleSfuSignalClose(sfuClient, reason),
          })
        : previousSfuClient;
    this.sfuClient = sfuClient;
    this.unifiedSessionId ??= sfuClient.sessionId;
    this.dynascaleManager.setSfuClient(sfuClient);

    const clientDetails = await getClientDetails();
    // we don't need to send JoinRequest if we are re-using an existing healthy SFU client
    if (previousSfuClient !== sfuClient) {
      // prepare a generic SDP and send it to the SFU.
      // these are throw-away SDPs that the SFU will use to determine
      // the capabilities of the client (codec support, etc.)
      const [subscriberSdp, publisherSdp] = await Promise.all([
        getGenericSdp('recvonly'),
        getGenericSdp('sendonly'),
      ]);
      const isReconnecting =
        this.reconnectStrategy !== WebsocketReconnectStrategy.UNSPECIFIED;
      const reconnectDetails = isReconnecting
        ? this.getReconnectDetails(data?.migrating_from, previousSessionId)
        : undefined;
      const preferredPublishOptions = !isReconnecting
        ? this.getPreferredPublishOptions()
        : this.currentPublishOptions || [];
      const preferredSubscribeOptions = !isReconnecting
        ? this.getPreferredSubscribeOptions()
        : [];

      try {
        const { callState, fastReconnectDeadlineSeconds, publishOptions } =
          await sfuClient.join({
            unifiedSessionId: this.unifiedSessionId,
            subscriberSdp,
            publisherSdp,
            clientDetails,
            fastReconnect: performingFastReconnect,
            reconnectDetails,
            preferredPublishOptions,
            preferredSubscribeOptions,
            capabilities: Array.from(this.clientCapabilities),
            source: ParticipantSource.WEBRTC_UNSPECIFIED,
          });

        this.currentPublishOptions = publishOptions;
        this.fastReconnectDeadlineSeconds = fastReconnectDeadlineSeconds;
        if (callState) {
          this.state.updateFromSfuCallState(
            callState,
            sfuClient.sessionId,
            reconnectDetails,
          );
        }
      } catch (error) {
        this.logger.warn('Join SFU request failed', error);
        sfuClient.close(
          StreamSfuClient.JOIN_FAILED,
          'Join request failed, connection considered unhealthy',
        );
        // restore the previous call state if the join-flow fails
        this.state.setCallingState(callingState);
        throw error;
      }
    }

    if (!performingMigration) {
      // in MIGRATION, `JOINED` state is set in `this.reconnectMigrate()`
      this.state.setCallingState(CallingState.JOINED);
    }
    this.hasJoinedOnce = true;

    // when performing fast reconnect, or when we reuse the same SFU client,
    // (ws remained healthy), we just need to restore the ICE connection
    if (performingFastReconnect) {
      // the SFU automatically issues an ICE restart on the subscriber
      // we don't have to do it ourselves
      await this.restoreICE(sfuClient, { includeSubscriber: false });
    } else {
      const connectionConfig = toRtcConfiguration(this.credentials.ice_servers);
      this.initPublisherAndSubscriber({
        sfuClient,
        connectionConfig,
        clientDetails,
        statsOptions,
        publishOptions: this.currentPublishOptions || [],
        closePreviousInstances: !performingMigration,
        unifiedSessionId: this.unifiedSessionId,
      });
    }

    // make sure we only track connection timing if we are not calling this method as part of a reconnection flow
    if (!performingRejoin && !performingFastReconnect && !performingMigration) {
      this.sfuStatsReporter?.sendConnectionTime(
        (Date.now() - connectStartTime) / 1000,
      );
    }

    if (performingRejoin && isWsHealthy) {
      const strategy = WebsocketReconnectStrategy[this.reconnectStrategy];
      await previousSfuClient?.leaveAndClose(
        `Closing previous WS after reconnect with strategy: ${strategy}`,
      );
    } else if (!isWsHealthy) {
      previousSfuClient?.close(
        StreamSfuClient.DISPOSE_OLD_SOCKET,
        'Closing unhealthy WS after reconnect',
      );
    }

    // device settings should be applied only once, we don't have to
    // re-apply them on later reconnections or server-side data fetches
    if (!this.deviceSettingsAppliedOnce && this.state.settings) {
      await this.applyDeviceConfig(this.state.settings, true);
      this.deviceSettingsAppliedOnce = true;
    }

    // We shouldn't persist the `ring` and `notify` state after joining the call
    // as it's a one-time event and clashes with the potential reconnection attempts.
    // When reconnecting, if provided with `ring: true` or `notify: true`,
    // we will spam the other participants with push notifications and `call.ring` events.
    delete this.joinCallData?.ring;
    delete this.joinCallData?.notify;
    // reset the reconnect strategy to unspecified after a successful reconnection
    this.reconnectStrategy = WebsocketReconnectStrategy.UNSPECIFIED;
    this.reconnectReason = '';

    this.logger.info(`Joined call ${this.cid}`);
  };

  /**
   * Prepares Reconnect Details object.
   * @internal
   */
  private getReconnectDetails = (
    migratingFromSfuId: string | undefined,
    previousSessionId: string | undefined,
  ): ReconnectDetails => {
    const strategy = this.reconnectStrategy;
    const performingRejoin = strategy === WebsocketReconnectStrategy.REJOIN;
    const announcedTracks =
      this.publisher?.getAnnouncedTracksForReconnect() || [];
    return {
      strategy,
      announcedTracks,
      subscriptions: this.dynascaleManager.trackSubscriptions,
      reconnectAttempt: this.reconnectAttempts,
      fromSfuId: migratingFromSfuId || '',
      previousSessionId: performingRejoin ? previousSessionId || '' : '',
      reason: this.reconnectReason,
    };
  };

  /**
   * Prepares the preferred codec for the call.
   * This is an experimental client feature and subject to change.
   * @internal
   */
  private getPreferredPublishOptions = (): PublishOption[] => {
    const { preferredCodec, fmtpLine, preferredBitrate, maxSimulcastLayers } =
      this.clientPublishOptions || {};
    if (!preferredCodec && !preferredBitrate && !maxSimulcastLayers) return [];

    const codec = preferredCodec
      ? Codec.create({ name: preferredCodec.split('/').pop(), fmtp: fmtpLine })
      : undefined;

    const preferredPublishOptions = [
      PublishOption.create({
        trackType: TrackType.VIDEO,
        codec,
        bitrate: preferredBitrate,
        maxSpatialLayers: maxSimulcastLayers,
      }),
    ];

    const screenShareSettings = this.screenShare.getSettings();
    if (screenShareSettings) {
      preferredPublishOptions.push(
        PublishOption.create({
          trackType: TrackType.SCREEN_SHARE,
          fps: screenShareSettings.maxFramerate,
          bitrate: screenShareSettings.maxBitrate,
        }),
      );
    }

    return preferredPublishOptions;
  };

  /**
   * Prepares the preferred options for subscribing to tracks.
   * This is an experimental client feature and subject to change.
   * @internal
   */
  private getPreferredSubscribeOptions = (): SubscribeOption[] => {
    const { subscriberCodec, subscriberFmtpLine } =
      this.clientPublishOptions || {};
    if (!subscriberCodec || !subscriberFmtpLine) return [];
    return [
      SubscribeOption.create({
        trackType: TrackType.VIDEO,
        codecs: [
          { name: subscriberCodec.split('/').pop(), fmtp: subscriberFmtpLine },
        ],
      }),
    ];
  };

  /**
   * Performs an ICE restart on both the Publisher and Subscriber Peer Connections.
   * Uses the provided SFU client to restore the ICE connection.
   *
   * This method can throw an error if the ICE restart fails.
   * This error should be handled by the reconnect loop,
   * and a new reconnection shall be attempted.
   *
   * @internal
   */
  private restoreICE = async (
    nextSfuClient: StreamSfuClient,
    opts: { includeSubscriber?: boolean; includePublisher?: boolean } = {},
  ) => {
    const { includeSubscriber = true, includePublisher = true } = opts;
    if (this.subscriber) {
      this.subscriber.setSfuClient(nextSfuClient);
      if (includeSubscriber) {
        await this.subscriber.restartIce();
      }
    }
    if (this.publisher) {
      this.publisher.setSfuClient(nextSfuClient);
      if (includePublisher && this.publisher.isPublishing()) {
        await this.publisher.restartIce();
      }
    }
  };

  /**
   * Initializes the Publisher and Subscriber Peer Connections.
   * @internal
   */
  private initPublisherAndSubscriber = (opts: {
    sfuClient: StreamSfuClient;
    connectionConfig: RTCConfiguration;
    statsOptions: StatsOptions;
    clientDetails: ClientDetails;
    publishOptions: PublishOption[];
    closePreviousInstances: boolean;
    unifiedSessionId: string;
  }) => {
    const {
      sfuClient,
      connectionConfig,
      clientDetails,
      statsOptions,
      publishOptions,
      closePreviousInstances,
      unifiedSessionId,
    } = opts;
    const { enable_rtc_stats: enableTracing } = statsOptions;
    if (closePreviousInstances && this.subscriber) {
      this.subscriber.dispose();
    }
    this.subscriber = new Subscriber({
      sfuClient,
      dispatcher: this.dispatcher,
      state: this.state,
      connectionConfig,
      tag: sfuClient.tag,
      enableTracing,
      onReconnectionNeeded: (kind, reason) => {
        this.reconnect(kind, reason).catch((err) => {
          const message = `[Reconnect] Error reconnecting after a subscriber error: ${reason}`;
          this.logger.warn(message, err);
        });
      },
    });

    // anonymous users can't publish anything hence, there is no need
    // to create Publisher Peer Connection for them
    const isAnonymous = this.streamClient.user?.type === 'anonymous';
    if (!isAnonymous) {
      if (closePreviousInstances && this.publisher) {
        this.publisher.dispose();
      }
      this.publisher = new Publisher({
        sfuClient,
        dispatcher: this.dispatcher,
        state: this.state,
        connectionConfig,
        publishOptions,
        tag: sfuClient.tag,
        enableTracing,
        onReconnectionNeeded: (kind, reason) => {
          this.reconnect(kind, reason).catch((err) => {
            const message = `[Reconnect] Error reconnecting after a publisher error: ${reason}`;
            this.logger.warn(message, err);
          });
        },
      });
    }

    this.statsReporter?.stop();
    if (this.statsReportingIntervalInMs > 0) {
      this.statsReporter = createStatsReporter({
        subscriber: this.subscriber,
        publisher: this.publisher,
        state: this.state,
        datacenter: sfuClient.edgeName,
        pollingIntervalInMs: this.statsReportingIntervalInMs,
      });
    }

    this.tracer.setEnabled(enableTracing);
    this.sfuStatsReporter?.flush();
    this.sfuStatsReporter?.stop();
    if (statsOptions?.reporting_interval_ms > 0) {
      this.sfuStatsReporter = new SfuStatsReporter(sfuClient, {
        clientDetails,
        options: statsOptions,
        subscriber: this.subscriber,
        publisher: this.publisher,
        microphone: this.microphone,
        camera: this.camera,
        state: this.state,
        tracer: this.tracer,
        unifiedSessionId,
      });
      this.sfuStatsReporter.start();
    }
  };

  /**
   * Retrieves credentials for joining the call.
   *
   * @internal
   *
   * @param data the join call data.
   */
  doJoinRequest = async (data?: JoinCallData): Promise<JoinCallResponse> => {
    const location = await this.streamClient.getLocationHint();
    const request: JoinCallRequest = { ...data, location };
    const joinResponse = await this.streamClient.post<
      JoinCallResponse,
      JoinCallRequest
    >(`${this.streamClientBasePath}/join`, request);
    this.state.updateFromCallResponse(joinResponse.call);
    this.state.setMembers(joinResponse.members);
    this.state.setOwnCapabilities(joinResponse.own_capabilities);

    if (data?.ring) {
      this.ringingSubject.next(true);
    }

    const isReconnecting =
      this.reconnectStrategy !== WebsocketReconnectStrategy.UNSPECIFIED;

    if (!isReconnecting && this.ringing && !this.isCreatedByMe) {
      // signals other users that I have accepted the incoming call.
      await this.accept();
    }

    if (this.streamClient._hasConnectionID()) {
      this.watching = true;
      this.clientStore.registerCall(this);
    }

    return joinResponse;
  };

  /**
   * Handles the closing of the SFU signal connection.
   *
   * @internal
   * @param sfuClient the SFU client instance that was closed.
   * @param reason the reason for the closure.
   */
  private handleSfuSignalClose = (
    sfuClient: StreamSfuClient,
    reason: string,
  ) => {
    this.logger.debug('[Reconnect] SFU signal connection closed');
    const { callingState } = this.state;
    if (
      // SFU WS closed before we finished current join,
      // no need to schedule reconnecting
      callingState === CallingState.JOINING ||
      // we are already in the process of reconnecting,
      // no need to schedule another one
      callingState === CallingState.RECONNECTING ||
      // SFU WS closed as a result of unsuccessful join,
      // and no further retries need to be made
      callingState === CallingState.IDLE ||
      callingState === CallingState.LEFT
    )
      return;
    // normal close, no need to reconnect
    if (sfuClient.isLeaving || sfuClient.isClosingClean) return;

    const strategy =
      this.publisher?.isHealthy() && this.subscriber?.isHealthy()
        ? WebsocketReconnectStrategy.FAST
        : WebsocketReconnectStrategy.REJOIN;
    this.reconnect(strategy, reason).catch((err) => {
      this.logger.warn('[Reconnect] Error reconnecting', err);
    });
  };

  /**
   * Handles the reconnection flow.
   *
   * @internal
   *
   * @param strategy the reconnection strategy to use.
   * @param reason the reason for the reconnection.
   */
  private reconnect = async (
    strategy: WebsocketReconnectStrategy,
    reason: string,
  ): Promise<void> => {
    if (
      this.state.callingState === CallingState.RECONNECTING ||
      this.state.callingState === CallingState.MIGRATING ||
      this.state.callingState === CallingState.RECONNECTING_FAILED
    )
      return;

    return withoutConcurrency(this.reconnectConcurrencyTag, async () => {
      const reconnectStartTime = Date.now();
      this.reconnectStrategy = strategy;
      this.reconnectReason = reason;

      const markAsReconnectingFailed = async () => {
        try {
          // attempt to fetch the call data from the server, as the call
          // state might have changed while we were reconnecting or were offline
          await this.get();
        } finally {
          this.state.setCallingState(CallingState.RECONNECTING_FAILED);
        }
      };

      let attempt = 0;
      do {
        const reconnectingTime = Date.now() - reconnectStartTime;
        const shouldGiveUpReconnecting =
          this.disconnectionTimeoutSeconds > 0 &&
          reconnectingTime / 1000 > this.disconnectionTimeoutSeconds;

        if (shouldGiveUpReconnecting) {
          this.logger.warn(
            '[Reconnect] Stopping reconnection attempts after reaching disconnection timeout',
          );
          await markAsReconnectingFailed();
          return;
        }

        // we don't increment reconnect attempts for the FAST strategy.
        if (this.reconnectStrategy !== WebsocketReconnectStrategy.FAST) {
          this.reconnectAttempts++;
        }
        const currentStrategy =
          WebsocketReconnectStrategy[this.reconnectStrategy];
        try {
          // wait until the network is available
          await this.networkAvailableTask?.promise;

          this.logger.info(
            `[Reconnect] Reconnecting with strategy ${WebsocketReconnectStrategy[this.reconnectStrategy]}`,
          );

          switch (this.reconnectStrategy) {
            case WebsocketReconnectStrategy.UNSPECIFIED:
            case WebsocketReconnectStrategy.DISCONNECT:
              this.logger.debug(
                `[Reconnect] No-op strategy ${currentStrategy}`,
              );
              break;
            case WebsocketReconnectStrategy.FAST:
              await this.reconnectFast();
              break;
            case WebsocketReconnectStrategy.REJOIN:
              await this.reconnectRejoin();
              break;
            case WebsocketReconnectStrategy.MIGRATE:
              await this.reconnectMigrate();
              break;
            default:
              ensureExhausted(
                this.reconnectStrategy,
                'Unknown reconnection strategy',
              );
              break;
          }
          break; // do-while loop, reconnection worked, exit the loop
        } catch (error) {
          if (this.state.callingState === CallingState.OFFLINE) {
            this.logger.debug(
              `[Reconnect] Can't reconnect while offline, stopping reconnection attempts`,
            );
            break;
            // we don't need to handle the error if the call is offline
            // network change event will trigger the reconnection
          }
          if (error instanceof ErrorFromResponse && error.unrecoverable) {
            this.logger.warn(
              `[Reconnect] Can't reconnect due to coordinator unrecoverable error`,
              error,
            );
            await markAsReconnectingFailed();
            return;
          }

          await sleep(500);

          const wasMigrating =
            this.reconnectStrategy === WebsocketReconnectStrategy.MIGRATE;
          const mustPerformRejoin =
            (Date.now() - reconnectStartTime) / 1000 >
            this.fastReconnectDeadlineSeconds;

          // don't immediately switch to the REJOIN strategy, but instead attempt
          // to reconnect with the FAST strategy for a few times before switching.
          // in some cases, we immediately switch to the REJOIN strategy.
          const shouldRejoin =
            mustPerformRejoin || // if we are past the fast reconnect deadline
            wasMigrating || // if we were migrating, but the migration failed
            attempt >= 3 || // after 3 failed attempts
            !(this.publisher?.isHealthy() ?? true) || // if the publisher is not healthy
            !(this.subscriber?.isHealthy() ?? true); // if the subscriber is not healthy

          attempt++;

          const nextStrategy = shouldRejoin
            ? WebsocketReconnectStrategy.REJOIN
            : WebsocketReconnectStrategy.FAST;
          this.reconnectStrategy = nextStrategy;

          this.logger.info(
            `[Reconnect] ${currentStrategy} (${this.reconnectAttempts}) failed. Attempting with ${WebsocketReconnectStrategy[nextStrategy]}`,
            error,
          );
        }
      } while (
        this.state.callingState !== CallingState.JOINED &&
        this.state.callingState !== CallingState.RECONNECTING_FAILED &&
        this.state.callingState !== CallingState.LEFT
      );
      this.logger.info('[Reconnect] Reconnection flow finished');
    });
  };

  /**
   * Initiates the reconnection flow with the "fast" strategy.
   * @internal
   */
  private reconnectFast = async () => {
    const reconnectStartTime = Date.now();
    this.reconnectStrategy = WebsocketReconnectStrategy.FAST;
    this.state.setCallingState(CallingState.RECONNECTING);
    await this.doJoin(this.joinCallData);
    await this.get(); // fetch the latest call state, as it might have changed
    this.sfuStatsReporter?.sendReconnectionTime(
      WebsocketReconnectStrategy.FAST,
      (Date.now() - reconnectStartTime) / 1000,
    );
  };

  /**
   * Initiates the reconnection flow with the "rejoin" strategy.
   * @internal
   */
  private reconnectRejoin = async () => {
    const reconnectStartTime = Date.now();
    this.reconnectStrategy = WebsocketReconnectStrategy.REJOIN;
    this.state.setCallingState(CallingState.RECONNECTING);
    await this.doJoin(this.joinCallData);
    await this.restorePublishedTracks();
    this.restoreSubscribedTracks();
    this.sfuStatsReporter?.sendReconnectionTime(
      WebsocketReconnectStrategy.REJOIN,
      (Date.now() - reconnectStartTime) / 1000,
    );
  };

  /**
   * Initiates the reconnection flow with the "migrate" strategy.
   * @internal
   */
  private reconnectMigrate = async () => {
    const reconnectStartTime = Date.now();
    const currentSfuClient = this.sfuClient;
    if (!currentSfuClient) {
      throw new Error('Cannot migrate without an active SFU client');
    }

    this.reconnectStrategy = WebsocketReconnectStrategy.MIGRATE;
    this.state.setCallingState(CallingState.MIGRATING);
    const currentSubscriber = this.subscriber;
    const currentPublisher = this.publisher;

    currentSubscriber?.detachEventHandlers();
    currentPublisher?.detachEventHandlers();

    const migrationTask = makeSafePromise(currentSfuClient.enterMigration());

    try {
      const currentSfu = currentSfuClient.edgeName;
      await this.doJoin({ ...this.joinCallData, migrating_from: currentSfu });
    } finally {
      // cleanup the migration_from field after the migration is complete or failed
      // as we don't want to keep dirty data in the join call data
      delete this.joinCallData?.migrating_from;
    }

    await this.restorePublishedTracks();
    this.restoreSubscribedTracks();

    try {
      // Wait for the migration to complete, then close the previous SFU client
      // and the peer connection instances. In case of failure, the migration
      // task would throw an error and REJOIN would be attempted.
      await migrationTask();

      // in MIGRATE, we can consider the call as joined only after
      // `participantMigrationComplete` event is received, signaled by
      // the `migrationTask`
      this.state.setCallingState(CallingState.JOINED);
    } finally {
      currentSubscriber?.dispose();
      currentPublisher?.dispose();

      // and close the previous SFU client, without specifying close code
      currentSfuClient.close(StreamSfuClient.NORMAL_CLOSURE, 'Migrating away');
    }
    this.sfuStatsReporter?.sendReconnectionTime(
      WebsocketReconnectStrategy.MIGRATE,
      (Date.now() - reconnectStartTime) / 1000,
    );
  };

  /**
   * Registers the various event handlers for reconnection.
   *
   * @internal
   */
  private registerReconnectHandlers = () => {
    // handles the legacy "goAway" event
    const unregisterGoAway = this.on('goAway', () => {
      this.reconnect(WebsocketReconnectStrategy.MIGRATE, 'goAway').catch(
        (err) => this.logger.warn('[Reconnect] Error reconnecting', err),
      );
    });

    // handles the "error" event, through which the SFU can request a reconnect
    const unregisterOnError = this.on('error', (e) => {
      const { reconnectStrategy: strategy, error } = e;
      if (strategy === WebsocketReconnectStrategy.UNSPECIFIED) return;
      if (strategy === WebsocketReconnectStrategy.DISCONNECT) {
        this.leave({ message: 'SFU instructed to disconnect' }).catch((err) => {
          this.logger.warn(`Can't leave call after disconnect request`, err);
        });
      } else {
        this.reconnect(strategy, error?.message || 'SFU Error').catch((err) => {
          this.logger.warn('[Reconnect] Error reconnecting', err);
        });
      }
    });

    const unregisterNetworkChanged = this.streamClient.on(
      'network.changed',
      (e) => {
        this.tracer.trace('network.changed', e);
        if (!e.online) {
          this.logger.debug('[Reconnect] Going offline');
          if (!this.hasJoinedOnce) return;
          this.lastOfflineTimestamp = Date.now();
          // create a new task that would resolve when the network is available
          const networkAvailableTask = promiseWithResolvers();
          networkAvailableTask.promise.then(() => {
            let strategy = WebsocketReconnectStrategy.FAST;
            if (this.lastOfflineTimestamp) {
              const offline = (Date.now() - this.lastOfflineTimestamp) / 1000;
              if (offline > this.fastReconnectDeadlineSeconds) {
                // We shouldn't attempt FAST if we have exceeded the deadline.
                // The SFU would have already wiped out the session.
                strategy = WebsocketReconnectStrategy.REJOIN;
              }
            }

            this.reconnect(strategy, 'Going online').catch((err) => {
              this.logger.warn(
                '[Reconnect] Error reconnecting after going online',
                err,
              );
            });
          });
          this.networkAvailableTask = networkAvailableTask;
          this.sfuStatsReporter?.stop();
          this.state.setCallingState(CallingState.OFFLINE);
        } else {
          this.logger.debug('[Reconnect] Going online');
          this.sfuClient?.close(
            StreamSfuClient.DISPOSE_OLD_SOCKET,
            'Closing WS to reconnect after going online',
          );
          // we went online, release the previous waiters and reset the state
          this.networkAvailableTask?.resolve();
          this.networkAvailableTask = undefined;
          this.sfuStatsReporter?.start();
        }
      },
    );

    this.leaveCallHooks
      .add(unregisterGoAway)
      .add(unregisterOnError)
      .add(unregisterNetworkChanged);
  };

  /**
   * Restores the published tracks after a reconnection.
   * @internal
   */
  private restorePublishedTracks = async () => {
    // the tracks need to be restored in their original order of publishing
    // otherwise, we might get `m-lines order mismatch` errors
    for (const trackType of this.trackPublishOrder) {
      let mediaStream: MediaStream | undefined;
      switch (trackType) {
        case TrackType.AUDIO:
          mediaStream = this.microphone.state.mediaStream;
          break;
        case TrackType.VIDEO:
          mediaStream = this.camera.state.mediaStream;
          break;
        case TrackType.SCREEN_SHARE:
          mediaStream = this.screenShare.state.mediaStream;
          break;
        // screen share audio can't exist without a screen share, so we handle it there
        case TrackType.SCREEN_SHARE_AUDIO:
        case TrackType.UNSPECIFIED:
          break;
        default:
          ensureExhausted(trackType, 'Unknown track type');
          break;
      }

      if (mediaStream) await this.publish(mediaStream, trackType);
    }
  };

  /**
   * Restores the subscribed tracks after a reconnection.
   * @internal
   */
  private restoreSubscribedTracks = () => {
    const { remoteParticipants } = this.state;
    if (remoteParticipants.length <= 0) return;
    this.dynascaleManager.applyTrackSubscriptions(undefined);
  };

  /**
   * Starts publishing the given video stream to the call.
   * @deprecated use `call.publish()`.
   */
  publishVideoStream = async (videoStream: MediaStream) => {
    await this.publish(videoStream, TrackType.VIDEO);
  };

  /**
   * Starts publishing the given audio stream to the call.
   * @deprecated use `call.publish()`
   */
  publishAudioStream = async (audioStream: MediaStream) => {
    await this.publish(audioStream, TrackType.AUDIO);
  };

  /**
   * Starts publishing the given screen-share stream to the call.
   * @deprecated use `call.publish()`
   */
  publishScreenShareStream = async (screenShareStream: MediaStream) => {
    await this.publish(screenShareStream, TrackType.SCREEN_SHARE);
  };

  /**
   * Publishes the given media stream.
   *
   * @param mediaStream the media stream to publish.
   * @param trackType the type of the track to announce.
   * @param options the publish options.
   */
  publish = async (
    mediaStream: MediaStream,
    trackType: TrackType,
    options?: TrackPublishOptions,
  ) => {
    if (!this.sfuClient) throw new Error(`Call is not joined yet`);
    // joining is in progress, and we should wait until the client is ready
    await this.sfuClient.joinTask;

    if (!this.permissionsContext.canPublish(trackType)) {
      throw new Error(`No permission to publish ${TrackType[trackType]}`);
    }

    if (!this.publisher) throw new Error('Publisher is not initialized');

    const [track] = isAudioTrackType(trackType)
      ? mediaStream.getAudioTracks()
      : mediaStream.getVideoTracks();

    if (!track) {
      throw new Error(
        `There is no ${TrackType[trackType]} track in the stream`,
      );
    }

    if (track.readyState === 'ended') {
      throw new Error(`Can't publish ended tracks.`);
    }

    pushToIfMissing(this.trackPublishOrder, trackType);
    await this.publisher.publish(track, trackType, options);

    const trackTypes = [trackType];
    if (trackType === TrackType.SCREEN_SHARE) {
      const [audioTrack] = mediaStream.getAudioTracks();
      if (audioTrack) {
        const screenShareAudio = TrackType.SCREEN_SHARE_AUDIO;
        pushToIfMissing(this.trackPublishOrder, screenShareAudio);
        await this.publisher.publish(audioTrack, screenShareAudio, options);
        trackTypes.push(screenShareAudio);
      }
    }

    if (track.kind === 'video') {
      // schedules calibration report - the SFU will use the performance stats
      // to adjust the quality thresholds as early as possible
      this.sfuStatsReporter?.scheduleOne(3000);
    }

    await this.updateLocalStreamState(mediaStream, ...trackTypes);
  };

  /**
   * Stops publishing the given track type to the call, if it is currently being published.
   *
   * @param trackTypes the track types to stop publishing.
   */
  stopPublish = async (...trackTypes: TrackType[]) => {
    if (!this.sfuClient || !this.publisher) return;
    this.publisher.stopTracks(...trackTypes);
    await this.updateLocalStreamState(undefined, ...trackTypes);
  };

  /**
   * Updates the call state with the new stream.
   *
   * @param mediaStream the new stream to update the call state with.
   * If undefined, the stream will be removed from the call state.
   * @param trackTypes the track types to update the call state with.
   */
  private updateLocalStreamState = async (
    mediaStream: MediaStream | undefined,
    ...trackTypes: TrackType[]
  ) => {
    if (!this.sfuClient || !this.sfuClient.sessionId) return;
    await this.notifyTrackMuteState(!mediaStream, ...trackTypes);

    const { sessionId } = this.sfuClient;
    for (const trackType of trackTypes) {
      const streamStateProp = trackTypeToParticipantStreamKey(trackType);
      if (!streamStateProp) continue;

      this.state.updateParticipant(sessionId, (p) => ({
        publishedTracks: mediaStream
          ? pushToIfMissing([...p.publishedTracks], trackType)
          : p.publishedTracks.filter((t) => t !== trackType),
        [streamStateProp]: mediaStream,
      }));
    }
  };

  /**
   * Updates the preferred publishing options
   *
   * @internal
   * @param options the options to use.
   */
  updatePublishOptions = (options: ClientPublishOptions) => {
    this.logger.warn(
      '[call.updatePublishOptions]: You are manually overriding the publish options for this call. ' +
        'This is not recommended, and it can cause call stability/compatibility issues. Use with caution.',
    );
    if (this.state.callingState === CallingState.JOINED) {
      this.logger.warn(
        'Updating publish options after joining the call does not have an effect',
      );
    }
    this.clientPublishOptions = { ...this.clientPublishOptions, ...options };
  };

  /**
   * Notifies the SFU that a noise cancellation process has started.
   *
   * @internal
   */
  notifyNoiseCancellationStarting = async () => {
    return this.sfuClient?.startNoiseCancellation().catch((err) => {
      this.logger.warn('Failed to notify start of noise cancellation', err);
    });
  };

  /**
   * Notifies the SFU that a noise cancellation process has stopped.
   *
   * @internal
   */
  notifyNoiseCancellationStopped = async () => {
    return this.sfuClient?.stopNoiseCancellation().catch((err) => {
      this.logger.warn('Failed to notify stop of noise cancellation', err);
    });
  };

  /**
   * Notifies the SFU about the mute state of the given track types.
   * @internal
   */
  notifyTrackMuteState = async (muted: boolean, ...trackTypes: TrackType[]) => {
    const key = `muteState.${this.cid}.${trackTypes.join('-')}`;
    await withoutConcurrency(key, async () => {
      if (!this.sfuClient) return;
      await this.sfuClient.updateMuteStates(
        trackTypes.map((trackType) => ({ trackType, muted })),
      );
    });
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
   * Sets the frequency of the call stats reporting.
   *
   * @param intervalInMs the interval in milliseconds to report the stats.
   */
  setStatsReportingIntervalInMs = (intervalInMs: number) => {
    this.statsReportingIntervalInMs = intervalInMs;
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
   * Kicks the user with the given `userId`.
   * @param data the kick request.
   */
  kickUser = async (data: KickUserRequest): Promise<KickUserResponse> => {
    return this.streamClient.post<KickUserResponse, KickUserRequest>(
      `${this.streamClientBasePath}/kick`,
      data,
    );
  };

  /**
   * Mutes the current user.
   *
   * @param type the type of the mute operation.
   */
  muteSelf = (type: TrackMuteType) => {
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
  muteOthers = (type: TrackMuteType) => {
    const trackType = muteTypeToTrackType(type);
    if (!trackType) return;
    const userIdsToMute: string[] = [];
    for (const participant of this.state.remoteParticipants) {
      if (participant.publishedTracks.includes(trackType)) {
        userIdsToMute.push(participant.userId);
      }
    }

    if (userIdsToMute.length > 0) {
      return this.muteUser(userIdsToMute, type);
    }
  };

  /**
   * Mutes the user with the given `userId`.
   *
   * @param userId the id of the user to mute.
   * @param type the type of the mute operation.
   */
  muteUser = (userId: string | string[], type: TrackMuteType) => {
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
  muteAllUsers = (type: TrackMuteType) => {
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
  startRecording = async (request?: StartRecordingRequest) => {
    return this.streamClient.post<
      StartRecordingResponse,
      StartRecordingRequest
    >(`${this.streamClientBasePath}/start_recording`, request ? request : {});
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
   * Starts the transcription of the call.
   *
   * @param request the request data.
   */
  startTranscription = async (
    request?: StartTranscriptionRequest,
  ): Promise<StartTranscriptionResponse> => {
    return this.streamClient.post<
      StartTranscriptionResponse,
      StartTranscriptionRequest
    >(`${this.streamClientBasePath}/start_transcription`, request);
  };

  /**
   * Stops the transcription of the call.
   */
  stopTranscription = async (): Promise<StopTranscriptionResponse> => {
    return this.streamClient.post<StopTranscriptionResponse>(
      `${this.streamClientBasePath}/stop_transcription`,
    );
  };

  /**
   * Starts the closed captions of the call.
   */
  startClosedCaptions = async (
    options?: StartClosedCaptionsRequest,
  ): Promise<StartClosedCaptionsResponse> => {
    const trx = this.state.setCaptioning(true); // optimistic update
    try {
      return await this.streamClient.post<
        StartClosedCaptionsResponse,
        StartClosedCaptionsRequest
      >(`${this.streamClientBasePath}/start_closed_captions`, options);
    } catch (err) {
      trx.rollback(); // revert the optimistic update
      throw err;
    }
  };

  /**
   * Stops the closed captions of the call.
   */
  stopClosedCaptions = async (
    options?: StopClosedCaptionsRequest,
  ): Promise<StopClosedCaptionsResponse> => {
    const trx = this.state.setCaptioning(false); // optimistic update
    try {
      return await this.streamClient.post<
        StopClosedCaptionsResponse,
        StopClosedCaptionsRequest
      >(`${this.streamClientBasePath}/stop_closed_captions`, options);
    } catch (err) {
      trx.rollback(); // revert the optimistic update
      throw err;
    }
  };

  /**
   * Updates the closed caption settings.
   *
   * @param config the closed caption settings to apply
   */
  updateClosedCaptionSettings = (config: Partial<ClosedCaptionsSettings>) => {
    this.state.updateClosedCaptionSettings(config);
  };

  /**
   * Sends a `call.permission_request` event to all users connected to the call.
   * The call settings object contains information about which permissions can be requested during a call
   * (for example, a user might be allowed to request permission to publish audio, but not video).
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
   * When revoking a permission, this endpoint will also mute the relevant track from the user. This is similar to muting a user with the difference that the user will not be able to unmute afterwards.
   * Supported permissions that can be granted or revoked: `send-audio`, `send-video` and `screenshare`.
   *
   * `call.permissions_updated` event is sent to all members of the call.
   */
  updateUserPermissions = async (data: UpdateUserPermissionsRequest) => {
    return this.streamClient.post<
      UpdateUserPermissionsResponse,
      UpdateUserPermissionsRequest
    >(`${this.streamClientBasePath}/user_permissions`, data);
  };

  /**
   * Starts the livestreaming of the call.
   *
   * @param data the request data.
   * @param params the request params.
   */
  goLive = async (data: GoLiveRequest = {}, params?: { notify?: boolean }) => {
    return this.streamClient.post<GoLiveResponse, GoLiveRequest>(
      `${this.streamClientBasePath}/go_live`,
      data,
      params,
    );
  };

  /**
   * Stops the livestreaming of the call.
   */
  stopLive = async (data: StopLiveRequest = {}) => {
    return this.streamClient.post<StopLiveResponse>(
      `${this.streamClientBasePath}/stop_live`,
      data,
    );
  };

  /**
   * Starts the broadcasting of the call.
   */
  startHLS = async () => {
    return this.streamClient.post<StartHLSBroadcastingResponse>(
      `${this.streamClientBasePath}/start_broadcasting`,
      {},
    );
  };

  /**
   * Stops the broadcasting of the call.
   */
  stopHLS = async () => {
    return this.streamClient.post<StopHLSBroadcastingResponse>(
      `${this.streamClientBasePath}/stop_broadcasting`,
      {},
    );
  };

  /**
   * Starts the RTMP-out broadcasting of the call.
   */
  startRTMPBroadcasts = async (
    data: StartRTMPBroadcastsRequest,
  ): Promise<StartRTMPBroadcastsResponse> => {
    return this.streamClient.post<
      StartRTMPBroadcastsResponse,
      StartRTMPBroadcastsRequest
    >(`${this.streamClientBasePath}/rtmp_broadcasts`, data);
  };

  /**
   * Stops all RTMP-out broadcasting of the call.
   */
  stopAllRTMPBroadcasts = async (): Promise<StopAllRTMPBroadcastsResponse> => {
    return this.streamClient.post<StopAllRTMPBroadcastsResponse>(
      `${this.streamClientBasePath}/rtmp_broadcasts/stop`,
    );
  };

  /**
   * Stops the RTMP-out broadcasting of the call specified by it's name.
   */
  stopRTMPBroadcast = async (
    name: string,
  ): Promise<StopRTMPBroadcastsResponse> => {
    return this.streamClient.post<StopRTMPBroadcastsResponse>(
      `${this.streamClientBasePath}/rtmp_broadcasts/${name}/stop`,
    );
  };

  /**
   * Starts frame by frame recording.
   * Sends call.frame_recording_started events
   */
  startFrameRecording = async (
    data: StartFrameRecordingRequest,
  ): Promise<StartFrameRecordingResponse> => {
    return this.streamClient.post<
      StartFrameRecordingResponse,
      StartFrameRecordingRequest
    >(`${this.streamClientBasePath}/start_frame_recording`, data);
  };

  /**
   * Stops frame recording.
   */
  stopFrameRecording = async (): Promise<StopFrameRecordingResponse> => {
    return this.streamClient.post<StopFrameRecordingResponse>(
      `${this.streamClientBasePath}/stop_frame_recording`,
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
    this.state.updateFromCallResponse(call);
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
   * Pins the given session to the top of the participants list.
   *
   * @param sessionId the sessionId to pin.
   */
  pin = (sessionId: string) => {
    this.state.updateParticipant(sessionId, {
      pin: {
        isLocalPin: true,
        pinnedAt: Date.now(),
      },
    });
  };

  /**
   * Unpins the given session from the top of the participants list.
   *
   * @param sessionId the sessionId to unpin.
   */
  unpin = (sessionId: string) => {
    this.state.updateParticipant(sessionId, {
      pin: undefined,
    });
  };

  /**
   * Pins the given session to the top of the participants list for everyone
   * in the call.
   * You can execute this method only if you have the `pin-for-everyone` capability.
   *
   * @param request the request object.
   */
  pinForEveryone = async (request: PinRequest) => {
    return this.streamClient.post<PinResponse, PinRequest>(
      `${this.streamClientBasePath}/pin`,
      request,
    );
  };

  /**
   * Unpins the given session from the top of the participants list for everyone
   * in the call.
   * You can execute this method only if you have the `pin-for-everyone` capability.
   *
   * @param request the request object.
   */
  unpinForEveryone = async (request: UnpinRequest) => {
    return this.streamClient.post<UnpinResponse, UnpinRequest>(
      `${this.streamClientBasePath}/unpin`,
      request,
    );
  };

  /**
   * Query call members with filter query. The result won't be stored in call state.
   * @param request
   * @returns
   */
  queryMembers = (request?: Omit<QueryCallMembersRequest, 'type' | 'id'>) => {
    return this.streamClient.post<
      QueryCallMembersResponse,
      QueryCallMembersRequest
    >('/call/members', {
      ...(request || {}),
      id: this.id,
      type: this.type,
    });
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

  /**
   * Schedules an auto-drop timeout based on the call settings.
   * Applicable only for ringing calls.
   */
  private scheduleAutoDrop = () => {
    this.cancelAutoDrop();

    const settings = this.state.settings;
    if (!settings) return;
    // ignore if the call is not ringing
    if (this.state.callingState !== CallingState.RINGING) return;

    const timeoutInMs = this.isCreatedByMe
      ? settings.ring.auto_cancel_timeout_ms
      : settings.ring.incoming_call_timeout_ms;

    // 0 means no auto-drop
    if (timeoutInMs <= 0) return;
    this.dropTimeout = setTimeout(() => {
      // the call might have stopped ringing by this point,
      // e.g. it was already accepted and joined
      if (this.state.callingState !== CallingState.RINGING) return;
      this.leave({
        reject: true,
        reason: 'timeout',
        message: `ringing timeout - ${this.isCreatedByMe ? 'no one accepted' : `user didn't interact with incoming call screen`}`,
      }).catch((err) => {
        this.logger.error('Failed to drop call', err);
      });
    }, timeoutInMs);
  };

  /**
   * Cancels a scheduled auto-drop timeout.
   */
  private cancelAutoDrop = () => {
    clearTimeout(this.dropTimeout);
    this.dropTimeout = undefined;
  };

  /**
   * Retrieves the list of recordings for the current call or call session.
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
    return this.streamClient.get<ListRecordingsResponse>(
      `${endpoint}/recordings`,
    );
  };

  /**
   * Retrieves the list of transcriptions for the current call.
   *
   * @returns the list of transcriptions.
   */
  queryTranscriptions = async (): Promise<ListTranscriptionsResponse> => {
    return this.streamClient.get<ListTranscriptionsResponse>(
      `${this.streamClientBasePath}/transcriptions`,
    );
  };

  /**
   * Retrieve call statistics for a particular call session (historical).
   * Here `callSessionID` is mandatory.
   *
   * @param callSessionID the call session ID to retrieve statistics for.
   * @returns The call stats.
   * @deprecated use `call.getCallReport` instead.
   * @internal
   */
  getCallStats = async (callSessionID: string) => {
    const endpoint = `${this.streamClientBasePath}/stats/${callSessionID}`;
    return this.streamClient.get<GetCallStatsResponse>(endpoint);
  };

  /**
   * Retrieve call report. If the `callSessionID` is not specified, then the
   * report for the latest call session is retrieved. If it is specified, then
   * the report for that particular session is retrieved if it exists.
   *
   * @param callSessionID the optional call session ID to retrieve statistics for
   * @returns the call report
   */
  getCallReport = async (callSessionID: string = '') => {
    const endpoint = `${this.streamClientBasePath}/report`;
    const params = callSessionID !== '' ? { session_id: callSessionID } : {};
    return this.streamClient.get<GetCallReportResponse>(endpoint, params);
  };

  /**
   * Loads the call participant stats for the given parameters.
   */
  getCallParticipantsStats = async (opts: {
    sessionId?: string;
    userId?: string;
    userSessionId?: string;
    kind?: 'timeline' | 'details';
  }): Promise<
    | QueryCallSessionParticipantStatsResponse
    | GetCallSessionParticipantStatsDetailsResponse
    | QueryCallSessionParticipantStatsTimelineResponse
    | undefined
  > => {
    const {
      sessionId = this.state.session?.id,
      userId = this.currentUserId,
      userSessionId = this.unifiedSessionId,
      kind = 'details',
    } = opts;
    if (!sessionId) return;
    const base = `${this.streamClient.baseURL}/call_stats/${this.type}/${this.id}/${sessionId}`;
    if (!userId || !userSessionId) {
      return this.streamClient.get<QueryCallSessionParticipantStatsResponse>(
        `${base}/participants`,
      );
    }
    if (kind === 'details') {
      return this.streamClient.get<GetCallSessionParticipantStatsDetailsResponse>(
        `${base}/participant/${userId}/${userSessionId}/details`,
      );
    }
    return this.streamClient.get<QueryCallSessionParticipantStatsTimelineResponse>(
      `${base}/participants/${userId}/${userSessionId}/timeline`,
    );
  };

  /**
   * Submit user feedback for the call
   *
   * @param rating Rating between 1 and 5 denoting the experience of the user in the call
   * @param reason The reason/description for the rating
   * @param custom Custom data
   */
  submitFeedback = async (
    rating: number,
    {
      reason,
      custom,
    }: Pick<CollectUserFeedbackRequest, 'reason' | 'custom'> = {},
  ): Promise<CollectUserFeedbackResponse> => {
    const { sdkName, sdkVersion, ...platform } = getSdkSignature(
      await getClientDetails(),
    );
    return this.streamClient.post<
      CollectUserFeedbackResponse,
      CollectUserFeedbackRequest
    >(`${this.streamClientBasePath}/feedback`, {
      rating,
      reason,
      user_session_id: this.sfuClient?.sessionId,
      sdk: sdkName,
      sdk_version: sdkVersion,
      custom: {
        ...custom,
        'x-stream-platform-data': platform,
      },
    });
  };

  /**
   * Sends a custom event to all call participants.
   *
   * @param payload the payload to send.
   */
  sendCustomEvent = async (payload: { [key: string]: any }) => {
    return this.streamClient.post<SendCallEventResponse, SendCallEventRequest>(
      `${this.streamClientBasePath}/event`,
      { custom: payload },
    );
  };

  /**
   * Applies the device configuration from the backend.
   *
   * @internal
   */
  applyDeviceConfig = async (
    settings: CallSettingsResponse,
    publish: boolean,
  ) => {
    await this.camera.apply(settings.video, publish).catch((err) => {
      this.logger.warn('Camera init failed', err);
    });
    await this.microphone.apply(settings.audio, publish).catch((err) => {
      this.logger.warn('Mic init failed', err);
    });
  };

  /**
   * Will begin tracking the given element for visibility changes within the
   * configured viewport element (`call.setViewport`).
   *
   * @param element the element to track.
   * @param sessionId the session id.
   * @param trackType the video mode.
   */
  trackElementVisibility = <T extends HTMLElement>(
    element: T,
    sessionId: string,
    trackType: VideoTrackType,
  ) => {
    return this.dynascaleManager.trackElementVisibility(
      element,
      sessionId,
      trackType,
    );
  };

  /**
   * Sets the viewport element to track bound video elements for visibility.
   *
   * @param element the viewport element.
   */
  setViewport = <T extends HTMLElement>(element: T) => {
    return this.dynascaleManager.setViewport(element);
  };

  /**
   * Binds a DOM <video> element to the given session id.
   * This method will make sure that the video element will play
   * the correct video stream for the given session id.
   *
   * Under the hood, it would also keep track of the video element dimensions
   * and update the subscription accordingly in order to optimize the bandwidth.
   *
   * If a "viewport" is configured, the video element will be automatically
   * tracked for visibility and the subscription will be updated accordingly.
   *
   * @param videoElement the video element to bind to.
   * @param sessionId the session id.
   * @param trackType the kind of video.
   */
  bindVideoElement = (
    videoElement: HTMLVideoElement,
    sessionId: string,
    trackType: VideoTrackType,
  ) => {
    const unbind = this.dynascaleManager.bindVideoElement(
      videoElement,
      sessionId,
      trackType,
    );

    if (!unbind) return;
    this.leaveCallHooks.add(unbind);
    return () => {
      this.leaveCallHooks.delete(unbind);
      unbind();
    };
  };

  /**
   * Binds a DOM <audio> element to the given session id.
   *
   * This method will make sure that the audio element will
   * play the correct audio stream for the given session id.
   *
   * @param audioElement the audio element to bind to.
   * @param sessionId the session id.
   * @param trackType the kind of audio.
   */
  bindAudioElement = (
    audioElement: HTMLAudioElement,
    sessionId: string,
    trackType: AudioTrackType = 'audioTrack',
  ) => {
    const unbind = this.dynascaleManager.bindAudioElement(
      audioElement,
      sessionId,
      trackType,
    );

    if (!unbind) return;
    this.leaveCallHooks.add(unbind);
    return () => {
      this.leaveCallHooks.delete(unbind);
      unbind();
    };
  };

  /**
   * Binds a DOM <img> element to this call's thumbnail (if enabled in settings).
   *
   * @param imageElement the image element to bind to.
   * @param opts options for the binding.
   */
  bindCallThumbnailElement = (
    imageElement: HTMLImageElement,
    opts: {
      fallbackImageSource?: string;
    } = {},
  ) => {
    const handleError = () => {
      imageElement.src =
        opts.fallbackImageSource ||
        'https://getstream.io/random_svg/?name=x&id=x';
    };

    const unsubscribe = createSubscription(
      this.state.thumbnails$,
      (thumbnails) => {
        if (!thumbnails) return;
        imageElement.addEventListener('error', handleError);

        const thumbnailUrl = new URL(thumbnails.image_url);
        thumbnailUrl.searchParams.set('w', String(imageElement.clientWidth));
        thumbnailUrl.searchParams.set('h', String(imageElement.clientHeight));

        imageElement.src = thumbnailUrl.toString();
      },
    );

    return () => {
      unsubscribe();
      imageElement.removeEventListener('error', handleError);
    };
  };

  /**
   * Specify preference for incoming video resolution. The preference will
   * be matched as close as possible, but actual resolution will depend
   * on the video source quality and client network conditions. Will enable
   * incoming video, if previously disabled.
   *
   * @param resolution preferred resolution, or `undefined` to clear preference
   * @param sessionIds optionally specify session ids of the participants this
   * preference has effect on. Affects all participants by default.
   */
  setPreferredIncomingVideoResolution = (
    resolution: VideoDimension | undefined,
    sessionIds?: string[],
  ) => {
    this.dynascaleManager.setVideoTrackSubscriptionOverrides(
      resolution
        ? {
            enabled: true,
            dimension: resolution,
          }
        : undefined,
      sessionIds,
    );
    this.dynascaleManager.applyTrackSubscriptions();
  };

  /**
   * Enables or disables incoming video from all remote call participants,
   * and removes any preference for preferred resolution.
   */
  setIncomingVideoEnabled = (enabled: boolean) => {
    this.dynascaleManager.setVideoTrackSubscriptionOverrides(
      enabled ? undefined : { enabled: false },
    );
    this.dynascaleManager.applyTrackSubscriptions();
  };

  /**
   * Sets the maximum amount of time a user can remain waiting for a reconnect
   * after a network disruption
   * @param timeoutSeconds Timeout in seconds, or 0 to keep reconnecting indefinetely
   */
  setDisconnectionTimeout = (timeoutSeconds: number) => {
    this.disconnectionTimeoutSeconds = timeoutSeconds;
  };

  /**
   * Enables the provided client capabilities.
   */
  enableClientCapabilities = (...capabilities: ClientCapability[]) => {
    for (const capability of capabilities) {
      this.clientCapabilities.add(capability);
    }
  };

  /**
   * Disables the provided client capabilities.
   */
  disableClientCapabilities = (...capabilities: ClientCapability[]) => {
    for (const capability of capabilities) {
      this.clientCapabilities.delete(capability);
    }
  };
}
