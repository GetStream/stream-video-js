import { BehaviorSubject, Observable } from 'rxjs';
import type { Patch } from './rxUtils';
import * as RxUtils from './rxUtils';
import { Call } from '../Call';
import { CallingState } from './CallingState';
import type { OwnUserResponse } from '../gen/coordinator';
import { videoLoggerSystem } from '../logger';

export class StreamVideoWriteableStateStore {
  /**
   * A store keeping data of a successfully connected user over WS to the coordinator server.
   */
  connectedUserSubject = new BehaviorSubject<OwnUserResponse | undefined>(
    undefined,
  );

  /**
   * A list of {@link Call} objects created/tracked by this client.
   */
  callsSubject = new BehaviorSubject<Call[]>([]);

  constructor() {
    this.connectedUserSubject.subscribe(async (user) => {
      // leave all calls when the user disconnects.
      if (!user) {
        const logger = videoLoggerSystem.getLogger('client-state');
        for (const call of this.calls) {
          if (call.state.callingState === CallingState.LEFT) continue;

          logger.info(`User disconnected, leaving call: ${call.cid}`);
          await call
            .leave({ message: 'client.disconnectUser() called' })
            .catch((err) => {
              logger.error(`Error leaving call: ${call.cid}`, err);
            });
        }
      }
    });
  }

  /**
   * The currently connected user.
   */
  get connectedUser(): OwnUserResponse | undefined {
    return RxUtils.getCurrentValue(this.connectedUserSubject);
  }

  /**
   * Sets the currently connected user.
   *
   * @internal
   * @param user the user to set as connected.
   */
  setConnectedUser = (user: Patch<OwnUserResponse | undefined>) => {
    return RxUtils.setCurrentValue(this.connectedUserSubject, user);
  };

  /**
   * A list of {@link Call} objects created/tracked by this client.
   */
  get calls(): Call[] {
    return RxUtils.getCurrentValue(this.callsSubject);
  }

  /**
   * Sets the list of {@link Call} objects created/tracked by this client.
   * @param calls
   */
  setCalls = (calls: Patch<Call[]>) => {
    return RxUtils.setCurrentValue(this.callsSubject, calls);
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
 * A reactive store that exposes state variables in a reactive manner.
 * You can subscribe to changes of the different state variables.
 * This central store contains all the state variables related to [`StreamVideoClient`](./StreamVideClient.md) and [`Call`](./Call.md).
 */
export class StreamVideoReadOnlyStateStore {
  /**
   * Data describing a user successfully connected over WS to coordinator server.
   */
  connectedUser$: Observable<OwnUserResponse | undefined>;

  /**
   * A list of {@link Call} objects created/tracked by this client.
   */
  calls$: Observable<Call[]>;

  constructor(store: StreamVideoWriteableStateStore) {
    // convert and expose subjects as observables
    this.connectedUser$ = store.connectedUserSubject.asObservable();
    this.calls$ = store.callsSubject.asObservable();
  }

  /**
   * The current user connected over WS to the backend.
   */
  get connectedUser(): OwnUserResponse | undefined {
    return RxUtils.getCurrentValue(this.connectedUser$);
  }

  /**
   * A list of {@link Call} objects created/tracked by this client.
   */
  get calls(): Call[] {
    return RxUtils.getCurrentValue(this.calls$);
  }
}
