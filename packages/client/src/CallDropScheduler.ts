import { CallCID, PendingCall, StreamVideoWriteableStateStore } from './store';
import { CallConfig } from './config/types';
import { Observable, pairwise, startWith, Subscription } from 'rxjs';

type DropFunction = (callCid: CallCID) => Promise<void>;

export class CallDropScheduler {
  private autoCallDropSchedule: Record<CallCID, ReturnType<typeof setTimeout>>;
  private storeSubscriptions: { [key in keyof CallConfig]?: Subscription } & {
    cancelDropOnPendingCallRemoval?: Subscription;
    cancelDropOnCallAccepted?: Subscription;
  };
  private pairwisePendingCalls$: Observable<PendingCall[][]>;
  private pairwiseIncomingCalls$: Observable<PendingCall[][]>;
  private pairwiseOutgoingCalls$: Observable<PendingCall[][]>;
  constructor(
    private store: StreamVideoWriteableStateStore,
    private callConfig: CallConfig,
    private reject: DropFunction,
    private cancel: DropFunction,
  ) {
    this.pairwisePendingCalls$ = store.pendingCallsSubject.pipe(
      startWith([]),
      pairwise(),
    );
    this.pairwiseIncomingCalls$ = store.incomingCalls$.pipe(
      startWith([]),
      pairwise(),
    );
    this.pairwiseOutgoingCalls$ = store.outgoingCalls$.pipe(
      startWith([]),
      pairwise(),
    );

    this.autoCallDropSchedule = {};
    this.storeSubscriptions = {};

    this.startAutoRejectWhenInCall();
    this.scheduleRejectAfterTimeout();
    this.scheduleCancelAfterTimeout();
    this.startCancellingDrops();
  }
  private startAutoRejectWhenInCall = () => {
    if (!this.callConfig.autoRejectWhenInCall) return;

    this.storeSubscriptions.autoRejectWhenInCall =
      this.pairwiseIncomingCalls$.subscribe(
        async ([prevCalls, currentCalls]) => {
          const newIncomingCall =
            currentCalls.length > prevCalls.length
              ? currentCalls.slice(-1)[0]
              : undefined;
          if (!newIncomingCall) return;

          const activeCall = this.store.getCurrentValue(
            this.store.activeCallSubject,
          );

          if (activeCall && newIncomingCall?.call?.callCid) {
            await this.reject(newIncomingCall.call?.callCid);
          }
        },
      );
  };

  private scheduleRejectAfterTimeout = () => {
    if (!this.callConfig.autoRejectTimeoutInMs) return;

    this.storeSubscriptions.autoRejectTimeoutInMs =
      this.pairwiseIncomingCalls$.subscribe(([prevCalls, currentCalls]) => {
        const newIncomingCall =
          currentCalls.length > prevCalls.length
            ? currentCalls.slice(-1)[0]
            : undefined;

        const activeCall = this.store.getCurrentValue(
          this.store.activeCallSubject,
        );
        const incomingCallRejectedImmediately =
          activeCall && this.callConfig.autoRejectWhenInCall;

        if (!newIncomingCall?.call?.callCid) return;
        if (incomingCallRejectedImmediately) return;

        this.scheduleReject(newIncomingCall.call.callCid);
      });
  };

  private scheduleCancelAfterTimeout = () => {
    if (!this.callConfig.autoCancelTimeoutInMs) return;
    this.storeSubscriptions.autoCancelTimeoutInMs =
      this.pairwiseOutgoingCalls$.subscribe(([prevCalls, currentCalls]) => {
        const newOutgoingCall =
          currentCalls.length > prevCalls.length
            ? currentCalls.slice(-1)[0]
            : undefined;
        if (!newOutgoingCall?.call?.callCid) return;
        this.scheduleCancel(newOutgoingCall.call.callCid);
      });
  };

  private startCancellingDrops = () => {
    this.storeSubscriptions.cancelDropOnPendingCallRemoval =
      this.pairwisePendingCalls$.subscribe(([prevCalls, currentCalls]) => {
        const removedCall =
          prevCalls.length > currentCalls.length
            ? prevCalls.slice(-1)[0]
            : undefined;
        if (removedCall?.call?.callCid) {
          this.cancelDrop(removedCall?.call?.callCid);
        }
      });

    this.storeSubscriptions.cancelDropOnCallAccepted =
      this.store.acceptedCallSubject.subscribe((acceptedCall) => {
        if (acceptedCall?.call?.callCid)
          this.cancelDrop(acceptedCall.call.callCid);
      });
  };

  /**
   * Schedules automatic call cancellation.
   * The cancellation is intended for the scenarios, when the call has been rejected
   * or not accepted by all the call members.
   * @param {string} callCid
   */
  private scheduleCancel = (callCid: string) => {
    const timeout = this.callConfig.autoCancelTimeoutInMs;
    if (!timeout) return;
    this.autoCallDropSchedule[callCid] = setTimeout(() => {
      console.log('Automatic call cancellation after timeout', timeout);
      this.cancel(callCid);
    }, timeout);
  };

  /**
   * Schedules automatic call rejection.
   * @param {string} callCid
   */
  private scheduleReject = (callCid: string) => {
    const timeout = this.callConfig.autoRejectTimeoutInMs;
    if (!timeout) return;
    this.autoCallDropSchedule[callCid] = setTimeout(() => {
      console.log('Automatic call rejection after timeout', timeout);
      this.reject(callCid);
    }, timeout);
  };

  /**
   * Cancels the automatic call drop (rejection of an incoming call / cancellation of an outgoing call).
   * Indented for the scenario, when:
   * - an incoming call has been cancelled
   * - an outgoing call has been accepted by at least one member
   * - an outgoing call has been rejected / left by all the members resp. participants
   * - a call has been cancelled / rejected / accepted manually before the cancellation timeout expires.
   */
  private cancelDrop = (callCid: string) => {
    const { [callCid]: timeoutRef, ...rest } = this.autoCallDropSchedule;
    if (timeoutRef !== undefined) {
      console.log(`Cancelling automatic call drop, [callCID: ${callCid}]`);
      clearTimeout(timeoutRef);
      this.autoCallDropSchedule = rest;
    }
  };

  cleanUp = () => {
    this.autoCallDropSchedule = {};
    Object.values(this.storeSubscriptions).forEach((subscription) =>
      subscription.unsubscribe(),
    );
  };
}
