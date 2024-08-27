import { useStreamVideoClient } from '../contexts';
import { useObservableValue } from './useObservableValue';

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
  return client.state;
};

/**
 * Utility hook which provides a list of all notifications about created calls.
 * In the ring call settings, these calls can be outgoing (I have called somebody)
 * or incoming (somebody has called me).
 *
 * @category Client State
 */
export const useCalls = () => {
  const { calls$ } = useStore();
  return useObservableValue(calls$);
};

/**
 * Returns the current connected user.
 *
 * @category Client State
 */
export const useConnectedUser = () => {
  const { connectedUser$ } = useStore();
  return useObservableValue(connectedUser$);
};
