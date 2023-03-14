import { BehaviorSubject, Observable } from 'rxjs';
import { combineLatestWith, map } from 'rxjs/operators';
import * as RxUtils from './rxUtils';
import { Call } from '../rtc/Call';
import type { User } from '../coordinator/connection/types';
import type { CallAcceptedEvent } from '../gen/coordinator';

export class StreamVideoWriteableStateStore {
  /**
   * A store keeping data of a successfully connected user over WS to the coordinator server.
   */
  connectedUserSubject = new BehaviorSubject<User | undefined>(undefined);
  /**
   * A store that keeps track of all created calls that have not been yet accepted, rejected nor cancelled.
   */
  pendingCallsSubject = new BehaviorSubject<Call[]>([]);
  /**
   * A list of objects describing incoming calls.
   */
  incomingCalls$: Observable<Call[]>;
  /**
   * A list of objects describing calls initiated by the current user (connectedUser).
   */
  outgoingCalls$: Observable<Call[]>;
  /**
   * A store that keeps track of all the notifications describing accepted call.
   */
  // todo: Currently not updating this Subject
  // FIXME OL: what is the difference (from customer perspective) between "activeCall" and "acceptedCall"?
  acceptedCallSubject = new BehaviorSubject<CallAcceptedEvent | undefined>(
    undefined,
  );
  /**
   * A store that keeps reference to a call controller instance.
   */
  activeCallSubject = new BehaviorSubject<Call | undefined>(undefined);

  constructor() {
    this.incomingCalls$ = this.pendingCallsSubject.pipe(
      combineLatestWith(this.connectedUserSubject),
      map(([pendingCalls, connectedUser]) =>
        pendingCalls.filter((call) => {
          const meta = call.state.getCurrentValue(call.state.metadata$);
          return meta?.created_by.id !== connectedUser?.id;
        }),
      ),
    );

    this.outgoingCalls$ = this.pendingCallsSubject.pipe(
      combineLatestWith(this.connectedUserSubject),
      map(([pendingCalls, connectedUser]) =>
        pendingCalls.filter((call) => {
          const meta = call.state.getCurrentValue(call.state.metadata$);
          return meta?.created_by.id === connectedUser?.id;
        }),
      ),
    );

    this.activeCallSubject.subscribe((activeCall) => {
      if (activeCall) {
        this.setCurrentValue(
          this.pendingCallsSubject,
          this.getCurrentValue(this.pendingCallsSubject).filter(
            (call) => call.cid !== activeCall.cid,
          ),
        );
        this.setCurrentValue(this.acceptedCallSubject, undefined);
        // this.setCurrentValue(this.callPermissionRequestSubject, undefined);
      } else {
        // this.setCurrentValue(this.callRecordingInProgressSubject, false);
        // this.setCurrentValue(this.participantsSubject, []);
        // this.setCurrentValue(this.callPermissionRequestSubject, undefined);
      }
    });
  }

  /**
   * Gets the current value of an observable, or undefined if the observable has
   * not emitted a value yet.
   *
   * @param observable$ the observable to get the value from.
   */
  getCurrentValue = RxUtils.getCurrentValue;

  /**
   * Updates the value of the provided Subject.
   * An `update` can either be a new value or a function which takes
   * the current value and returns a new value.
   *
   * @param subject the subject to update.
   * @param update the update to apply to the subject.
   * @return the updated value.
   */
  setCurrentValue = RxUtils.setCurrentValue;
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
  connectedUser$: Observable<User | undefined>;
  /**
   * A list of objects describing all created calls that have not been yet accepted, rejected nor cancelled.
   */
  pendingCalls$: Observable<Call[]>;
  /**
   * A list of objects describing calls initiated by the current user (connectedUser).
   */
  outgoingCalls$: Observable<Call[]>;
  /**
   * A list of objects describing incoming calls.
   */
  incomingCalls$: Observable<Call[]>;
  /**
   * The call data describing an incoming call accepted by a participant.
   * Serves as a flag decide, whether an incoming call should be joined.
   */
  acceptedCall$: Observable<CallAcceptedEvent | undefined>;
  /**
   * The call controller instance representing the call the user attends.
   * The controller instance exposes call metadata as well.
   * `activeCall$` will be set after calling [`join` on a `Call` instance](./Call.md/#join) and cleared after calling [`leave`](./Call.md/#leave).
   */
  activeCall$: Observable<Call | undefined>;

  /**
   * This method allows you the get the current value of a state variable.
   *
   * @param observable the observable to get the current value of.
   * @returns the current value of the observable.
   */
  getCurrentValue: <T>(observable: Observable<T>) => T;

  constructor(store: StreamVideoWriteableStateStore) {
    // convert and expose subjects as observables
    this.connectedUser$ = store.connectedUserSubject.asObservable();
    this.pendingCalls$ = store.pendingCallsSubject.asObservable();
    this.acceptedCall$ = store.acceptedCallSubject.asObservable();
    this.activeCall$ = store.activeCallSubject.asObservable();

    // re-expose observables
    this.incomingCalls$ = store.incomingCalls$;
    this.outgoingCalls$ = store.outgoingCalls$;

    // re-expose methods
    this.getCurrentValue = store.getCurrentValue;
  }
}
