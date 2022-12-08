import { useObservableValue } from './helpers/useObservableValue';
import { useStore } from './store';

/**
 * A hook which provides a list of all participants that have joined an active call.
 */
export const useParticipants = () => {
  const { participants$ } = useStore();
  return useObservableValue(participants$);
};

/**
 * A hook which provides a StreamVideoLocalParticipant object.
 * It signals that I have joined a call.
 */
export const useLocalParticipant = () => {
  const { localParticipant$ } = useStore();
  return useObservableValue(localParticipant$);
};

/**
 * A hook which provides a list of all other participants than me that have joined an active call.
 */
export const useRemoteParticipants = () => {
  const { remoteParticipants$ } = useStore();
  return useObservableValue(remoteParticipants$);
};
