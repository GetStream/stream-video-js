import {
  StreamVideoReadOnlyStateStore,
  StreamVideoWriteableStateStore,
} from './store';
import type {
  DatacenterResponse,
  GetCallEdgeServerRequest,
  GetOrCreateCallRequest,
  ICEServer,
} from './gen/coordinator';

import type {
  CreateCallRequest,
  ReportCallStatEventRequest,
  ReportCallStatEventResponse,
  ReportCallStatsRequest,
  ReportCallStatsResponse,
} from './gen/video/coordinator/client_v1_rpc/client_rpc';
import { UserEventType } from './gen/video/coordinator/client_v1_rpc/client_rpc';
import { ClientRPCClient } from './gen/video/coordinator/client_v1_rpc/client_rpc.client';
import {
  createCoordinatorClient,
  measureResourceLoadLatencyTo,
  StreamVideoClientOptions,
  withHeaders,
} from './rpc';
import { StreamSfuClient } from './StreamSfuClient';
import { Call } from './rtc/Call';

// import { reportStats } from './stats/coordinator-stats-reporter';
import { Timestamp } from './gen/google/protobuf/timestamp';
import { Batcher } from './Batcher';
import {
  watchCallAccepted,
  watchCallCancelled,
  watchCallCreated,
  watchCallRejected,
} from './events/call';
import { CALL_CONFIG } from './config/defaultConfigs';
import { CallConfig } from './config/types';
import { CallDropScheduler } from './CallDropScheduler';
import { StreamCoordinatorClient } from './coordinator/StreamCoordinatorClient';
import {
  EventHandler,
  TokenOrProvider,
  User,
} from './coordinator/connection/types';

const defaultOptions: Partial<StreamVideoClientOptions> = {
  coordinatorRpcUrl:
    'https://rpc-video-coordinator.oregon-v1.stream-io-video.com/rpc',

  latencyMeasurementRounds: 3,
};

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
  /**
   * @deprecated use coordinatorClient instead.
   */
  private client: ClientRPCClient;
  private options: StreamVideoClientOptions;
  private callDropScheduler: CallDropScheduler | undefined;
  private coordinatorClient: StreamCoordinatorClient;
  /**
   * @internal
   */
  public readonly userBatcher: Batcher<string>;

  /**
   * You should create only one instance of `StreamVideoClient`.
   * @angular If you're using our Angular SDK, you shouldn't be calling the `constructor` directly, instead you should be using [`StreamVideoService`](./StreamVideoService.md/#init).
   * @param apiKey your Stream API key
   * @param opts
   * @param {CallConfig} [callConfig=CALL_CONFIG.meeting] custom call configuration
   */
  constructor(
    apiKey: string,
    opts: StreamVideoClientOptions,
    callConfig: CallConfig = CALL_CONFIG.meeting,
  ) {
    this.callConfig = callConfig;

    const options = {
      ...defaultOptions,
      ...opts,
    };
    this.options = options;
    const { token } = options;
    const authToken = typeof token === 'function' ? token() : token;
    this.client = createCoordinatorClient({
      baseUrl: options.coordinatorRpcUrl || '/',
      sendJson: true,
      interceptors: [
        withHeaders({
          api_key: apiKey,
          Authorization: `Bearer ${authToken}`,
        }),
      ],
    });

    this.coordinatorClient = new StreamCoordinatorClient(apiKey);

    this.writeableStateStore = new StreamVideoWriteableStateStore();
    this.readOnlyStateStore = new StreamVideoReadOnlyStateStore(
      this.writeableStateStore,
    );

    this.userBatcher = new Batcher<string>(
      3000,
      // this.handleUserBatch,
      () => {},
    );

    // reportStats(
    //   this.readOnlyStateStore,
    //   (e) => this.reportCallStats(e),
    //   (e) => this.reportCallStatEvent(e),
    // );
  }

  // private handleUserBatch = (idList: string[]) => {
  //   this.client
  //     .queryUsers({
  //       mqJson: new TextEncoder().encode(
  //         JSON.stringify({ id: { $in: idList } }),
  //       ),
  //       sorts: [],
  //     })
  //     .then(({ response: { users } }) => {
  //       const mappedUsers = users.reduce<Record<string, User>>(
  //         (userMap, user) => {
  //           userMap[user.id] ??= user;
  //           return userMap;
  //         },
  //         {},
  //       );
  //
  //       this.writeableStateStore.setCurrentValue(
  //         this.writeableStateStore.participantsSubject,
  //         (participants) =>
  //           participants.map((participant) => {
  //             const user = mappedUsers[participant.userId];
  //             return user ? { ...participant, user } : participant;
  //           }),
  //       );
  //     });
  // };

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

    this.on('call.created', watchCallCreated(this.writeableStateStore));
    this.on('call.accepted', watchCallAccepted(this.writeableStateStore));
    this.on('call.rejected', watchCallRejected(this.writeableStateStore));
    this.on('call.cancelled', watchCallCancelled(this.writeableStateStore));

    this.writeableStateStore.setCurrentValue(
      this.writeableStateStore.connectedUserSubject,
      // FIXME OL: fix the types
      {
        id: user.id,
        name: user.name!,
        teams: user.teams!,
        customJson: new Uint8Array(),
        imageUrl: '/profile.png',
        role: user.role!,
      },
    );
  };

  /**
   * Disconnects the currently connected user from the client.
   *
   * If the connection is successfully disconnected, the connected user [state variable](#readonlystatestore) will be updated accordingly
   */
  disconnectUser = async () => {
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
    data: GetOrCreateCallRequest,
  ) => {
    const response = await this.coordinatorClient.getOrCreateCall(
      id,
      type,
      data,
    );
    const { call } = response;
    if (!call) {
      console.log(`Call with id ${id} and type ${type} could not be created`);
      return;
    }

    const pendingCalls = this.writeableStateStore.getCurrentValue(
      this.writeableStateStore.pendingCallsSubject,
    );
    const callAlreadyRegistered = pendingCalls.find(
      (pendingCall) => pendingCall.call?.callCid === call.cid,
    );

    if (!callAlreadyRegistered) {
      // this.writeableStateStore.setCurrentValue(
      //   this.writeableStateStore.pendingCallsSubject,
      //   (pendingCalls) => [...pendingCalls, call],
      // );
      return response;
    } else {
      // TODO: handle error?
      return undefined;
    }
  };

  /**
   * Allows you to create new calls with the given parameters. If a call with the same combination of type and id already exists, this will return an error.
   * @param {CreateCallRequest} data
   * @returns A call metadata with information about the call.
   */
  createCall = async (data: CreateCallRequest) => {
    const createdCall = await this.client.createCall(data);
    const { call } = createdCall.response;

    if (call) {
      this.writeableStateStore.setCurrentValue(
        this.writeableStateStore.pendingCallsSubject,
        (pendingCalls) => [...pendingCalls, call],
      );
    }

    return call;
  };

  /**
   * Signals other users that I have accepted the incoming call.
   * Causes the `CallAccepted` event to be emitted to all the call members.
   * @param callCid config ID of the rejected call
   * @returns
   */
  acceptCall = async (callCid: string) => {
    await this.client.sendEvent({
      callCid,
      eventType: UserEventType.ACCEPTED_CALL,
    });
    const [type, id] = callCid.split(':');
    const callController = await this.joinCall(id, type);
    await callController?.join();
    return callController;
  };

  /**
   * Signals other users that I have rejected the incoming call.
   * Causes the `CallRejected` event to be emitted to all the call members.
   * @param callCid config ID of the rejected call
   * @returns
   */
  rejectCall = async (callCid: string) => {
    this.writeableStateStore.setCurrentValue(
      this.writeableStateStore.pendingCallsSubject,
      (pendingCalls) =>
        pendingCalls.filter(
          (incomingCall) => incomingCall.call?.callCid !== callCid,
        ),
    );
    await this.client.sendEvent({
      callCid,
      eventType: UserEventType.REJECTED_CALL,
    });
  };

  /**
   * Signals other users that I have cancelled my call to them before they accepted it.
   * Causes the CallCancelled event to be emitted to all the call members.
   * @param callCid config ID of the cancelled call
   * @returns
   */
  cancelCall = async (callCid: string) => {
    const store = this.writeableStateStore;
    const activeCall = store.getCurrentValue(store.activeCallSubject);
    const leavingActiveCall = activeCall?.data.call?.callCid === callCid;

    if (leavingActiveCall) {
      activeCall.leave();
    } else {
      store.setCurrentValue(store.pendingCallsSubject, (pendingCalls) =>
        pendingCalls.filter(
          (pendingCall) => pendingCall.call?.callCid !== callCid,
        ),
      );
    }

    const remoteParticipants = store.getCurrentValue(store.remoteParticipants$);

    if (!remoteParticipants.length && !leavingActiveCall) {
      await this.client.sendEvent({
        callCid,
        eventType: UserEventType.CANCELLED_CALL,
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
  joinCall = async (
    id: string,
    type: string,
    data?: GetOrCreateCallRequest,
  ) => {
    const joinCallResponse = await this.coordinatorClient.joinCall(
      id,
      type,
      data,
    );

    const { call: callMeta, edges } = joinCallResponse;
    if (callMeta && edges) {
      const edge = await this.getCallEdgeServer(id, type, edges);
      if (edge.credentials && edge.credentials.server) {
        // TODO OL: compute the initial value from `activeCallSubject`
        this.writeableStateStore.setCurrentValue(
          this.writeableStateStore.callRecordingInProgressSubject,
          !!callMeta.record_egress, // FIXME OL: this is not correct
        );

        const { server, ice_servers, token } = edge.credentials;
        const sfuClient = new StreamSfuClient(server.url!, token!);
        const call = new Call(
          {
            // @ts-ignore
            call: {
              id,
              type,
              callCid: callMeta.cid!,
              createdByUserId: callMeta.created_by?.id!,
            },
            users: {},
            // @ts-ignore
            details: {},
          },
          sfuClient,
          {
            connectionConfig: this.toRtcConfiguration(ice_servers),
            edgeName: server!.edge_name,
          },
          this.writeableStateStore,
          this.userBatcher,
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
    await this.client.startRecording({
      callId,
      callType,
    });

    this.writeableStateStore.setCurrentValue(
      this.writeableStateStore.callRecordingInProgressSubject,
      true,
    );
  };

  /**
   * Stops recording for the call described by the given `callId` and `callType`.
   * @param callId can be extracted from a [`Call` instance](./Call.md/#data)
   * @param callType can be extracted from a [`Call` instance](./Call.md/#data)
   */
  stopRecording = async (callId: string, callType: string) => {
    await this.client.stopRecording({
      callId,
      callType,
    });

    this.writeableStateStore.setCurrentValue(
      this.writeableStateStore.callRecordingInProgressSubject,
      false,
    );
  };

  /**
   * Reports call WebRTC metrics to coordinator API
   * @param stats
   * @returns
   */
  private reportCallStats = async (
    stats: Object,
  ): Promise<ReportCallStatsResponse | void> => {
    const callCid = this.writeableStateStore.getCurrentValue(
      this.writeableStateStore.activeCallSubject,
    )?.data.call?.callCid;

    if (!callCid) {
      console.log("There isn't an active call");
      return;
    }

    const request: ReportCallStatsRequest = {
      callCid,
      statsJson: new TextEncoder().encode(JSON.stringify(stats)),
    };
    const response = await this.client.reportCallStats(request);
    return response.response;
  };

  private getCallEdgeServer = async (
    id: string,
    type: string,
    edges: DatacenterResponse[],
  ) => {
    const latencyByEdge: GetCallEdgeServerRequest['latency_measurements'] = {};
    await Promise.all(
      edges.map(async (edge) => {
        latencyByEdge[edge.name!] = await measureResourceLoadLatencyTo(
          edge.latency_url!,
          Math.max(this.options.latencyMeasurementRounds || 0, 3),
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
        urls: ice.urls!,
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
  ): Promise<ReportCallStatEventResponse | void> => {
    const callCid = this.writeableStateStore.getCurrentValue(
      this.writeableStateStore.activeCallSubject,
    )?.data.call?.callCid;

    if (!callCid) {
      console.log("There isn't an active call");
      return;
    }
    const request: ReportCallStatEventRequest = {
      callCid,
      timestamp: Timestamp.fromDate(new Date()),
      event: statEvent,
    };
    const response = await this.client.reportCallStatEvent(request);
    return response.response;
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
