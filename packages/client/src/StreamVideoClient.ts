import {
  StreamVideoReadOnlyStateStore,
  StreamVideoWriteableStateStore,
} from './store';
import {
  CreateCallTypeRequest,
  CreateCallTypeResponse,
  CreateGuestRequest,
  CreateGuestResponse,
  DeviceFieldsRequest,
  GetCallTypeResponse,
  GetEdgesResponse,
  ListCallTypeResponse,
  ListDevicesResponse,
  QueryCallsRequest,
  QueryCallsResponse,
  SortParamRequest,
  UpdateCallTypeRequest,
  UpdateCallTypeResponse,
} from './gen/coordinator';
import { Call } from './rtc/Call';

import {
  watchCallAccepted,
  watchCallCancelled,
  watchCallRejected,
} from './events';
import {
  EventHandler,
  EventTypes,
  StreamClientOptions,
  StreamVideoEvent,
  TokenOrProvider,
  User,
} from './coordinator/connection/types';
import { StreamClient } from './coordinator/connection/client';
import { ReactNativePlatform } from './rtc/types';

/**
 * A `StreamVideoClient` instance lets you communicate with our API, and authenticate users.
 */
export class StreamVideoClient {
  /**
   * A reactive store that exposes all the state variables in a reactive manner - you can subscribe to changes of the different state variables. Our library is built in a way that all state changes are exposed in this store, so all UI changes in your application should be handled by subscribing to these variables.
   * @angular If you're using our Angular SDK, you shouldn't be interacting with the state store directly, instead, you should be using the [`StreamVideoService`](./StreamVideoService.md).
   */
  readonly readOnlyStateStore: StreamVideoReadOnlyStateStore;
  private readonly writeableStateStore: StreamVideoWriteableStateStore;
  streamClient: StreamClient;
  reactNativePlatform?: ReactNativePlatform;

  /**
   * You should create only one instance of `StreamVideoClient`.
   * @angular If you're using our Angular SDK, you shouldn't be calling the `constructor` directly, instead you should be using [`StreamVideoService`](./StreamVideoService.md/#init).
   * @param apiKey your Stream API key
   * @param opts the options for the client.
   */
  constructor(
    apiKey: string,
    opts?: StreamClientOptions,
    reactNativePlatform?: ReactNativePlatform,
  ) {
    this.streamClient = new StreamClient(apiKey, {
      // FIXME: OL: fix SSR.
      browser: true,
      persistUserOnConnectionFailure: true,
      ...opts,
    });
    this.reactNativePlatform = reactNativePlatform;

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

    // FIXME: OL: unregister the event listeners.
    this.on('call.created', (event: StreamVideoEvent) => {
      if (event.type !== 'call.created') return;
      const { call, members, ringing } = event;

      if (user.id === call.created_by.id) {
        console.warn('Received CallCreatedEvent sent by the current user');
        return;
      }

      this.writeableStateStore.setPendingCalls((pendingCalls) => [
        ...pendingCalls,
        new Call({
          streamClient: this.streamClient,
          type: call.type,
          id: call.id,
          metadata: call,
          members,
          ringing,
          clientStore: this.writeableStateStore,
          reactNativePlatform: this.reactNativePlatform,
        }),
      ]);
    });
    this.on('call.accepted', watchCallAccepted(this.writeableStateStore));
    this.on('call.rejected', watchCallRejected(this.writeableStateStore));
    this.on('call.ended', watchCallCancelled(this.writeableStateStore));

    this.writeableStateStore.setConnectedUser(user);

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
    this.writeableStateStore.pendingCalls.forEach((call) =>
      call.cancelScheduledDrop(),
    );
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
   * @param id the id of the call.
   */
  call = (type: string, id: string) => {
    return new Call({
      streamClient: this.streamClient,
      id,
      type,
      clientStore: this.writeableStateStore,
      reactNativePlatform: this.reactNativePlatform,
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

  queryCalls = async (
    filterConditions: { [key: string]: any },
    sort: Array<SortParamRequest>,
    limit?: number,
    next?: string,
    watch?: boolean,
  ) => {
    const data: QueryCallsRequest = {
      filter_conditions: filterConditions,
      sort: sort,
      limit: limit,
      next: next,
      watch,
    };
    if (data.watch) {
      await this.streamClient.connectionIdPromise;
    }
    const response = await this.streamClient.post<QueryCallsResponse>(
      '/calls',
      data,
    );
    const calls = response.calls.map(
      (c) =>
        new Call({
          streamClient: this.streamClient,
          id: c.call.id,
          type: c.call.type,
          metadata: c.call,
          members: c.members,
          clientStore: this.writeableStateStore,
          reactNativePlatform: this.reactNativePlatform,
        }),
    );
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
  async addDevice(
    id: string,
    push_provider: string,
    push_provider_name: string,
    userID?: string,
  ) {
    return await this.streamClient.post('/devices', {
      id,
      push_provider,
      ...(userID != null ? { user_id: userID } : {}),
      ...(push_provider_name != null ? { push_provider_name } : {}),
    });
  }

  /**
   * getDevices - Returns the devices associated with a current user
   * @param {string} [userID] User ID. Only works on serverside
   */
  async getDevices(userID?: string) {
    return await this.streamClient.get<ListDevicesResponse>(
      '/devices',
      userID ? { user_id: userID } : {},
    );
  }

  /**
   * removeDevice - Removes the device with the given id.
   *
   * @param {string} id The device id
   * @param {string} [userID] The user id. Only specify this for serverside requests
   *
   */
  async removeDevice(id: string, userID?: string) {
    return await this.streamClient.delete('/devices', {
      id,
      ...(userID ? { user_id: userID } : {}),
    });
  }

  /**
   * setDevice - Set the device info for the current client device to receive push
   * notification, the device will be sent via WS connection automatically
   */
  async setDevice(device: DeviceFieldsRequest) {
    this.streamClient.options.pushDevice = device;
    // if the connection already did authentication then we call the endpoint
    // directly
    if (this.streamClient.wsConnection?.authenticationSent) {
      return await this.addDevice(
        device.id,
        device.push_provider,
        device.push_provider_name,
      );
    }
  }
}
