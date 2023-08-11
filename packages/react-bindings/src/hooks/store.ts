import { CallState, CameraManagerState } from '@stream-io/video-client';
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
  // return an empty and unlinked CallState object if there is no call in the provider
  // this ensures that the hooks always return a value and many null checks can be avoided
  if (!call) {
    const message =
      'You are using useCallState() outside a Call context. ' +
      'Please wrap your component in <StreamCallProvider /> and provide a non-null "call" instance.';
    console.warn(message);
    return new CallState();
  }
  return call.state;
};
