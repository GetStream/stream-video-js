import { getCurrentValue, type Patch, setCurrentValue } from './rxUtils';
import { subject } from './subjects';
import type { Call } from '../Call';
import type { OwnUserResponse } from '../gen/coordinator';
import { videoLoggerSystem } from '../logger';

/**
 * Holds the state of the client, and the calls it created or tracks.
 * You can subscribe to the exposed observables to get notified about changes.
 */
export class ClientState {
  readonly logger = videoLoggerSystem.getLogger('ClientState');

  private connectedUserSubject = subject<OwnUserResponse>();
  private callsSubject = subject<Call[]>([]);

  /** Data describing a user successfully connected over WS to the coordinator. */
  connectedUser$ = this.connectedUserSubject.asObservable();

  /** A list of {@link Call} objects created/tracked by this client. */
  calls$ = this.callsSubject.asObservable();

  /** The currently connected user. */
  get connectedUser() {
    return getCurrentValue(this.connectedUserSubject);
  }

  /** A list of {@link Call} objects created/tracked by this client. */
  get calls() {
    return getCurrentValue(this.callsSubject);
  }

  /**
   * Sets the currently connected user.
   *
   * @internal
   * @param user the user to set as connected.
   */
  setConnectedUser = (user: Patch<OwnUserResponse | undefined>) => {
    return setCurrentValue(this.connectedUserSubject, user);
  };

  /**
   * Sets the list of {@link Call} objects created/tracked by this client.
   *
   * @internal
   * @param calls the calls to set.
   */
  setCalls = (calls: Patch<Call[]>) => {
    return setCurrentValue(this.callsSubject, calls);
  };

  /**
   * Adds a {@link Call} object to the list of calls tracked by this client.
   *
   * @internal
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
   * @internal
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
   * Removes a {@link Call} object from the list of calls tracked by this client.
   *
   * @internal
   * @param call the call to remove.
   */
  unregisterCall = (call: Call) => {
    this.logger.trace(`Unregistering call: ${call.cid}`);
    return this.setCalls((calls) => calls.filter((c) => c !== call));
  };

  /**
   * Finds a {@link Call} object in the list of calls tracked by this client.
   *
   * @param type the type of call to find.
   * @param id the id of the call to find.
   */
  findCall = (type: string, id: string) => {
    return this.calls.find((c) => c.type === type && c.id === id);
  };
}
