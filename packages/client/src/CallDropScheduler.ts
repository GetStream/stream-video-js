type DropFunction = (callCid: string) => Promise<void>;

export class CallDropScheduler {
  private autoCallDropSchedule: Record<string, ReturnType<typeof setTimeout>>;
  constructor(private reject: DropFunction, private cancel: DropFunction) {
    this.autoCallDropSchedule = {};
  }

  /**
   * Schedules automatic call cancellation.
   * The cancellation is intended for the scenarios, when the call has been rejected
   * or not accepted by all the call members.
   * @param {string} callCid
   * @param {number} [timeout] time in milliseconds, after which the call will be dropped
   */
  scheduleCancel = (callCid: string, timeout?: number) => {
    if (!timeout) return;
    this.autoCallDropSchedule[callCid] = setTimeout(() => {
      console.log('Automatic call cancellation after timeout', timeout);
      this.cancel(callCid);
    }, timeout);
  };

  /**
   * Schedules automatic call rejection.
   * @param {string} callCid
   * @param {number} [timeout] time in milliseconds, after which the call will be dropped
   */
  scheduleReject = (callCid: string, timeout?: number) => {
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
  cancelDrop = (callCid: string) => {
    if (this.autoCallDropSchedule[callCid]) {
      const { [callCid]: timeout, ...rest } = this.autoCallDropSchedule;
      if (timeout !== undefined) {
        console.log(`Cancelling automatic call drop, [callCID: ${callCid}]`);
        clearTimeout(timeout);
        this.autoCallDropSchedule = rest;
      }
    }
  };
}
