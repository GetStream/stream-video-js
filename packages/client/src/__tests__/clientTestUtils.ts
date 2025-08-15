import { AllClientEvents } from '../coordinator/connection/types';
import { StreamVideoClient } from '../StreamVideoClient';
import { Call } from '../Call';
import { RxUtils } from '../store';

/**
 * Waits for a specified event to occur on the provided StreamVideoClient instance within a given timeout period.
 *
 * @template E - The type of event to wait for.
 * @param client - An instance of the StreamVideoClient where the event is expected to occur.
 * @param {E} eventName - The name of the event to wait for.
 * @param [timeout=2500] - The maximum time, in milliseconds, to wait for the event. Defaults to 2500ms.
 * @returns A promise that resolves with the event data if the event occurs within the timeout period, or rejects with an error if the timeout is reached.
 * @throws {Error} Throws an error if the event does not occur within the specified timeout.
 */
export const expectEvent = async <E extends keyof AllClientEvents>(
  client: StreamVideoClient,
  eventName: E,
  timeout: number = 2500,
): Promise<AllClientEvents[E]> => {
  return new Promise<AllClientEvents[E]>((resolve, reject) => {
    let timeoutId: NodeJS.Timeout | undefined = undefined;
    const off = client.on(eventName, (e) => {
      off();
      clearTimeout(timeoutId);
      resolve(e);
    });
    timeoutId = setTimeout(() => {
      off();
      reject(
        new Error(
          `Timeout waiting for event: ${eventName}, user_id: ${client.state.connectedUser?.id}`,
        ),
      );
    }, timeout);
  });
};

/**
 * Waits for a specific call to appear in the client's state and resolves with the call object.
 * If the call does not appear within the specified timeout, the promise is rejected with an error.
 *
 * @param client - The Stream Video client instance to monitor for calls.
 * @param cid - The unique identifier of the call to wait for.
 * @param [timeout=2500] - The timeout duration, in milliseconds, to wait for the call.
 * @returns A promise that resolves with the target call object or rejects if the call does not appear within the timeout.
 * @throws err an error if the timeout is exceeded without finding the specified call.
 */
export const expectCall = async (
  client: StreamVideoClient,
  cid: string,
  timeout: number = 2500,
) => {
  return new Promise<Call>((resolve, reject) => {
    let timeoutId: NodeJS.Timeout | undefined = undefined;
    const off = RxUtils.createSubscription(client.state.calls$, (calls) => {
      const call = calls.find((c) => c.cid === cid);
      if (call) {
        clearTimeout(timeoutId);
        resolve(call);
      }
    });
    timeoutId = setTimeout(() => {
      off();
      reject(
        new Error(
          `Timeout waiting for call: ${cid}, user_id: ${client.state.connectedUser?.id}`,
        ),
      );
    }, timeout);
  });
};
