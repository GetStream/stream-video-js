import { useObservableValue } from './helpers/useObservableValue';
import { useCallState } from './store';

/**
 * A hook which provides a list of all participants that have joined an active call.
 */
export const useParticipants = () => {
  const { participants$ } = useCallState();
  return useObservableValue(participants$);
};

/**
 * A hook which provides a StreamVideoLocalParticipant object.
 * It signals that I have joined a call.
 */
export const useLocalParticipant = () => {
  const { localParticipant$ } = useCallState();
  return useObservableValue(localParticipant$);
};

/**
 * A hook which provides a list of all other participants than me that have joined an active call.
 */
export const useRemoteParticipants = () => {
  const { remoteParticipants$ } = useCallState();
  return useObservableValue(remoteParticipants$);
};
