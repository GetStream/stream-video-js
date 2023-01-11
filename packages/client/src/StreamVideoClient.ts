import {
  StreamVideoReadOnlyStateStore,
  StreamVideoWriteableStateStore,
} from './store';
import type { Call as CallMeta } from './gen/video/coordinator/call_v1/call';
import type {
  CreateCallRequest,
  GetOrCreateCallRequest,
  JoinCallRequest,
  ReportCallStatEventRequest,
  ReportCallStatEventResponse,
  ReportCallStatsRequest,
  ReportCallStatsResponse,
} from './gen/video/coordinator/client_v1_rpc/client_rpc';
import { UserEventType } from './gen/video/coordinator/client_v1_rpc/client_rpc';
import { ClientRPCClient } from './gen/video/coordinator/client_v1_rpc/client_rpc.client';
import type {
  Edge,
  ICEServer,
  Latency,
} from './gen/video/coordinator/edge_v1/edge';
import type { User, UserInput } from './gen/video/coordinator/user_v1/user';
import {
  createCoordinatorClient,
  measureResourceLoadLatencyTo,
  StreamVideoClientOptions,
  withHeaders,
} from './rpc';
import { createSocketConnection, StreamEventListener } from './ws';
import { StreamSfuClient } from './StreamSfuClient';
import { Call } from './rtc/Call';

import { reportStats } from './stats/coordinator-stats-reporter';
import { Timestamp } from './gen/google/protobuf/timestamp';
import { StreamWebSocketClient } from './ws/StreamWebSocketClient';
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

const defaultOptions: Partial<StreamVideoClientOptions> = {
  coordinatorRpcUrl:
    'https://rpc-video-coordinator.oregon-v1.stream-io-video.com/rpc',
  coordinatorWsUrl:
    'wss://wss-video-coordinator.oregon-v1.stream-io-video.com/rpc/stream.video.coordinator.client_v1_rpc.Websocket/Connect',
  sendJson: false,
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
  private client: ClientRPCClient;
  private options: StreamVideoClientOptions;
  private ws: StreamWebSocketClient | undefined;
  private callDropScheduler: CallDropScheduler;
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
      sendJson: options.sendJson,
      interceptors: [
        withHeaders({
          api_key: apiKey,
          Authorization: `Bearer ${authToken}`,
        }),
      ],
    });

    this.writeableStateStore = new StreamVideoWriteableStateStore();
    this.readOnlyStateStore = new StreamVideoReadOnlyStateStore(
      this.writeableStateStore,
    );

    this.userBatcher = new Batcher<string>(3000, this.handleUserBatch);
    this.callDropScheduler = new CallDropScheduler(
      this.rejectCall,
      this.cancelCall,
    );

    reportStats(
      this.readOnlyStateStore,
      (e) => this.reportCallStats(e),
      (e) => this.reportCallStatEvent(e),
    );
  }

  private handleUserBatch = (idList: string[]) => {
    this.client
      .queryUsers({
        mqJson: new TextEncoder().encode(
          JSON.stringify({ id: { $in: idList } }),
        ),
        sorts: [],
      })
      .then(({ response: { users } }) => {
        const mappedUsers = users.reduce<Record<string, User>>(
          (userMap, user) => {
            userMap[user.id] ??= user;
            return userMap;
          },
          {},
        );

        this.writeableStateStore.setCurrentValue(
          this.writeableStateStore.participantsSubject,
          (participants) =>
            participants.map((participant) => {
              const user = mappedUsers[participant.userId];
              return user ? { ...participant, user } : participant;
            }),
        );
      });
  };

  /**
   * Connects the given user to the client.
   * Only one user can connect at a time, if you want to change users, call `disconnect` before connecting a new user.
   * If the connection is successful, the connected user [state variable](#readonlystatestore) will be updated accordingly.
   * @param apiKey
   * @param token
   * @param user
   * @returns
   */
  connect = async (apiKey: string, token: string, user: UserInput) => {
    if (this.ws) return;
    this.ws = await createSocketConnection(
      this.options.coordinatorWsUrl!,
      apiKey,
      token,
      user,
    );
    if (this.ws) {
      watchCallCancelled(
        this.on,
        this.writeableStateStore,
        this.callDropScheduler,
        this.callConfig,
      );
      watchCallCreated(
        this.on,
        this.writeableStateStore,
        this.callDropScheduler,
        this.callConfig,
      );
      watchCallAccepted(
        this.on,
        this.writeableStateStore,
        this.callDropScheduler,
      );
      watchCallRejected(
        this.on,
        this.writeableStateStore,
        this.callDropScheduler,
        this.callConfig,
      );
    }
    this.writeableStateStore.setCurrentValue(
      this.writeableStateStore.connectedUserSubject,
      user,
    );
  };

  /**
   * Disconnects the currently connected user from the client.
   *
   * If the connection is successfully disconnected, the connected user [state variable](#readonlystatestore) will be updated accordingly
   * @returns
   */
  disconnect = async () => {
    if (!this.ws) return;
    this.ws.disconnect();
    this.ws = undefined;
    this.writeableStateStore.setCurrentValue(
      this.writeableStateStore.connectedUserSubject,
      undefined,
    );
  };

  /**
   * You can subscribe to WebSocket events provided by the API. To remove a subscription, call the `off` method.
   * Please note that subscribing to WebSocket events is an advanced use-case, for most use-cases it should be enough to watch for changes in the reactive [state store](#readonlystatestore).
   * @param event
   * @param fn
   * @returns
   */
  on = <T>(event: string, fn: StreamEventListener<T>) => {
    return this.ws?.on(event, fn);
  };

  /**
   * Remove subscription for WebSocket events that were created by the `on` method.
   * @param event
   * @param fn
   * @returns
   */
  off = <T>(event: string, fn: StreamEventListener<T>) => {
    return this.ws?.off(event, fn);
  };

  /**
   * Allows you to create new calls with the given parameters. If a call with the same combination of type and id already exists, this will return an error.
   * Causes the CallCreated event to be emitted to all the call members.
   * @param {GetOrCreateCallRequest} data CreateCallRequest payload object
   * @returns A call metadata with information about the call.
   */
  getOrCreateCall = async (data: GetOrCreateCallRequest) => {
    const { response } = await this.client.getOrCreateCall(data);
    if (response.call) {
      this.writeableStateStore.setCurrentValue(
        this.writeableStateStore.pendingCallsSubject,
        (pendingCalls) => [
          ...pendingCalls,
          {
            call: response.call?.call,
            callDetails: response.call?.details,
          },
        ],
      );
      return response.call;
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

    if (call && call.call?.callCid) {
      this.callDropScheduler.scheduleCancel(
        call.call?.callCid,
        this.callConfig.autoCancelTimeout,
      );

      this.writeableStateStore.setCurrentValue(
        this.writeableStateStore.pendingCallsSubject,
        (pendingCalls) => [
          ...pendingCalls,
          {
            call: call.call,
            callDetails: call.details,
          },
        ],
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
    this.callDropScheduler.cancelDrop(callCid);
    await this.client.sendEvent({
      callCid,
      eventType: UserEventType.ACCEPTED_CALL,
    });
    const [type, id] = callCid.split(':');
    const callController = await this.joinCall({ id, type, datacenterId: '' });
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
    this.callDropScheduler.cancelDrop(callCid);
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
    this.callDropScheduler.cancelDrop(callCid);
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
   * Updates the general call configuration.
   */
  updateCallConfig = (config: CallConfig) => {
    this.callConfig = config;
  };

  /**
   * Allows you to create a new call with the given parameters and joins the call immediately. If a call with the same combination of `type` and `id` already exists, it will join the existing call.
   * @param data
   * @param sessionId
   * @returns A [`Call`](./Call.md) instance that can be used to interact with the call.
   */
  joinCall = async (data: JoinCallRequest, sessionId?: string) => {
    const { response } = await this.client.joinCall(data);
    if (response.call && response.call.call && response.edges) {
      const callMeta = response.call.call;
      const edge = await this.getCallEdgeServer(callMeta, response.edges);

      if (edge.credentials && edge.credentials.server) {
        const edgeName = edge.credentials.server.edgeName;
        const { server, iceServers, token } = edge.credentials;
        const sfuClient = new StreamSfuClient(server.url, token, sessionId);

        // TODO OL: compute the initial value from `activeCallSubject`
        this.writeableStateStore.setCurrentValue(
          this.writeableStateStore.callRecordingInProgressSubject,
          callMeta.recordingActive,
        );

        const call = new Call(
          response.call,
          sfuClient,
          {
            connectionConfig: this.toRtcConfiguration(iceServers),
            edgeName,
          },
          this.writeableStateStore,
          this.userBatcher,
          this.callConfig,
        );

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
   * Performs the whole chain of operations to establish active call connection
   * @param {JoinCallRequest} data payload object for the join call request
   */
  joinCallInstantly = async (data: JoinCallRequest) => {
    const callController = await this.joinCall(data);
    if (!callController) {
      console.error('Failed to establish call connection');
      return;
    }
    await callController.join();
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

  private getCallEdgeServer = async (call: CallMeta, edges: Edge[]) => {
    const latencyByEdge: { [e: string]: Latency } = {};
    await Promise.all(
      edges.map(async (edge) => {
        latencyByEdge[edge.name] = {
          measurementsSeconds: await measureResourceLoadLatencyTo(
            edge.latencyUrl,
            Math.max(this.options.latencyMeasurementRounds || 0, 3),
          ),
        };
      }),
    );

    const edgeServer = await this.client.getCallEdgeServer({
      callCid: call.callCid,
      // TODO: OL: check the double wrapping
      measurements: {
        measurements: latencyByEdge,
      },
    });

    return edgeServer.response;
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
