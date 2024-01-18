import { Call } from './Call';
import { StreamClient } from './coordinator/connection/client';
import {
  StreamVideoReadOnlyStateStore,
  StreamVideoWriteableStateStore,
} from './store';
import type {
  ConnectedEvent,
  CreateDeviceRequest,
  CreateGuestRequest,
  CreateGuestResponse,
  GetEdgesResponse,
  ListDevicesResponse,
  QueryCallsRequest,
  QueryCallsResponse,
} from './gen/coordinator';
import {
  AllClientEvents,
  ClientEventListener,
  Logger,
  LogLevel,
  StreamClientOptions,
  TokenOrProvider,
  TokenProvider,
  User,
  UserWithId,
} from './coordinator/connection/types';
import { getLogger, logToConsole, setLogger } from './logger';
import { getSdkInfo } from './client-details';
import { SdkType } from './gen/video/sfu/models/models';

/**
 * A `StreamVideoClient` instance lets you communicate with our API, and authenticate users.
 */
export class StreamVideoClient {
  /**
   * A reactive store that exposes all the state variables in a reactive manner - you can subscribe to changes of the different state variables. Our library is built in a way that all state changes are exposed in this store, so all UI changes in your application should be handled by subscribing to these variables.
   */
  readonly readOnlyStateStore: StreamVideoReadOnlyStateStore;
  readonly logLevel: LogLevel = 'warn';
  readonly logger: Logger;

  protected readonly writeableStateStore: StreamVideoWriteableStateStore;
  streamClient: StreamClient;

  protected eventHandlersToUnregister: Array<() => void> = [];
  protected connectionPromise: Promise<void | ConnectedEvent> | undefined;
  protected disconnectionPromise: Promise<void> | undefined;

  /**
   * You should create only one instance of `StreamVideoClient`.
   */
  constructor(apiKey: string, opts?: StreamClientOptions);
  constructor(args: {
    apiKey: string;
    options?: StreamClientOptions;
    user?: User;
    token?: string;
    tokenProvider?: TokenProvider;
  });
  constructor(
    apiKeyOrArgs:
      | string
      | {
          apiKey: string;
          options?: StreamClientOptions;
          user?: User;
          token?: string;
          tokenProvider?: TokenProvider;
        },
    opts?: StreamClientOptions,
  ) {
    let logger: Logger = logToConsole;
    let logLevel: LogLevel = 'warn';
    if (typeof apiKeyOrArgs === 'string') {
      logLevel = opts?.logLevel || logLevel;
      logger = opts?.logger || logger;
    } else {
      logLevel = apiKeyOrArgs.options?.logLevel || logLevel;
      logger = apiKeyOrArgs.options?.logger || logger;
    }

    setLogger(logger, logLevel);
    this.logger = getLogger(['client']);

    if (typeof apiKeyOrArgs === 'string') {
      this.streamClient = new StreamClient(apiKeyOrArgs, {
        persistUserOnConnectionFailure: true,
        ...opts,
        logLevel,
        logger: this.logger,
      });
    } else {
      this.streamClient = new StreamClient(apiKeyOrArgs.apiKey, {
        persistUserOnConnectionFailure: true,
        ...apiKeyOrArgs.options,
        logLevel,
        logger: this.logger,
      });

      const sdkInfo = getSdkInfo();
      if (sdkInfo) {
        this.streamClient.setUserAgent(
          this.streamClient.getUserAgent() +
            `-video-${SdkType[sdkInfo.type].toLowerCase()}-sdk-${
              sdkInfo.major
            }.${sdkInfo.minor}.${sdkInfo.patch}`,
        );
      }
    }

    this.writeableStateStore = new StreamVideoWriteableStateStore();
    this.readOnlyStateStore = new StreamVideoReadOnlyStateStore(
      this.writeableStateStore,
    );

    if (typeof apiKeyOrArgs !== 'string') {
      const user = apiKeyOrArgs.user;
      const token = apiKeyOrArgs.token || apiKeyOrArgs.tokenProvider;
      if (user) {
        this.connectUser(user, token);
      }
    }
  }

  /**
   * Return the reactive state store, use this if you want to be notified about changes to the client state
   */
  get state() {
    return this.readOnlyStateStore;
  }

  /**
   * Connects the given user to the client.
   * Only one user can connect at a time, if you want to change users, call `disconnectUser` before connecting a new user.
   * If the connection is successful, the connected user [state variable](#readonlystatestore) will be updated accordingly.
   *
   * @param user the user to connect.
   * @param token a token or a function that returns a token.
   */
  async connectUser(
    user: User,
    token?: TokenOrProvider,
  ): Promise<void | ConnectedEvent> {
    if (user.type === 'anonymous') {
      user.id = '!anon';
      return this.connectAnonymousUser(user as UserWithId, token);
    }
    let connectUser = () => {
      return this.streamClient.connectUser(user, token);
    };
    if (user.type === 'guest') {
      connectUser = async () => {
        return this.streamClient.connectGuestUser(user);
      };
    }
    this.connectionPromise = this.disconnectionPromise
      ? this.disconnectionPromise.then(() => connectUser())
      : connectUser();

    this.connectionPromise?.finally(() => (this.connectionPromise = undefined));
    const connectUserResponse = await this.connectionPromise;
    // connectUserResponse will be void if connectUser called twice for the same user
    if (connectUserResponse?.me) {
      this.writeableStateStore.setConnectedUser(connectUserResponse.me);
    }

    this.eventHandlersToUnregister.push(
      this.on('connection.changed', (event) => {
        if (event.online) {
          const callsToReWatch = this.writeableStateStore.calls
            .filter((call) => call.watching)
            .map((call) => call.cid);

          this.logger(
            'info',
            `Rewatching calls after connection changed ${callsToReWatch.join(
              ', ',
            )}`,
          );
          if (callsToReWatch.length > 0) {
            this.queryCalls({
              watch: true,
              filter_conditions: {
                cid: { $in: callsToReWatch },
              },
              sort: [{ field: 'cid', direction: 1 }],
            }).catch((err) => {
              this.logger('error', 'Failed to re-watch calls', err);
            });
          }
        }
      }),
    );

    this.eventHandlersToUnregister.push(
      this.on('call.created', (event) => {
        const { call, members } = event;
        if (user.id === call.created_by.id) {
          this.logger(
            'warn',
            'Received `call.created` sent by the current user',
          );
          return;
        }

        this.logger('info', `New call created and registered: ${call.cid}`);
        const newCall = new Call({
          streamClient: this.streamClient,
          type: call.type,
          id: call.id,
          members,
          clientStore: this.writeableStateStore,
        });
        newCall.state.updateFromCallResponse(call);
        this.writeableStateStore.registerCall(newCall);
      }),
    );

    this.eventHandlersToUnregister.push(
      this.on('call.ring', async (event) => {
        const { call, members } = event;
        if (user.id === call.created_by.id) {
          this.logger(
            'debug',
            'Received `call.ring` sent by the current user so ignoring the event',
          );
          return;
        }

        // The call might already be tracked by the client,
        // if `call.created` was received before `call.ring`.
        // In that case, we cleanup the already tracked call.
        const prevCall = this.writeableStateStore.findCall(call.type, call.id);
        await prevCall?.leave();
        // we create a new call
        const theCall = new Call({
          streamClient: this.streamClient,
          type: call.type,
          id: call.id,
          members,
          clientStore: this.writeableStateStore,
          ringing: true,
        });
        theCall.state.updateFromCallResponse(call);
        // we fetch the latest metadata for the call from the server
        await theCall.get();
        this.writeableStateStore.registerCall(theCall);
      }),
    );

    return connectUserResponse;
  }

  /**
   * Disconnects the currently connected user from the client.
   *
   * If the connection is successfully disconnected, the connected user [state variable](#readonlystatestore) will be updated accordingly
   *
   * @param timeout Max number of ms, to wait for close event of websocket, before forcefully assuming successful disconnection.
   *                https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
   */
  disconnectUser = async (timeout?: number) => {
    if (!this.streamClient.user && !this.connectionPromise) {
      return;
    }
    const disconnectUser = () => this.streamClient.disconnectUser(timeout);
    this.disconnectionPromise = this.connectionPromise
      ? this.connectionPromise.then(() => disconnectUser())
      : disconnectUser();
    this.disconnectionPromise.finally(
      () => (this.disconnectionPromise = undefined),
    );
    await this.disconnectionPromise;
    this.eventHandlersToUnregister.forEach((unregister) => unregister());
    this.eventHandlersToUnregister = [];
    this.writeableStateStore.setConnectedUser(undefined);
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
   * @param id the id of the call, if not provided a unique random value is used
   */
  call = (type: string, id: string) => {
    return new Call({
      streamClient: this.streamClient,
      id: id,
      type: type,
      clientStore: this.writeableStateStore,
    });
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
    const calls = response.calls.map((c) => {
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
      call.applyDeviceConfig();
      if (data.watch) {
        this.writeableStateStore.registerCall(call);
      }
      return call;
    });
    return {
      ...response,
      calls: calls,
    };
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
  async addVoipDevice(
    id: string,
    push_provider: string,
    push_provider_name: string,
    userID?: string,
  ) {
    return await this.addDevice(
      id,
      push_provider,
      push_provider_name,
      userID,
      true,
    );
  }

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
    // if we find the call and is already ringing, we don't need to create a new call
    // as client would have received the call.ring state because the app had WS alive when receiving push notifications
    let call = this.readOnlyStateStore.calls.find(
      (c) => c.cid === call_cid && c.ringing,
    );
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
  };

  /**
   * Connects the given anonymous user to the client.
   *
   * @param user the user to connect.
   * @param tokenOrProvider a token or a function that returns a token.
   */
  protected connectAnonymousUser = async (
    user: UserWithId,
    tokenOrProvider: TokenOrProvider,
  ) => {
    const connectAnonymousUser = () =>
      this.streamClient.connectAnonymousUser(user, tokenOrProvider);
    this.connectionPromise = this.disconnectionPromise
      ? this.disconnectionPromise.then(() => connectAnonymousUser())
      : connectAnonymousUser();
    this.connectionPromise.finally(() => (this.connectionPromise = undefined));
    return this.connectionPromise;
  };
}
