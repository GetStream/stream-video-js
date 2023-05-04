import { StreamSfuClient } from './StreamSfuClient';
import {
  createSubscriber,
  Dispatcher,
  getGenericSdp,
  isSfuEvent,
  Publisher,
  SfuEventKinds,
  SfuEventListener,
} from './rtc';
import { muteTypeToTrackType } from './rtc/helpers/tracks';
import { ClientDetails, TrackType } from './gen/video/sfu/models/models';
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
  BlockUserRequest,
  BlockUserResponse,
  EndCallResponse,
  GetCallEdgeServerRequest,
  GetCallEdgeServerResponse,
  GetCallResponse,
  GetOrCreateCallRequest,
  GetOrCreateCallResponse,
  GoLiveResponse,
  JoinCallRequest,
  ListRecordingsResponse,
  MuteUsersRequest,
  MuteUsersResponse,
  OwnCapability,
  RequestPermissionRequest,
  RequestPermissionResponse,
  SendEventRequest,
  SendEventResponse,
  SendReactionRequest,
  SendReactionResponse,
  StopLiveResponse,
  UnblockUserRequest,
  UnblockUserResponse,
  UpdateCallMembersRequest,
  UpdateCallMembersResponse,
  UpdateCallRequest,
  UpdateCallResponse,
  UpdateUserPermissionsRequest,
  UpdateUserPermissionsResponse,
} from './gen/coordinator';
import { join, watch } from './rtc/flows/join';
import {
  CallConstructor,
  CallLeaveOptions,
  DebounceType,
  PublishOptions,
  StreamVideoParticipant,
  StreamVideoParticipantPatches,
  SubscriptionChanges,
  VisibilityState,
} from './types';
import {
  BehaviorSubject,
  debounce,
  map,
  of,
  pairwise,
  Subject,
  takeWhile,
  tap,
  timer,
} from 'rxjs';
import { TrackSubscriptionDetails } from './gen/video/sfu/signal_rpc/signal';
import { JoinResponse } from './gen/video/sfu/event/events';
import {
  createStatsReporter,
  StatsReporter,
} from './stats/state-store-stats-reporter';
import { ViewportTracker } from './helpers/ViewportTracker';
import { PermissionsContext } from './permissions';
import { CallTypes } from './CallType';
import { StreamClient } from './coordinator/connection/client';
import { retryInterval, sleep } from './coordinator/connection/utils';
import {
  CallEventHandler,
  CallEventTypes,
  EventHandler,
  StreamCallEvent,
} from './coordinator/connection/types';
import { UAParser } from 'ua-parser-js';
import { getSdkInfo } from './sdk-info';
import { isReactNative } from './helpers/platforms';

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
   * The permissions context of this call.
   */
  readonly permissionsContext = new PermissionsContext();

  /**
   * Flag telling whether this call is a "ringing" call.
   */
  private readonly ringingSubject: Subject<boolean>;

  /**
   * The event dispatcher instance dedicated to this Call instance.
   * @private
   */
  private readonly dispatcher = new Dispatcher();

  private subscriber?: RTCPeerConnection;
  private publisher?: Publisher;
  private trackSubscriptionsSubject = new Subject<{
    type?: DebounceType;
    data: TrackSubscriptionDetails[];
  }>();

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

  private get preferredAudioCodec() {
    const audioSettings = this.data?.settings.audio;
    let preferredCodec =
      audioSettings?.redundant_coding_enabled === undefined
        ? 'opus'
        : audioSettings.redundant_coding_enabled
        ? 'red'
        : 'opus';
    if (
      typeof window !== 'undefined' &&
      window.location &&
      window.location.search
    ) {
      const queryParams = new URLSearchParams(window.location.search);
      preferredCodec = queryParams.get('codec') || preferredCodec;
    }

    return preferredCodec;
  }

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

    const callTypeConfig = CallTypes.get(type);
    const participantSorter =
      sortParticipantsBy || callTypeConfig.options.sortParticipantsBy;
    if (participantSorter) {
      this.state.setSortParticipantsBy(participantSorter);
    }

    this.state.setMetadata(metadata);
    this.state.setMembers(members || []);
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
          debounce((v) => (!v.type ? of(null) : timer(v.type))),
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
        this.permissionsContext.setPermissions(metadata.own_capabilities);
        this.permissionsContext.setCallSettings(metadata.settings);
      }),

      // handles the case when the user is blocked by the call owner.
      createSubscription(this.state.metadata$, async (metadata) => {
        if (!metadata) return;
        const currentUserId = this.currentUserId;
        if (
          currentUserId &&
          metadata.blocked_user_ids.includes(currentUserId)
        ) {
          await this.leave();
        }
      }),

      // handle the case when the user permissions are revoked.
      createSubscription(this.state.metadata$, (metadata) => {
        if (!metadata) return;
        const permissionToTrackType = {
          [OwnCapability.SEND_AUDIO]: TrackType.AUDIO,
          [OwnCapability.SEND_VIDEO]: TrackType.VIDEO,
          [OwnCapability.SCREENSHARE]: TrackType.SCREEN_SHARE,
        };
        Object.entries(permissionToTrackType).forEach(([permission, type]) => {
          const hasPermission = this.permissionsContext.hasPermission(
            permission as OwnCapability,
          );
          if (!hasPermission) {
            this.stopPublish(type).catch((err) => {
              console.error('Error stopping publish', type, err);
            });
          }
        });
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

    if (this.ringing) {
      // I'm the one who started the call, so I should cancel it.
      const hasOtherParticipants = this.state.remoteParticipants.length > 0;
      if (this.isCreatedByMe && !hasOtherParticipants) {
        // Signals other users that I have cancelled my call to them
        // before they accepted it.
        // Causes the `call.ended` event to be emitted to all the call members.
        await this.endCall();
      } else if (reject && callingState === CallingState.RINGING) {
        // Signals other users that I have rejected the incoming call.
        // Causes the `call.rejected` event to be emitted to all the call members.
        await this.sendEvent({ type: 'call.rejected' });
      }
    }

    this.statsReporter?.stop();
    this.statsReporter = undefined;

    this.subscriber?.close();
    this.subscriber = undefined;

    this.publisher?.stopPublishing();
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

  private waitForJoinResponse = (timeout: number = 5000) =>
    new Promise<JoinResponse>((resolve, reject) => {
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

  /**
   * Loads the information about the call.
   */
  get = async () => {
    const response = await this.streamClient.get<GetCallResponse>(
      this.streamClientBasePath,
    );
    this.state.setMetadata(response.call);
    this.state.setMembers(response.members);

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

    this.clientStore.registerCall(this);

    return response;
  };

  /**
   * Will start to watch for call related WebSocket events, but it won't join the call. If you watch a call you'll be notified about WebSocket events, but you won't be able to publish your audio and video, and you won't be able to see and hear others. You won't show up in the list of joined participants.
   *
   * @param data
   */
  watch = async (data?: JoinCallRequest) => {
    const response = await watch(this.streamClient, this.type, this.id, data);
    this.state.setMetadata(response.call);
    this.state.setMembers(response.members);

    if (data?.ring && !this.ringing) {
      this.ringingSubject.next(true);
    }

    this.watching = true;
    this.clientStore.registerCall(this);

    return response;
  };

  /**
   * Will start to watch for call related WebSocket events and initiate a call session with the server.
   *
   * @returns a promise which resolves once the call join-flow has finished.
   */
  join = async (data?: JoinCallRequest) => {
    if (
      [CallingState.JOINED, CallingState.JOINING].includes(
        this.state.callingState,
      )
    ) {
      throw new Error(`Illegal State: Already joined.`);
    }

    this.state.setCallingState(CallingState.JOINING);

    if (data?.ring && !this.ringing) {
      this.ringingSubject.next(true);
    }

    if (this.ringing && !this.isCreatedByMe) {
      // Signals other users that I have accepted the incoming call.
      // Causes the `call.accepted` event to be emitted to all the call members.
      await this.sendEvent({ type: 'call.accepted' });
    }

    const call = await join(this.streamClient, this.type, this.id, data);
    this.state.setMetadata(call.metadata);
    this.state.setMembers(call.members);

    this.watching = true;
    this.clientStore.registerCall(this);

    // FIXME OL: convert to a derived state
    this.state.setCallRecordingInProgress(call.metadata.recording);

    // FIXME OL: remove once cascading is implemented
    let sfuUrl = call.sfuServer.url;
    if (
      typeof window !== 'undefined' &&
      window.location &&
      window.location.search
    ) {
      const params = new URLSearchParams(window.location.search);
      const sfuUrlParam = params.get('sfuUrl');
      sfuUrl = sfuUrlParam || call.sfuServer.url;
    }

    const sfuClient = (this.sfuClient = new StreamSfuClient(
      this.dispatcher,
      sfuUrl,
      call.token,
    ));

    /**
     * A closure which hides away the re-connection logic.
     */
    const rejoin = async () => {
      console.log(`Rejoining call ${this.cid} (${this.reconnectAttempts})...`);
      this.reconnectAttempts++;
      this.state.setCallingState(CallingState.RECONNECTING);

      // take a snapshot of the current "local participant" state
      // we'll need it for restoring the previous publishing state later
      const localParticipant = this.state.localParticipant;

      this.subscriber?.close();
      this.publisher?.stopPublishing({ stopTracks: false });
      this.statsReporter?.stop();
      sfuClient.close(); // clean up previous connection

      await sleep(retryInterval(this.reconnectAttempts));
      await this.join(data);
      console.log(`Rejoin: ${this.reconnectAttempts} successful!`);
      if (localParticipant) {
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
      console.log(`Rejoin: state restored ${this.reconnectAttempts}`);
    };

    // reconnect if the connection was closed unexpectedly. example:
    // - SFU crash or restart
    // - network change
    sfuClient.signalReady.then(() => {
      sfuClient.signalWs.addEventListener('close', (e) => {
        // do nothing if the connection was closed on purpose
        if (e.code === 1000) return;
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          rejoin().catch(() => {
            console.log(
              `Rejoin failed for ${this.reconnectAttempts} times. Giving up.`,
            );
            this.state.setCallingState(CallingState.RECONNECTING_FAILED);
          });
        } else {
          console.log('Reconnect attempts exceeded. Giving up...');
          this.state.setCallingState(CallingState.RECONNECTING_FAILED);
        }
      });
    });

    // handlers for connection online/offline events
    // Note: window.addEventListener is not available in React Native, hence the check
    if (typeof window !== 'undefined' && window.addEventListener) {
      const handleOnOffline = () => {
        window.removeEventListener('offline', handleOnOffline);
        console.log('Join: Going offline...');
        this.state.setCallingState(CallingState.OFFLINE);
      };

      const handleOnOnline = () => {
        window.removeEventListener('online', handleOnOnline);
        if (this.state.callingState === CallingState.OFFLINE) {
          console.log('Join: Going online...');
          rejoin().catch(() => {
            console.log(
              `Rejoin failed for ${this.reconnectAttempts} times. Giving up.`,
            );
            this.state.setCallingState(CallingState.RECONNECTING_FAILED);
          });
        }
      };

      window.addEventListener('offline', handleOnOffline);
      window.addEventListener('online', handleOnOnline);

      // register cleanup hooks
      this.leaveCallHooks.push(
        () => window.removeEventListener('offline', handleOnOffline),
        () => window.removeEventListener('online', handleOnOnline),
      );
    }

    this.subscriber = createSubscriber({
      sfuClient,
      dispatcher: this.dispatcher,
      connectionConfig: call.connectionConfig,
      onTrack: this.handleOnTrack,
    });

    const audioSettings = this.data?.settings.audio;
    let isDtxEnabled =
      audioSettings?.opus_dtx_enabled === undefined
        ? false
        : audioSettings?.opus_dtx_enabled;
    // TODO: SZ: Remove once SFU team don't need this
    if (
      typeof window !== 'undefined' &&
      window.location &&
      window.location.search
    ) {
      const queryParams = new URLSearchParams(window.location.search);
      isDtxEnabled = queryParams.get('dtx') === 'false' ? false : isDtxEnabled;
    }
    console.log('DTX enabled', isDtxEnabled);
    this.publisher = new Publisher({
      sfuClient,
      state: this.state,
      connectionConfig: call.connectionConfig,
      isDtxEnabled,
    });

    this.statsReporter = createStatsReporter({
      subscriber: this.subscriber,
      publisher: this.publisher,
      state: this.state,
      edgeName: call.sfuServer.edge_name,
    });

    try {
      const clientDetails: ClientDetails = {};
      if (isReactNative()) {
        // TODO RN
      } else {
        const details = new UAParser(navigator.userAgent).getResult();
        clientDetails.browser = {
          name: details.browser.name || navigator.userAgent,
          version: details.browser.version || '',
        };
        clientDetails.os = {
          name: details.os.name || '',
          version: details.os.version || '',
          architecture: details.cpu.architecture || '',
        };
        clientDetails.device = {
          name: `${details.device.vendor || ''} ${details.device.model || ''} ${
            details.device.type || ''
          }`,
          version: '',
        };
      }
      clientDetails.sdk = getSdkInfo();
      // 1. wait for the signal server to be ready before sending "joinRequest"
      sfuClient.signalReady
        .catch((err) => console.warn('Signal ready failed', err))
        // prepare a generic SDP and send it to the SFU.
        // this is a throw-away SDP that the SFU will use to determine
        // the capabilities of the client (codec support, etc.)
        .then(() => getGenericSdp('recvonly', this.preferredAudioCodec))
        .then((sdp) => sfuClient.join({ subscriberSdp: sdp || '' }));

      // 2. in parallel, wait for the SFU to send us the "joinResponse"
      // this will throw an error if the SFU rejects the join request or
      // fails to respond in time
      const { callState } = await this.waitForJoinResponse();
      const currentParticipants = callState?.participants || [];
      this.state.setParticipants(
        currentParticipants.map<StreamVideoParticipant>((participant) => ({
          ...participant,
          isLoggedInUser: participant.sessionId === sfuClient.sessionId,
          viewportVisibilityState: VisibilityState.UNKNOWN,
        })),
      );

      this.reconnectAttempts = 0; // reset the reconnect attempts counter
      this.state.setCallingState(CallingState.JOINED);
      console.log(`Joined call ${this.cid}`);
    } catch (err) {
      // join failed, try to rejoin
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        await rejoin();
        console.log(`Rejoin ${this.reconnectAttempts} successful!`);
      } else {
        console.log(
          `Rejoin failed for ${this.reconnectAttempts} times. Giving up.`,
        );
        this.state.setCallingState(CallingState.RECONNECTING_FAILED);
        throw new Error('Join failed');
      }
    }
  };

  /**
   * Will update the call members.
   *
   * @param data the request data.
   */
  updateCallMembers = async (
    data: UpdateCallMembersRequest,
  ): Promise<UpdateCallMembersResponse> => {
    // FIXME: OL: implement kick-users
    return this.streamClient.post(`${this.streamClientBasePath}/members`, data);
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
      throw new Error(`Call not joined yet.`);
    }

    const [videoTrack] = videoStream.getVideoTracks();
    if (!videoTrack) {
      return console.error(`There is no video track in the stream.`);
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
      throw new Error(`Call not joined yet.`);
    }

    const [audioTrack] = audioStream.getAudioTracks();
    if (!audioTrack) {
      return console.error(`There is no audio track in the stream`);
    }

    await this.publisher.publishStream(
      audioStream,
      audioTrack,
      TrackType.AUDIO,
      {
        preferredCodec: this.preferredAudioCodec,
      },
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
      throw new Error(`Call not joined yet.`);
    }

    const [screenShareTrack] = screenShareStream.getVideoTracks();
    if (!screenShareTrack) {
      return console.error(`There is no video track in the stream`);
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
    console.log(`stopPublish`, TrackType[trackType]);
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
      if (p.isLoggedInUser) return;

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
   * @deprecated use the `callStatsReport$` state [store variable](./StreamVideoClient.md/#readonlystatestore) instead
   * @param kind
   * @param selector
   * @returns
   */
  getStats = async (
    kind: 'subscriber' | 'publisher',
    selector?: MediaStreamTrack,
  ) => {
    return this.statsReporter?.getRawStatsForTrack(kind, selector);
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
   * Resets the last sent reaction for the user holding the given `sessionId`.
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

  private handleOnTrack = (e: RTCTrackEvent) => {
    const [primaryStream] = e.streams;
    // example: `e3f6aaf8-b03d-4911-be36-83f47d37a76a:TRACK_TYPE_VIDEO`
    const [trackId, trackType] = primaryStream.id.split(':');
    console.log(`Got remote ${trackType} track:`, e.track);
    const participantToUpdate = this.state.participants.find(
      (p) => p.trackLookupPrefix === trackId,
    );
    if (!participantToUpdate) {
      console.error('Received track for unknown participant', trackId, e);
      return;
    }

    e.track.addEventListener('mute', () => {
      console.log(
        `Track muted:`,
        participantToUpdate.userId,
        `${trackType}:${trackId}`,
        e.track,
      );
    });

    e.track.addEventListener('unmute', () => {
      console.log(
        `Track unmuted:`,
        participantToUpdate.userId,
        `${trackType}:${trackId}`,
        e.track,
      );
    });

    e.track.addEventListener('ended', () => {
      console.log(
        `Track ended:`,
        participantToUpdate.userId,
        `${trackType}:${trackId}`,
        e.track,
      );
    });

    const streamKindProp = (
      {
        TRACK_TYPE_AUDIO: 'audioStream',
        TRACK_TYPE_VIDEO: 'videoStream',
        TRACK_TYPE_SCREEN_SHARE: 'screenShareStream',
      } as const
    )[trackType];

    if (!streamKindProp) {
      console.error('Unknown track type', trackType);
      return;
    }
    const previousStream = participantToUpdate[streamKindProp];
    if (previousStream) {
      console.log(`Cleaning up previous remote tracks`, e.track.kind);
      previousStream.getTracks().forEach((t) => {
        t.stop();
        previousStream.removeTrack(t);
      });
    }
    this.state.updateParticipant(participantToUpdate.sessionId, {
      [streamKindProp]: primaryStream,
    });
  };

  private assertCallJoined = () => {
    return new Promise<void>((resolve) => {
      this.state.callingState$
        .pipe(takeWhile((state) => state !== CallingState.JOINED, true))
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
    return this.streamClient.post(
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
    return this.streamClient.post(
      `${this.streamClientBasePath}/start_recording`,
      {},
    );
  };

  /**
   * Stops recording the call
   */
  stopRecording = async () => {
    return this.streamClient.post(
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
    return this.streamClient.post(
      `${this.streamClientBasePath}/request_permission`,
      data,
    );
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
  goLive = async () => {
    return this.streamClient.post<GoLiveResponse>(
      `${this.streamClientBasePath}/go_live`,
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
   * Updates the call settings or custom data.
   *
   * @param updates the updates to apply to the call.
   */
  update = async (updates: UpdateCallRequest) => {
    return this.streamClient.patch<UpdateCallResponse, UpdateCallRequest>(
      `${this.streamClientBasePath}`,
      updates,
    );
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

  private scheduleAutoDrop = () => {
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
                prevMeta?.settings.ring.auto_reject_timeout_ms,
                currentMeta.settings.ring.auto_reject_timeout_ms,
              ];
          if (typeof timeoutMs === 'undefined' || timeoutMs === prevTimeoutMs)
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
   * Performs HTTP request to retrieve the list of recordings for the current call
   * Updates the call state with provided array of CallRecording objects
   */
  queryRecordings = async (): Promise<ListRecordingsResponse> => {
    // FIXME: this is a temporary setting to take call ID as session ID
    const sessionId = this.id;
    const response = await this.streamClient.get<ListRecordingsResponse>(
      `${this.streamClientBasePath}/${sessionId}/recordings`,
    );

    this.state.setCallRecordingsList(response.recordings);

    return response;
  };

  /**
   * Returns a list of Edge Serves for current call.
   *
   * @param data the data.
   */
  getEdgeServer = (data: GetCallEdgeServerRequest) => {
    return this.streamClient.post<GetCallEdgeServerResponse>(
      `${this.streamClientBasePath}/get_edge_server`,
      data,
    );
  };

  /**
   * Sends an event to all call participants.
   *
   * @param event the event to send.
   */
  sendEvent = async (
    event: SendEventRequest & { type: StreamCallEvent['type'] },
  ) => {
    return this.streamClient.post<SendEventResponse, SendEventRequest>(
      `${this.streamClientBasePath}/event`,
      event,
    );
  };
}
