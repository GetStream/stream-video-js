import { Call } from './Call';
import { StreamClient } from './coordinator/connection/client';
import {
  StreamVideoReadOnlyStateStore,
  StreamVideoWriteableStateStore,
} from './store';
import type {
  CreateCallTypeRequest,
  CreateCallTypeResponse,
  CreateDeviceRequest,
  CreateGuestRequest,
  CreateGuestResponse,
  GetCallTypeResponse,
  GetEdgesResponse,
  ListCallTypeResponse,
  ListDevicesResponse,
  QueryCallsRequest,
  QueryCallsResponse,
  UpdateCallTypeRequest,
  UpdateCallTypeResponse,
} from './gen/coordinator';
import type {
  ConnectionChangedEvent,
  EventHandler,
  EventTypes,
  StreamClientOptions,
  TokenOrProvider,
  User,
} from './coordinator/connection/types';

/**
 * A `StreamVideoClient` instance lets you communicate with our API, and authenticate users.
 */
export class StreamVideoClient {
  /**
   * A reactive store that exposes all the state variables in a reactive manner - you can subscribe to changes of the different state variables. Our library is built in a way that all state changes are exposed in this store, so all UI changes in your application should be handled by subscribing to these variables.
   */
  readonly readOnlyStateStore: StreamVideoReadOnlyStateStore;
  private readonly writeableStateStore: StreamVideoWriteableStateStore;
  streamClient: StreamClient;

  private eventHandlersToUnregister: Array<() => void> = [];

  /**
   * You should create only one instance of `StreamVideoClient`.
   * @param apiKey your Stream API key
   * @param opts the options for the client.
   */
  constructor(apiKey: string, opts?: StreamClientOptions) {
    this.streamClient = new StreamClient(apiKey, {
      persistUserOnConnectionFailure: true,
      ...opts,
    });

    this.writeableStateStore = new StreamVideoWriteableStateStore();
    this.readOnlyStateStore = new StreamVideoReadOnlyStateStore(
      this.writeableStateStore,
    );
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
    const connectUserResponse = await this.streamClient.connectUser(
      // @ts-expect-error
      user,
      tokenOrProvider,
    );
    this.writeableStateStore.setConnectedUser(user);

    this.eventHandlersToUnregister.push(
      this.on('connection.changed', (e) => {
        const event = e as ConnectionChangedEvent;
        if (event.online) {
          const callsToReWatch = this.writeableStateStore.calls
            .filter((call) => call.watching)
            .map((call) => call.cid);

          if (callsToReWatch.length > 0) {
            this.queryCalls({
              watch: true,
              filter_conditions: {
                cid: { $in: callsToReWatch },
              },
              sort: [{ field: 'cid', direction: 1 }],
            }).catch((err) => {
              console.warn('Failed to re-watch calls', err);
            });
          }
        }
      }),
    );

    this.eventHandlersToUnregister.push(
      this.on('call.created', (event) => {
        if (event.type !== 'call.created') return;
        const { call, members } = event;
        if (user.id === call.created_by.id) {
          console.warn('Received `call.created` sent by the current user');
          return;
        }

        this.writeableStateStore.registerCall(
          new Call({
            streamClient: this.streamClient,
            type: call.type,
            id: call.id,
            metadata: call,
            members,
            clientStore: this.writeableStateStore,
          }),
        );
      }),
    );

    this.eventHandlersToUnregister.push(
      this.on('call.ring', async (event) => {
        if (event.type !== 'call.ring') return;
        const { call, members } = event;
        if (user.id === call.created_by.id) {
          console.warn('Received `call.ring` sent by the current user');
          return;
        }

        // The call might already be tracked by the client,
        // if `call.created` was received before `call.ring`.
        // In that case, we just reuse the already tracked call.
        let theCall = this.writeableStateStore.findCall(call.type, call.id);
        if (!theCall) {
          // otherwise, we create a new call
          theCall = new Call({
            streamClient: this.streamClient,
            type: call.type,
            id: call.id,
            members,
            clientStore: this.writeableStateStore,
            ringing: true,
          });
        }

        // we fetch the latest metadata for the call from the server
        await theCall.get({ ring: true });
        this.writeableStateStore.registerCall(theCall);
      }),
    );

    return connectUserResponse;
  };

  /**
   * Connects the given anonymous user to the client.
   *
   * @param user the user to connect.
   * @param tokenOrProvider a token or a function that returns a token.
   */
  connectAnonymousUser = async (
    user: User,
    tokenOrProvider: TokenOrProvider,
  ) => {
    // @ts-expect-error
    return this.streamClient.connectAnonymousUser(user, tokenOrProvider);
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
    await this.streamClient.disconnectUser(timeout);
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
  on = (eventName: EventTypes, callback: EventHandler) => {
    return this.streamClient.on(eventName, callback);
  };

  /**
   * Remove subscription for WebSocket events that were created by the `on` method.
   *
   * @param event the event name.
   * @param callback the callback which was passed to the `on` method.
   */
  off = (event: string, callback: EventHandler) => {
    return this.streamClient.off(event, callback);
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
    return this.streamClient.post<CreateGuestResponse, CreateGuestRequest>(
      '/guest',
      data,
    );
  };

  /**
   * Will query the API for calls matching the given filters.
   *
   * @param data the query data.
   */
  queryCalls = async (data: QueryCallsRequest) => {
    if (data.watch) await this.streamClient.connectionIdPromise;
    const response = await this.streamClient.post<
      QueryCallsResponse,
      QueryCallsRequest
    >('/calls', data);
    const calls = response.calls.map((c) => {
      const call = new Call({
        streamClient: this.streamClient,
        id: c.call.id,
        type: c.call.type,
        metadata: c.call,
        members: c.members,
        ownCapabilities: c.own_capabilities,
        watching: data.watch,
        clientStore: this.writeableStateStore,
      });
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

  queryUsers = async () => {
    console.log('Querying users is not implemented yet.');
  };

  edges = async () => {
    return this.streamClient.get<GetEdgesResponse>(`/edges`);
  };

  // server-side only endpoints
  createCallType = async (data: CreateCallTypeRequest) => {
    return this.streamClient.post<CreateCallTypeResponse>(`/calltypes`, data);
  };

  getCallType = async (name: string) => {
    return this.streamClient.get<GetCallTypeResponse>(`/calltypes/${name}`);
  };

  updateCallType = async (name: string, data: UpdateCallTypeRequest) => {
    return this.streamClient.put<UpdateCallTypeResponse>(
      `/calltypes/${name}`,
      data,
    );
  };

  deleteCallType = async (name: string) => {
    return this.streamClient.delete(`/calltypes/${name}`);
  };

  listCallTypes = async () => {
    return this.streamClient.get<ListCallTypeResponse>(`/calltypes`);
  };

  /**
   * addDevice - Adds a push device for a user.
   *
   * @param {string} id the device id
   * @param {string} push_provider the push provider name (eg. apn, firebase)
   * @param {string} push_provider_name user provided push provider name
   * @param {string} [userID] the user id (defaults to current user)
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
   *
   */
  removeDevice = async (id: string, userID?: string) => {
    return await this.streamClient.delete('/devices', {
      id,
      ...(userID ? { user_id: userID } : {}),
    });
  };

  /**
   * createToken - Creates a token to authenticate this user. This function is used server side.
   * The resulting token should be passed to the client side when the users registers or logs in.
   *
   * @param {string} userID The User ID
   * @param {number} [exp] The expiration time for the token expressed in the number of seconds since the epoch
   *
   * @return {string} Returns a token
   */
  createToken(userID: string, exp?: number, iat?: number) {
    return this.streamClient.createToken(userID, exp, iat);
  }
}
