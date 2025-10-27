import { Call } from './Call';
import { StreamClient } from './coordinator/connection/client';
import {
  CallingState,
  StreamVideoReadOnlyStateStore,
  StreamVideoWriteableStateStore,
} from './store';
import type {
  CallCreatedEvent,
  CallRingEvent,
  ConnectedEvent,
  CreateDeviceRequest,
  CreateGuestRequest,
  CreateGuestResponse,
  GetEdgesResponse,
  ListDevicesResponse,
  QueryAggregateCallStatsRequest,
  QueryAggregateCallStatsResponse,
  QueryCallsRequest,
  QueryCallsResponse,
  QueryCallStatsRequest,
  QueryCallStatsResponse,
} from './gen/coordinator';
import {
  AllClientEvents,
  ClientEventListener,
  StreamClientOptions,
  TokenOrProvider,
  TokenProvider,
  User,
  UserWithId,
} from './coordinator/connection/types';
import { retryInterval, sleep } from './coordinator/connection/utils';
import {
  createCoordinatorClient,
  createTokenOrProvider,
  getCallInitConcurrencyTag,
  getInstanceKey,
} from './helpers/clientUtils';
import { logToConsole, ScopedLogger, videoLoggerSystem } from './logger';
import { withoutConcurrency } from './helpers/concurrency';
import { enableTimerWorker } from './timers';

export type StreamVideoClientOptions = {
  apiKey: string;
  options?: StreamClientOptions;
  user?: User;
  token?: string;
  tokenProvider?: TokenProvider;
};

/**
 * A `StreamVideoClient` instance lets you communicate with our API, and authenticate users.
 */
export class StreamVideoClient {
  /**
   * A reactive store that exposes all the state variables reactively.
   * You can subscribe to changes of the different state variables.
   * Our library is built in a way that all state changes are exposed in this store,
   * o all UI changes in your application should be handled by subscribing to these variables.
   *
   * @deprecated use the `client.state` getter.
   */
  readonly readOnlyStateStore: StreamVideoReadOnlyStateStore;
  readonly logger: ScopedLogger;

  protected readonly writeableStateStore: StreamVideoWriteableStateStore;
  streamClient: StreamClient;

  private effectsRegistered = false;
  private eventHandlersToUnregister: Array<() => void> = [];
  private readonly connectionConcurrencyTag = Symbol(
    'connectionConcurrencyTag',
  );

  private static _instances = new Map<string, StreamVideoClient>();
  private rejectCallWhenBusy = false;

  /**
   * You should create only one instance of `StreamVideoClient`.
   */
  constructor(apiKey: string, opts?: StreamClientOptions);
  constructor(args: StreamVideoClientOptions);
  constructor(
    apiKeyOrArgs: string | StreamVideoClientOptions,
    opts?: StreamClientOptions,
  ) {
    const apiKey =
      typeof apiKeyOrArgs === 'string' ? apiKeyOrArgs : apiKeyOrArgs.apiKey;
    const clientOptions =
      typeof apiKeyOrArgs === 'string' ? opts : apiKeyOrArgs.options;

    if (clientOptions?.enableTimerWorker) enableTimerWorker();

    const rootLogger = clientOptions?.logger || logToConsole;

    videoLoggerSystem.configureLoggers({
      default: { sink: rootLogger, level: clientOptions?.logLevel || 'warn' },
      ...clientOptions?.logOptions,
    });

    this.logger = videoLoggerSystem.getLogger('client');
    this.rejectCallWhenBusy = clientOptions?.rejectCallWhenBusy ?? false;

    this.streamClient = createCoordinatorClient(apiKey, clientOptions);

    this.writeableStateStore = new StreamVideoWriteableStateStore();
    this.readOnlyStateStore = new StreamVideoReadOnlyStateStore(
      this.writeableStateStore,
    );

    if (typeof apiKeyOrArgs !== 'string' && apiKeyOrArgs.user) {
      const user = apiKeyOrArgs.user;
      if (user.type === 'anonymous') user.id = '!anon';
      if (user.id) this.registerClientInstance(apiKey, user);

      const tokenOrProvider = createTokenOrProvider(apiKeyOrArgs);
      this.connectUser(user, tokenOrProvider).catch((err) => {
        this.logger.error('Failed to connect', err);
      });
    }
  }

  /**
   * Gets or creates a StreamVideoClient instance based on the given options.
   */
  static getOrCreateInstance(
    args: StreamVideoClientOptions & { user: User },
  ): StreamVideoClient {
    const { apiKey, user, token, tokenProvider } = args;
    if (!user.id && user.type !== 'anonymous') {
      throw new Error('user.id is required for a non-anonymous user');
    }

    if (
      !token &&
      !tokenProvider &&
      user.type !== 'anonymous' &&
      user.type !== 'guest'
    ) {
      throw new Error(
        'tokenProvider or token is required for a authenticated users',
      );
    }

    return (
      StreamVideoClient._instances.get(getInstanceKey(apiKey, user)) ||
      new StreamVideoClient(args)
    );
  }

  private registerClientInstance = (apiKey: string, user: User) => {
    const instanceKey = getInstanceKey(apiKey, user);
    if (StreamVideoClient._instances.has(instanceKey)) {
      this.logger.warn(
        `A StreamVideoClient already exists for ${user.id}; Prefer using getOrCreateInstance method`,
      );
    }
    StreamVideoClient._instances.set(instanceKey, this);
  };

  /**
   * Return the reactive state store, use this if you want to be notified about changes to the client state
   */
  get state() {
    return this.readOnlyStateStore;
  }

  private registerEffects = () => {
    if (this.effectsRegistered) return;

    this.eventHandlersToUnregister.push(
      this.on('call.created', (event) => this.initCallFromEvent(event)),
      this.on('call.ring', (event) => this.initCallFromEvent(event)),
      this.on('connection.changed', (event) => {
        if (!event.online) return;

        const callsToReWatch = this.writeableStateStore.calls
          .filter((call) => call.watching)
          .map((call) => call.cid);
        if (callsToReWatch.length <= 0) return;

        this.logger.info(`Rewatching calls ${callsToReWatch.join(', ')}`);
        this.queryCalls({
          watch: true,
          filter_conditions: { cid: { $in: callsToReWatch } },
          sort: [{ field: 'cid', direction: 1 }],
        }).catch((err) => {
          this.logger.error('Failed to re-watch calls', err);
        });
      }),
    );

    this.effectsRegistered = true;
  };

  /**
   * Initializes a call from a call created or ringing event.
   * @param e the event.
   */
  private initCallFromEvent = async (e: CallCreatedEvent | CallRingEvent) => {
    if (this.state.connectedUser?.id === e.call.created_by.id) {
      this.logger.debug(`Ignoring ${e.type} event sent by the current user`);
      return;
    }

    try {
      const concurrencyTag = getCallInitConcurrencyTag(e.call_cid);
      await withoutConcurrency(concurrencyTag, async () => {
        const ringing = e.type === 'call.ring';
        let call = this.writeableStateStore.findCall(e.call.type, e.call.id);
        if (call) {
          if (ringing) {
            if (this.shouldRejectCall(call.cid)) {
              this.logger.info(
                `Leaving call with busy reject reason ${call.cid} because user is busy`,
              );
              // remove the instance from the state store
              await call.leave();
              // explicitly reject the call with busy reason as calling state was not ringing before and leave would not call it therefore
              await call.reject('busy');
            } else {
              await call.updateFromRingingEvent(e as CallRingEvent);
            }
          } else {
            call.state.updateFromCallResponse(e.call);
          }
          return;
        }

        call = new Call({
          streamClient: this.streamClient,
          type: e.call.type,
          id: e.call.id,
          members: e.members,
          clientStore: this.writeableStateStore,
          ringing,
        });

        if (ringing) {
          if (this.shouldRejectCall(call.cid)) {
            this.logger.info(`Rejecting call ${call.cid} because user is busy`);
            // call is not in the state store yet, so just reject api is enough
            await call.reject('busy');
          } else {
            await call.updateFromRingingEvent(e as CallRingEvent);
            await call.get();
          }
        } else {
          call.state.updateFromCallResponse(e.call);
          this.writeableStateStore.registerCall(call);
          this.logger.info(`New call created and registered: ${call.cid}`);
        }
      });
    } catch (err) {
      this.logger.error(`Failed to init call from event ${e.type}`, err);
    }
  };

  /**
   * Connects the given user to the client.
   * Only one user can connect at a time, if you want to change users, call `disconnectUser` before connecting a new user.
   * If the connection is successful, the connected user [state variable](#readonlystatestore) will be updated accordingly.
   *
   * @param user the user to connect.
   * @param tokenOrProvider a token or a function that returns a token.
   */
  connectUser = async (
    user: User,
    tokenOrProvider?: TokenOrProvider,
  ): Promise<void | ConnectedEvent> => {
    if (user.type === 'anonymous') {
      user.id = '!anon';
      return this.connectAnonymousUser(user as UserWithId, tokenOrProvider);
    }

    const connectUserResponse = await withoutConcurrency(
      this.connectionConcurrencyTag,
      async () => {
        const client = this.streamClient;
        const { onConnectUserError, persistUserOnConnectionFailure } =
          client.options;
        let { maxConnectUserRetries = 5 } = client.options;
        maxConnectUserRetries = Math.max(maxConnectUserRetries, 1);

        const errorQueue: Error[] = [];
        for (let attempt = 0; attempt < maxConnectUserRetries; attempt++) {
          try {
            this.logger.trace(`Connecting user (${attempt})`, user);
            return user.type === 'guest'
              ? await client.connectGuestUser(user)
              : await client.connectUser(user, tokenOrProvider);
          } catch (err) {
            this.logger.warn(`Failed to connect a user (${attempt})`, err);
            errorQueue.push(err as Error);
            if (attempt === maxConnectUserRetries - 1) {
              onConnectUserError?.(err as Error, errorQueue);
              throw err;
            }

            // we need to force to disconnect the user if the client is
            // configured to persist the user on connection failure
            if (persistUserOnConnectionFailure) {
              await client.disconnectUser();
            }

            await sleep(retryInterval(attempt));
          }
        }
      },
    );

    // connectUserResponse will be void if connectUser called twice for the same user
    if (connectUserResponse?.me) {
      this.writeableStateStore.setConnectedUser(connectUserResponse.me);
    }

    this.registerEffects();

    return connectUserResponse;
  };

  /**
   * Disconnects the currently connected user from the client.
   *
   * If the connection is successfully disconnected, the connected user [state variable](#readonlystatestore) will be updated accordingly
   *
   * @param timeout Max number of ms, to wait for close event of websocket, before forcefully assuming successful disconnection.
   *                https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
   */
  disconnectUser = async (timeout?: number) => {
    await withoutConcurrency(this.connectionConcurrencyTag, async () => {
      const { user, key } = this.streamClient;
      if (!user) return;

      await this.streamClient.disconnectUser(timeout);

      if (user.id) {
        StreamVideoClient._instances.delete(getInstanceKey(key, user));
      }
      this.eventHandlersToUnregister.forEach((unregister) => unregister());
      this.eventHandlersToUnregister = [];
      this.effectsRegistered = false;
      this.writeableStateStore.setConnectedUser(undefined);
    });
  };

  /**
   * You can subscribe to WebSocket events provided by the API.
   * To remove a subscription, call the `off` method or, execute the returned unsubscribe function.
   * Please note that subscribing to WebSocket events is an advanced use-case, for most use-cases it should be enough to watch for changes in the reactive [state store](#readonlystatestore).
   *
   * @param eventName the event name or 'all'.
   * @param callback the callback which will be called when the event is emitted.
   * @returns an unsubscribe function.
   */
  on = <E extends keyof AllClientEvents>(
    eventName: E,
    callback: ClientEventListener<E>,
  ) => {
    return this.streamClient.on(eventName, callback);
  };

  /**
   * Remove subscription for WebSocket events that were created by the `on` method.
   *
   * @param eventName the event name.
   * @param callback the callback which was passed to the `on` method.
   */
  off = <E extends keyof AllClientEvents>(
    eventName: E,
    callback: ClientEventListener<E>,
  ) => {
    return this.streamClient.off(eventName, callback);
  };

  /**
   * Creates a new call.
   *
   * @param type the type of the call.
   * @param id the id of the call.
   * @param options additional options for call creation.
   */
  call = (
    type: string,
    id: string,
    options: { reuseInstance?: boolean } = {},
  ) => {
    const call = options.reuseInstance
      ? this.writeableStateStore.findCall(type, id)
      : undefined;
    return (
      call ??
      new Call({
        streamClient: this.streamClient,
        id: id,
        type: type,
        clientStore: this.writeableStateStore,
      })
    );
  };

  /**
   * Creates a new guest user with the given data.
   *
   * @param data the data for the guest user.
   */
  createGuestUser = async (data: CreateGuestRequest) => {
    return this.streamClient.doAxiosRequest<
      CreateGuestResponse,
      CreateGuestRequest
    >('post', '/guest', data, { publicEndpoint: true });
  };

  /**
   * Will query the API for calls matching the given filters.
   *
   * @param data the query data.
   */
  queryCalls = async (data: QueryCallsRequest = {}) => {
    const response = await this.streamClient.post<
      QueryCallsResponse,
      QueryCallsRequest
    >('/calls', data);
    const calls = [];
    for (const c of response.calls) {
      const call = new Call({
        streamClient: this.streamClient,
        id: c.call.id,
        type: c.call.type,
        members: c.members,
        ownCapabilities: c.own_capabilities,
        watching: data.watch,
        clientStore: this.writeableStateStore,
      });
      call.state.updateFromCallResponse(c.call);
      await call.applyDeviceConfig(c.call.settings, false);
      if (data.watch) {
        await call.setup();
        this.writeableStateStore.registerCall(call);
      }
      calls.push(call);
    }
    return {
      ...response,
      calls: calls,
    };
  };

  /**
   * Retrieve the list of available call statistics reports matching a particular condition.
   *
   * @param data Filter and sort conditions for retrieving available call report summaries.
   * @returns List with summary of available call reports matching the condition.
   */
  queryCallStats = async (data: QueryCallStatsRequest = {}) => {
    return this.streamClient.post<
      QueryCallStatsResponse,
      QueryCallStatsRequest
    >(`/call/stats`, data);
  };

  /**
   * Retrieve the list of available reports aggregated from the call stats.
   *
   * @param data Specify filter conditions like from and to (within last 30 days) and the report types
   * @returns Requested reports with (mostly) raw daily data for each report type requested
   */
  queryAggregateCallStats = async (
    data: QueryAggregateCallStatsRequest = {},
  ) => {
    return this.streamClient.post<
      QueryAggregateCallStatsResponse,
      QueryAggregateCallStatsRequest
    >(`/stats`, data);
  };

  /**
   * Returns a list of available data centers available for hosting calls.
   */
  edges = async () => {
    return this.streamClient.get<GetEdgesResponse>(`/edges`);
  };

  /**
   * addDevice - Adds a push device for a user.
   *
   * @param {string} id the device id
   * @param {string} push_provider the push provider name (eg. apn, firebase)
   * @param {string} push_provider_name user provided push provider name
   * @param {string} [userID] the user id (defaults to current user)
   * @param {boolean} [voip_token] enables use of VoIP token for push notifications on iOS platform
   */
  addDevice = async (
    id: string,
    push_provider: string,
    push_provider_name?: string,
    userID?: string,
    voip_token?: boolean,
  ) => {
    return await this.streamClient.post<CreateDeviceRequest>('/devices', {
      id,
      push_provider,
      voip_token,
      ...(userID != null ? { user_id: userID } : {}),
      ...(push_provider_name != null ? { push_provider_name } : {}),
    });
  };

  /**
   * addDevice - Adds a push device for a user.
   *
   * @param {string} id the device id
   * @param {string} push_provider the push provider name (eg. apn, firebase)
   * @param {string} push_provider_name user provided push provider name
   * @param {string} [userID] the user id (defaults to current user)
   */
  addVoipDevice = async (
    id: string,
    push_provider: string,
    push_provider_name: string,
    userID?: string,
  ) => {
    return await this.addDevice(
      id,
      push_provider,
      push_provider_name,
      userID,
      true,
    );
  };

  /**
   * getDevices - Returns the devices associated with a current user
   * @param {string} [userID] User ID. Only works on serverside
   */
  getDevices = async (userID?: string) => {
    return await this.streamClient.get<ListDevicesResponse>(
      '/devices',
      userID ? { user_id: userID } : {},
    );
  };

  /**
   * removeDevice - Removes the device with the given id.
   *
   * @param {string} id The device id
   * @param {string} [userID] The user id. Only specify this for serverside requests
   */
  removeDevice = async (id: string, userID?: string) => {
    return await this.streamClient.delete('/devices', {
      id,
      ...(userID ? { user_id: userID } : {}),
    });
  };

  /**
   * A callback that can be used to create ringing calls from push notifications. If the call already exists, it will do nothing.
   * @param call_cid
   * @returns
   */
  onRingingCall = async (call_cid: string) => {
    return withoutConcurrency(getCallInitConcurrencyTag(call_cid), async () => {
      // if we find the call and is already ringing, we don't need to create a new call
      // as client would have received the call.ring state because the app had WS alive when receiving push notifications
      let call = this.state.calls.find((c) => c.cid === call_cid && c.ringing);
      if (!call) {
        // if not it means that WS is not alive when receiving the push notifications and we need to fetch the call
        const [callType, callId] = call_cid.split(':');
        call = new Call({
          streamClient: this.streamClient,
          type: callType,
          id: callId,
          clientStore: this.writeableStateStore,
          ringing: true,
        });
        await call.get();
      }
      return call;
    });
  };

  /**
   * Connects the given anonymous user to the client.
   *
   * @param user the user to connect.
   * @param tokenOrProvider a token or a function that returns a token.
   */
  private connectAnonymousUser = async (
    user: UserWithId,
    tokenOrProvider: TokenOrProvider,
  ) => {
    return withoutConcurrency(this.connectionConcurrencyTag, () =>
      this.streamClient.connectAnonymousUser(user, tokenOrProvider),
    );
  };

  private shouldRejectCall = (currentCallId: string) => {
    if (!this.rejectCallWhenBusy) return false;

    const hasOngoingRingingCall = this.state.calls.some(
      (c) =>
        c.cid !== currentCallId &&
        c.ringing &&
        c.state.callingState !== CallingState.IDLE &&
        c.state.callingState !== CallingState.LEFT &&
        c.state.callingState !== CallingState.RECONNECTING_FAILED,
    );

    return hasOngoingRingingCall;
  };
}
