import { useCall, useStreamVideoClient } from '../contexts';

/**
 * Utility hook which provides access to client's state store.
 */
export const useStore = () => {
  const client = useStreamVideoClient();
  if (!client) {
    throw new Error(
      `StreamVideoClient isn't initialized or this hook is called outside of <StreamVideo> context.`,
    );
  }
  return client.readOnlyStateStore;
};

/**
 * Utility hook which provides the current call's state.
 *
 * @category Call State
 */
export const useCallState = () => {
  const call = useCall();
  if (!call) {
    throw new Error(
      `Call isn't initialized or this hook is called outside of <StreamCallProvider> context.`,
    );
  }
  return call.state;
};
