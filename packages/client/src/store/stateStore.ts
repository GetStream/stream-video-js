import { StateStore } from '@stream-io/state-store';
import { field, type Subscribable } from './subscribable';
import { type Patch, resolvePatch } from './patch';
import { Call } from '../Call';
import { CallingState } from './CallingState';
import type { OwnUserResponse } from '../gen/coordinator';
import { videoLoggerSystem } from '../logger';

/**
 * The shape of the client-level state.
 */
export type StreamVideoClientState = {
  /**
   * The user currently connected over WS to the coordinator, if any.
   */
  connectedUser: OwnUserResponse | undefined;

  /**
   * The {@link Call} objects created or tracked by this client.
   */
  calls: Call[];
};

const initialState = (): StreamVideoClientState => ({
  connectedUser: undefined,
  calls: [],
});

export class StreamVideoWriteableStateStore {
  /**
   * The backing store. Prefer the getters and setters below; this is exposed
   * for advanced use and for constructing derived state.
   */
  readonly store = new StateStore<StreamVideoClientState>(initialState());

  constructor() {
    this.store.subscribeWithSelector(
      (state) => [state.connectedUser] as const,
      ([user]) => {
        // leave all calls when the user disconnects
        if (user) return;
        const logger = videoLoggerSystem.getLogger('client-state');
        const leaveAllCalls = async () => {
          for (const call of this.calls) {
            if (call.state.callingState === CallingState.LEFT) continue;

            logger.info(`User disconnected, leaving call: ${call.cid}`);
            await call
              .leave({ message: 'client.disconnectUser() called' })
              .catch((err) => {
                logger.error(`Error leaving call: ${call.cid}`, err);
              });
          }
        };
        leaveAllCalls().catch((err) => {
          logger.error('Error while leaving calls on disconnect', err);
        });
      },
    );
  }

  /**
   * The currently connected user.
   */
  get connectedUser(): OwnUserResponse | undefined {
    return this.store.getLatestValue().connectedUser;
  }

  /**
   * Sets the currently connected user.
   *
   * @internal
   * @param user the user to set as connected.
   */
  setConnectedUser = (user: Patch<OwnUserResponse | undefined>) => {
    const connectedUser = resolvePatch(user, this.connectedUser);
    this.store.partialNext({ connectedUser });
    return connectedUser;
  };

  /**
   * A list of {@link Call} objects created/tracked by this client.
   */
  get calls(): Call[] {
    return this.store.getLatestValue().calls;
  }

  /**
   * Sets the list of {@link Call} objects created/tracked by this client.
   *
   * @param calls the calls to set.
   */
  setCalls = (calls: Patch<Call[]>) => {
    const next = resolvePatch(calls, this.calls);
    this.store.partialNext({ calls: next });
    return next;
  };

  /**
   * Adds a {@link Call} object to the list of {@link Call} objects created/tracked by this client.
   *
   * @param call the call to add.
   */
  registerCall = (call: Call) => {
    if (!this.calls.find((c) => c.cid === call.cid)) {
      this.setCalls((calls) => [...calls, call]);
    }
  };

  /**
   * Registers a {@link Call} object if it doesn't exist, otherwise updates it.
   *
   * @param call the call to register or update.
   */
  registerOrUpdateCall = (call: Call) => {
    if (this.calls.find((c) => c.cid === call.cid)) {
      return this.setCalls((calls) =>
        calls.map((c) => (c.cid === call.cid ? call : c)),
      );
    } else {
      return this.registerCall(call);
    }
  };

  /**
   * Removes a {@link Call} object from the list of {@link Call} objects created/tracked by this client.
   *
   * @param call the call to remove
   */
  unregisterCall = (call: Call) => {
    const logger = videoLoggerSystem.getLogger('client-state');
    logger.trace(`Unregistering call: ${call.cid}`);
    return this.setCalls((calls) => calls.filter((c) => c !== call));
  };

  /**
   * Finds a {@link Call} object in the list of {@link Call} objects created/tracked by this client.
   *
   * @param type the type of call to find.
   * @param id the id of the call to find.
   */
  findCall = (type: string, id: string) => {
    return this.calls.find((c) => c.type === type && c.id === id);
  };
}

/**
 * A reactive store exposing the client-level state variables.
 * You can subscribe to changes of the different state variables.
 */
export class StreamVideoReadOnlyStateStore {
  /**
   * The backing store, for reading several values in one subscription.
   */
  readonly store: StateStore<StreamVideoClientState>;

  /**
   * Data describing a user successfully connected over WS to coordinator server.
   */
  connectedUser$: Subscribable<OwnUserResponse | undefined>;

  /**
   * A list of {@link Call} objects created/tracked by this client.
   */
  calls$: Subscribable<Call[]>;

  constructor(store: StreamVideoWriteableStateStore) {
    this.store = store.store;
    this.connectedUser$ = field(this.store, 'connectedUser');
    this.calls$ = field(this.store, 'calls');
  }

  /**
   * The current user connected over WS to the backend.
   */
  get connectedUser(): OwnUserResponse | undefined {
    return this.store.getLatestValue().connectedUser;
  }

  /**
   * A list of {@link Call} objects created/tracked by this client.
   */
  get calls(): Call[] {
    return this.store.getLatestValue().calls;
  }
}
