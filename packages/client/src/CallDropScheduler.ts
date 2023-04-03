import { StreamVideoWriteableStateStore } from './store';
import { CallConfig } from './config';
import { Observable, pairwise, startWith, Subscription } from 'rxjs';
import { Call } from './rtc/Call';

type CallId = string;

export class CallDropScheduler {
  private autoCallDropSchedule: Record<CallId, ReturnType<typeof setTimeout>>;
  private storeSubscriptions: { [key in keyof CallConfig]?: Subscription } & {
    cancelDropOnPendingCallRemoval?: Subscription;
    cancelDropOnCallAccepted?: Subscription;
  };
  private pairwisePendingCalls$: Observable<Call[][]>;
  private pairwiseIncomingCalls$: Observable<Call[][]>;
  private pairwiseOutgoingCalls$: Observable<Call[][]>;
  constructor(
    private store: StreamVideoWriteableStateStore,
    private callConfig: CallConfig,
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

  private static getLatestCall = (from: Call[], compareTo: Call[]) => {
    return from > compareTo ? from.slice(-1)[0] : undefined;
  };
  private startAutoRejectWhenInCall = () => {
    if (!this.callConfig.autoRejectWhenInCall) return;

    this.storeSubscriptions.autoRejectWhenInCall =
      this.pairwiseIncomingCalls$.subscribe(
        async ([prevCalls, currentCalls]) => {
          const newIncomingCall = CallDropScheduler.getLatestCall(
            currentCalls,
            prevCalls,
          );

          if (!newIncomingCall) return;

          const activeCall = this.store.getCurrentValue(
            this.store.activeCallSubject,
          );

          if (activeCall) {
            await newIncomingCall.reject();
          }
        },
      );
  };

  private scheduleRejectAfterTimeout = () => {
    const { autoRejectTimeoutInMs } = this.callConfig;
    if (typeof autoRejectTimeoutInMs !== 'number' || autoRejectTimeoutInMs < 0)
      return;

    this.storeSubscriptions.autoRejectTimeoutInMs =
      this.pairwiseIncomingCalls$.subscribe(([prevCalls, currentCalls]) => {
        const newIncomingCall = CallDropScheduler.getLatestCall(
          currentCalls,
          prevCalls,
        );
        if (!newIncomingCall) return;

        const activeCall = this.store.getCurrentValue(
          this.store.activeCallSubject,
        );
        const incomingCallRejectedImmediately =
          activeCall && this.callConfig.autoRejectWhenInCall;
        if (incomingCallRejectedImmediately) return;

        this.scheduleReject(newIncomingCall);
      });
  };

  private scheduleCancelAfterTimeout = () => {
    const { autoCancelTimeoutInMs } = this.callConfig;
    if (typeof autoCancelTimeoutInMs !== 'number' || autoCancelTimeoutInMs < 0)
      return;

    this.storeSubscriptions.autoCancelTimeoutInMs =
      this.pairwiseOutgoingCalls$.subscribe(([prevCalls, currentCalls]) => {
        const newOutgoingCall = CallDropScheduler.getLatestCall(
          currentCalls,
          prevCalls,
        );

        if (!newOutgoingCall) return;
        this.scheduleCancel(newOutgoingCall);
      });
  };

  private startCancellingDrops = () => {
    this.storeSubscriptions.cancelDropOnPendingCallRemoval =
      this.pairwisePendingCalls$.subscribe(([prevCalls, currentCalls]) => {
        const removedCall = CallDropScheduler.getLatestCall(
          prevCalls,
          currentCalls,
        );

        if (removedCall) {
          this.cancelDrop(removedCall.id);
        }
      });

    this.storeSubscriptions.cancelDropOnCallAccepted =
      this.store.acceptedCallSubject.subscribe((acceptedCall) => {
        if (acceptedCall) {
          const id = acceptedCall.call_cid.split(':')[1];
          this.cancelDrop(id);
        }
      });
  };

  /**
   * Schedules automatic call cancellation.
   * The cancellation is intended for the scenarios, when the call has been rejected
   * or not accepted by all the call members.
   */
  private scheduleCancel = (call: Call) => {
    const timeout = this.callConfig.autoCancelTimeoutInMs;
    if (!timeout) return;
    this.autoCallDropSchedule[call.id] = setTimeout(() => {
      console.log('Automatic call cancellation after timeout', timeout);
      call.cancel();
    }, timeout);
  };

  /**
   * Schedules automatic call rejection.
   * @param {string} callId
   * @param {string} callType
   */
  private scheduleReject = (call: Call) => {
    const timeout = this.callConfig.autoRejectTimeoutInMs;
    if (!timeout) return;
    this.autoCallDropSchedule[call.id] = setTimeout(() => {
      console.log('Automatic call rejection after timeout', timeout);
      call.reject();
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
  private cancelDrop = (callId: string) => {
    const { [callId]: timeoutRef, ...rest } = this.autoCallDropSchedule;
    if (timeoutRef !== undefined) {
      console.log(`Cancelling automatic call drop, [callID: ${callId}]`);
      clearTimeout(timeoutRef);
      this.autoCallDropSchedule = rest;
    }
  };

  cleanUp = () => {
    Object.values(this.autoCallDropSchedule).forEach((timeoutRef) =>
      clearTimeout(timeoutRef),
    );
    this.autoCallDropSchedule = {};
    Object.values(this.storeSubscriptions).forEach((subscription) =>
      subscription.unsubscribe(),
    );
  };
}
