import {
  StreamVideoReadOnlyStateStore,
  StreamVideoWriteableStateStore,
} from './store';
import type {
  DatacenterResponse,
  GetCallEdgeServerRequest,
  GetOrCreateCallResponse,
  GetOrCreateCallRequest,
  ICEServer,
  JoinCallResponse,
  JoinCallRequest,
  RequestPermissionRequest,
  UpdateUserPermissionsRequest,
} from './gen/coordinator';

import type { ReportCallStatEventRequest } from './gen/video/coordinator/client_v1_rpc/client_rpc';
import { measureResourceLoadLatencyTo } from './rpc';
import { StreamSfuClient } from './StreamSfuClient';
import { Call } from './rtc/Call';
import { CallMetadata } from './rtc/CallMetadata';

// import { reportStats } from './stats/coordinator-stats-reporter';
import { Timestamp } from './gen/google/protobuf/timestamp';
import {
  watchCallAccepted,
  watchCallCancelled,
  watchCallCreated,
  watchCallRejected,
  watchCallPermissionRequest,
  watchCallPermissionsUpdated,
  watchCallRecordingStarted,
  watchCallRecordingStopped,
} from './events';

import { CALL_CONFIG, CallConfig } from './config';
import { CallDropScheduler } from './CallDropScheduler';
import { StreamCoordinatorClient } from './coordinator/StreamCoordinatorClient';
import {
  EventHandler,
  StreamClientOptions,
  TokenOrProvider,
  User,
} from './coordinator/connection/types';
import { SortParamRequest } from './gen/coordinator';

/**
 * A `StreamVideoClient` instance lets you communicate with our API, and authenticate users.
 */
export class StreamVideoClient {
  /**
   * Configuration parameters for controlling call behavior.
   */
  callConfig: CallConfig;
  /**
   * A reactive store that exposes all the state variables in a reactive manner - you can subscribe to changes of the different state variables. Our library is built in a way that all state changes are exposed in this store, so all UI changes in your application should be handled by subscribing to these variables.
   * @angular If you're using our Angular SDK, you shouldn't be interacting with the state store directly, instead, you should be using the [`StreamVideoService`](./StreamVideoService.md).
   */
  readonly readOnlyStateStore: StreamVideoReadOnlyStateStore;
  private readonly writeableStateStore: StreamVideoWriteableStateStore;
  private callDropScheduler: CallDropScheduler | undefined;
  public coordinatorClient: StreamCoordinatorClient;

  /**
   * You should create only one instance of `StreamVideoClient`.
   * @angular If you're using our Angular SDK, you shouldn't be calling the `constructor` directly, instead you should be using [`StreamVideoService`](./StreamVideoService.md/#init).
   * @param apiKey your Stream API key
   * @param opts the options for the client.
   * @param {CallConfig} [callConfig=CALL_CONFIG.meeting] custom call configuration
   */
  constructor(
    apiKey: string,
    opts?: StreamClientOptions,
    callConfig: CallConfig = CALL_CONFIG.meeting,
  ) {
    this.callConfig = callConfig;
    this.coordinatorClient = new StreamCoordinatorClient(apiKey, opts);

    this.writeableStateStore = new StreamVideoWriteableStateStore();
    this.readOnlyStateStore = new StreamVideoReadOnlyStateStore(
      this.writeableStateStore,
    );

    // reportStats(
    //   this.readOnlyStateStore,
    //   (e) =>
    //     this.reportCallStats(e).catch((err) => {
    //       console.error('Failed to report stats', err);
    //     }),
    //   (e) =>
    //     this.reportCallStatEvent(e).catch((err) => {
    //       console.error('Failed to report stats', err);
    //     }),
    // );
  }

  /**
   * Connects the given user to the client.
   * Only one user can connect at a time, if you want to change users, call `disconnectUser` before connecting a new user.
   * If the connection is successful, the connected user [state variable](#readonlystatestore) will be updated accordingly.
   *
   * @param user the user to connect.
   * @param tokenOrProvider a token or a function that returns a token.
   */
  connectUser = async (user: User, tokenOrProvider: TokenOrProvider) => {
    await this.coordinatorClient.connectUser(user, tokenOrProvider);

    this.callDropScheduler = new CallDropScheduler(
      this.writeableStateStore,
      this.callConfig,
      this.rejectCall,
      this.cancelCall,
    );

    this.on(
      'call.created',
      // @ts-expect-error until we sort out the types
      watchCallCreated(this.writeableStateStore),
    );
    this.on(
      'call.accepted',
      // @ts-expect-error until we sort out the types
      watchCallAccepted(this.writeableStateStore),
    );
    this.on(
      'call.rejected',
      // @ts-expect-error until we sort out the types
      watchCallRejected(this.writeableStateStore),
    );
    this.on(
      'call.cancelled',
      // @ts-expect-error until we sort out the types
      watchCallCancelled(this.writeableStateStore),
    );
    this.on(
      'call.permission_request',
      // @ts-expect-error until we sort out the types
      watchCallPermissionRequest(this.writeableStateStore),
    );

    this.on(
      'call.permissions_updated',
      // @ts-expect-error until we sort out the types
      watchCallPermissionsUpdated(this.writeableStateStore),
    );

    this.on(
      'call.recording_started',
      // @ts-expect-error until we sort out the types
      watchCallRecordingStarted(this.writeableStateStore),
    );

    this.on(
      'call.recording_stopped',
      // @ts-expect-error until we sort out the types
      watchCallRecordingStopped(this.writeableStateStore),
    );

    this.writeableStateStore.setCurrentValue(
      this.writeableStateStore.connectedUserSubject,
      user,
    );
  };

  /**
   * Disconnects the currently connected user from the client.
   *
   * If the connection is successfully disconnected, the connected user [state variable](#readonlystatestore) will be updated accordingly
   */
  disconnectUser = async () => {
    // FIXME OL: we should clean-up the event listeners as well
    await this.coordinatorClient.disconnectUser();
    this.callDropScheduler?.cleanUp();
    this.writeableStateStore.setCurrentValue(
      this.writeableStateStore.connectedUserSubject,
      undefined,
    );
  };

  /**
   * You can subscribe to WebSocket events provided by the API.
   * To remove a subscription, call the `off` method or, execute the returned unsubscribe function.
   * Please note that subscribing to WebSocket events is an advanced use-case, for most use-cases it should be enough to watch for changes in the reactive [state store](#readonlystatestore).
   *
   * @param eventName the event name.
   * @param callback the callback which will be called when the event is emitted.
   * @returns an unsubscribe function.
   */
  on = (eventName: string, callback: EventHandler) => {
    return this.coordinatorClient.on(eventName, callback);
  };

  /**
   * Remove subscription for WebSocket events that were created by the `on` method.
   *
   * @param event the event name.
   * @param callback the callback which was passed to the `on` method.
   */
  off = (event: string, callback: EventHandler) => {
    return this.coordinatorClient.off(event, callback);
  };

  /**
   * Allows you to create new calls with the given parameters.
   * If a call with the same combination of type and id already exists, it will be returned.
   *
   * Causes the CallCreated event to be emitted to all the call members in case this call didnot exist before.
   *
   * @param id the id of the call.
   * @param type the type of the call.
   * @param data the data for the call.
   * @returns A call metadata with information about the call.
   */
  getOrCreateCall = async (
    id: string,
    type: string,
    data?: GetOrCreateCallRequest,
  ) => {
    // FIXME ZS: method name is misleading, also the client shouldn't care if a call is ringing or not
    let response!: GetOrCreateCallResponse | JoinCallResponse;
    if (data?.ring) {
      response = await this.coordinatorClient.joinCall(id, type, data);
    } else {
      response = await this.coordinatorClient.getOrCreateCall(id, type, data);
    }
    const { call } = response;
    if (!call) {
      console.log(`Call with id ${id} and type ${type} could not be created`);
      return;
    }

    const currentPendingCalls = this.writeableStateStore.getCurrentValue(
      this.writeableStateStore.pendingCallsSubject,
    );
    const callAlreadyRegistered = currentPendingCalls.find(
      (pendingCall) => pendingCall.call.id === call.id,
    );

    if (!callAlreadyRegistered) {
      this.writeableStateStore.setCurrentValue(
        this.writeableStateStore.pendingCallsSubject,
        (pendingCalls) => [...pendingCalls, new CallMetadata(call)],
      );
      return response;
    } else {
      // TODO: handle error?
      return undefined;
    }
  };

  /**
   * Signals other users that I have accepted the incoming call.
   * Causes the `CallAccepted` event to be emitted to all the call members.
   * @param callId
   * @param callType
   * @returns
   */
  acceptCall = async (callId: string, callType: string) => {
    await this.coordinatorClient.sendEvent(callId, callType, {
      type: 'call.accepted',
    });
    return await this.joinCall(callId, callType);
  };

  /**
   * Signals other users that I have rejected the incoming call.
   * Causes the `CallRejected` event to be emitted to all the call members.
   * @param callId
   * @param callType
   * @returns
   */
  rejectCall = async (callId: string, callType: string) => {
    this.writeableStateStore.setCurrentValue(
      this.writeableStateStore.pendingCallsSubject,
      (pendingCalls) =>
        pendingCalls.filter((incomingCall) => incomingCall.call.id !== callId),
    );
    await this.coordinatorClient.sendEvent(callId, callType, {
      type: 'call.rejected',
    });
  };

  /**
   * Signals other users that I have cancelled my call to them before they accepted it.
   * Causes the CallCancelled event to be emitted to all the call members.
   *
   * Cancelling a call is only possible before the local participant joined the call.
   * @param callId
   * @param callType
   * @returns
   */
  cancelCall = async (callId: string, callType: string) => {
    const store = this.writeableStateStore;
    const activeCall = store.getCurrentValue(store.activeCallSubject);
    const leavingActiveCall = activeCall?.data.call.id === callId;
    if (leavingActiveCall) {
      activeCall.leave();
    } else {
      store.setCurrentValue(store.pendingCallsSubject, (pendingCalls) =>
        pendingCalls.filter((pendingCall) => pendingCall.call.id !== callId),
      );
    }

    const remoteParticipants = store.getCurrentValue(store.remoteParticipants$);
    if (!remoteParticipants.length && !leavingActiveCall) {
      await this.coordinatorClient.sendEvent(callId, callType, {
        type: 'call.cancelled',
      });
    }
  };

  /**
   * Allows you to create a new call with the given parameters and joins the call immediately.
   * If a call with the same combination of `type` and `id` already exists, it will join the existing call.
   *
   * @param id the id of the call.
   * @param type the type of the call.
   * @param data the data for the call.
   * @returns A [`Call`](./Call.md) instance that can be used to interact with the call.
   */
  joinCall = async (id: string, type: string, data?: JoinCallRequest) => {
    const joinCallResponse = await this.coordinatorClient.joinCall(
      id,
      type,
      data,
    );

    const { call: callMeta, edges, members } = joinCallResponse;
    if (callMeta && edges) {
      const edge = await this.getCallEdgeServer(id, type, edges);
      if (edge.credentials && edge.credentials.server) {
        // TODO OL: compute the initial value from `activeCallSubject`
        this.writeableStateStore.setCurrentValue(
          this.writeableStateStore.callRecordingInProgressSubject,
          !!callMeta.record_egress, // FIXME OL: this is not correct
        );

        const { server, ice_servers, token } = edge.credentials;
        const sfuClient = new StreamSfuClient(server.url, token);
        const metadata = new CallMetadata(callMeta, members);
        const callOptions = {
          connectionConfig: this.toRtcConfiguration(ice_servers),
          edgeName: server.edge_name,
        };
        const call = new Call(
          metadata,
          sfuClient,
          callOptions,
          this.writeableStateStore,
        );
        await call.join();

        this.writeableStateStore.setCurrentValue(
          this.writeableStateStore.activeCallSubject,
          call,
        );

        return call;
      } else {
        // TODO: handle error?
        return undefined;
      }
    } else {
      // TODO: handle error?
      return undefined;
    }
  };

  /**
   * Starts recording for the call described by the given `callId` and `callType`.
   * @param callId can be extracted from a [`Call` instance](./Call.md/#data)
   * @param callType can be extracted from a [`Call` instance](./Call.md/#data)
   */
  startRecording = async (callId: string, callType: string) => {
    try {
      return await this.coordinatorClient.startRecording(callId, callType);
    } catch (error) {
      console.log(`Failed to start recording`, error);
    }
  };

  queryCalls = async (
    filterConditions: { [key: string]: any },
    sort: Array<SortParamRequest>,
    limit?: number,
    next?: string,
  ) => {
    return await this.coordinatorClient.queryCalls(
      filterConditions,
      sort,
      limit,
      next,
    );
  };

  /**
   * Stops recording for the call described by the given `callId` and `callType`.
   * @param callId can be extracted from a [`Call` instance](./Call.md/#data)
   * @param callType can be extracted from a [`Call` instance](./Call.md/#data)
   */
  stopRecording = async (callId: string, callType: string) => {
    try {
      return await this.coordinatorClient.stopRecording(callId, callType);
    } catch (error) {
      console.log(`Failed to stop recording`, error);
    }
  };

  /**
   * Sends a `call.permission_request` event to all users connected to the call. The call settings object contains infomration about which permissions can be requested during a call (for example a user might be allowed to request permission to publish audio, but not video).
   * @param callId
   * @param callType
   * @param data
   * @returns
   */
  requestCallPermissions = async (
    callId: string,
    callType: string,
    data: RequestPermissionRequest,
  ) => {
    return this.coordinatorClient.requestCallPermissions(
      callId,
      callType,
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
   * @param callId
   * @param callType
   * @param data
   * @returns
   */
  updateUserPermissions = async (
    callId: string,
    callType: string,
    data: UpdateUserPermissionsRequest,
  ) => {
    return this.coordinatorClient.updateUserPermissions(callId, callType, data);
  };

  /**
   * Reports call WebRTC metrics to coordinator API
   * @param stats
   * @returns
   */
  private reportCallStats = async (stats: Object) => {
    const callMetadata = this.writeableStateStore.getCurrentValue(
      this.writeableStateStore.activeCallSubject,
    )?.data;

    if (!callMetadata) {
      console.log("There isn't an active call");
      return;
    }
    const request = {
      callCid: callMetadata.call.cid,
      statsJson: new TextEncoder().encode(JSON.stringify(stats)),
    };
    await this.coordinatorClient.reportCallStats(
      callMetadata.call.id,
      callMetadata.call.type,
      request,
    );
  };

  private getCallEdgeServer = async (
    id: string,
    type: string,
    edges: DatacenterResponse[],
  ) => {
    const latencyByEdge: GetCallEdgeServerRequest['latency_measurements'] = {};
    await Promise.all(
      edges.map(async (edge) => {
        latencyByEdge[edge.name] = await measureResourceLoadLatencyTo(
          edge.latency_url,
        );
      }),
    );

    return await this.coordinatorClient.getCallEdgeServer(id, type, {
      latency_measurements: latencyByEdge,
    });
  };

  private toRtcConfiguration = (config?: ICEServer[]) => {
    if (!config || config.length === 0) return undefined;
    const rtcConfig: RTCConfiguration = {
      iceServers: config.map((ice) => ({
        urls: ice.urls,
        username: ice.username,
        credential: ice.password,
      })),
    };
    return rtcConfig;
  };

  /**
   * Reports call events (for example local participant muted themselves) to the coordinator API
   * @param statEvent
   * @returns
   */
  private reportCallStatEvent = async (
    statEvent: ReportCallStatEventRequest['event'],
  ) => {
    const callMetadata = this.writeableStateStore.getCurrentValue(
      this.writeableStateStore.activeCallSubject,
    )?.data;
    if (!callMetadata) {
      console.log("There isn't an active call");
      return;
    }

    const request = {
      callCid: callMetadata.call.cid,
      timestamp: Timestamp.fromDate(new Date()),
      event: statEvent,
    };
    await this.coordinatorClient.reportCallStatEvent(
      callMetadata.call.id,
      callMetadata.call.type,
      request,
    );
  };

  /**
   * Sets the `participant.isPinned` value.
   * @param sessionId the session id of the participant
   * @param isPinned the value to set the participant.isPinned
   * @returns
   */
  setParticipantIsPinned = (sessionId: string, isPinned: boolean): void => {
    this.writeableStateStore.updateParticipant(sessionId, {
      isPinned,
    });
  };
}
