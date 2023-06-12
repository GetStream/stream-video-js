import { BehaviorSubject, Observable } from 'rxjs';
import { combineLatestWith, map } from 'rxjs/operators';
import type { Patch } from './rxUtils';
import * as RxUtils from './rxUtils';
import { Call } from '../Call';
import type { OwnUserResponse } from '../coordinator/connection/types';
import { CallingState } from './CallState';

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

  /**
   * A list of objects describing incoming calls.
   * @deprecated derive from calls$ instead.
   */
  incomingCalls$: Observable<Call[]>;

  /**
   * A list of objects describing calls initiated by the current user (connectedUser).
   * @deprecated derive from calls$ instead.
   */
  outgoingCalls$: Observable<Call[]>;

  constructor() {
    this.connectedUserSubject.subscribe(async (user) => {
      // leave all calls when the user disconnects.
      if (!user) {
        for (const call of this.calls) {
          await call.leave();
        }
      }
    });

    this.incomingCalls$ = this.callsSubject.pipe(
      combineLatestWith(this.connectedUserSubject),
      map(([calls, connectedUser]) =>
        calls.filter((call) => {
          const { metadata, callingState } = call.state;
          return (
            metadata?.created_by.id !== connectedUser?.id &&
            callingState === CallingState.RINGING
          );
        }),
      ),
    );

    this.outgoingCalls$ = this.callsSubject.pipe(
      combineLatestWith(this.connectedUserSubject),
      map(([calls, connectedUser]) =>
        calls.filter((call) => {
          const { metadata, callingState } = call.state;
          return (
            metadata?.created_by.id === connectedUser?.id &&
            callingState === CallingState.RINGING
          );
        }),
      ),
    );
  }

  /**
   * Gets the current value of an observable, or undefined if the observable has
   * not emitted a value yet.
   *
   * @param observable$ the observable to get the value from.
   */
  private getCurrentValue = RxUtils.getCurrentValue;

  /**
   * Updates the value of the provided Subject.
   * An `update` can either be a new value or a function which takes
   * the current value and returns a new value.
   *
   * @param subject the subject to update.
   * @param update the update to apply to the subject.
   * @return the updated value.
   */
  private setCurrentValue = RxUtils.setCurrentValue;

  /**
   * The currently connected user.
   */
  get connectedUser(): OwnUserResponse | undefined {
    return this.getCurrentValue(this.connectedUserSubject);
  }

  /**
   * Sets the currently connected user.
   *
   * @internal
   * @param user the user to set as connected.
   */
  setConnectedUser = (user: Patch<OwnUserResponse | undefined>) => {
    return this.setCurrentValue(this.connectedUserSubject, user);
  };

  /**
   * A list of {@link Call} objects created/tracked by this client.
   */
  get calls(): Call[] {
    return this.getCurrentValue(this.callsSubject);
  }

  /**
   * Sets the list of {@link Call} objects created/tracked by this client.
   * @param calls
   */
  setCalls = (calls: Patch<Call[]>) => {
    return this.setCurrentValue(this.callsSubject, calls);
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

  /**
   * A list of objects describing incoming calls.
   * @deprecated derive from calls$ instead.
   */
  get incomingCalls(): Call[] {
    return this.getCurrentValue(this.incomingCalls$);
  }

  /**
   * A list of objects describing calls initiated by the current user.
   * @deprecated derive from calls$ instead.
   */
  get outgoingCalls(): Call[] {
    return this.getCurrentValue(this.outgoingCalls$);
  }
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

  /**
   * A list of objects describing calls initiated by the current user (connectedUser).
   * @deprecated derive from calls$ instead.
   */
  outgoingCalls$: Observable<Call[]>;

  /**
   * A list of objects describing incoming calls.
   * @deprecated derive from calls$ instead.
   */
  incomingCalls$: Observable<Call[]>;

  /**
   * This method allows you the get the current value of a state variable.
   *
   * @param observable the observable to get the current value of.
   * @returns the current value of the observable.
   */
  getCurrentValue = RxUtils.getCurrentValue;

  constructor(store: StreamVideoWriteableStateStore) {
    // convert and expose subjects as observables
    this.connectedUser$ = store.connectedUserSubject.asObservable();
    this.calls$ = store.callsSubject.asObservable();

    // re-expose observables
    this.incomingCalls$ = store.incomingCalls$;
    this.outgoingCalls$ = store.outgoingCalls$;
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

  /**
   * A list of objects describing incoming calls.
   * @deprecated derive from calls$ instead.
   */
  get incomingCalls(): Call[] {
    return RxUtils.getCurrentValue(this.incomingCalls$);
  }

  /**
   * A list of objects describing calls initiated by the current user.
   * @deprecated derive from calls$ instead.
   */
  get outgoingCalls(): Call[] {
    return RxUtils.getCurrentValue(this.outgoingCalls$);
  }
}
