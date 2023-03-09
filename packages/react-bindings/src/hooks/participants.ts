import { useObservableValue } from './helpers/useObservableValue';
import { useCurrentCallState } from './store';

/**
 * A hook which provides a list of all participants that have joined an active call.
 */
export const useParticipants = () => {
  const { participants$ } = useCurrentCallState();
  return useObservableValue(participants$);
};

/**
 * A hook which provides a StreamVideoLocalParticipant object.
 * It signals that I have joined a call.
 */
export const useLocalParticipant = () => {
  const { localParticipant$ } = useCurrentCallState();
  return useObservableValue(localParticipant$);
};

/**
 * A hook which provides a list of all other participants than me that have joined an active call.
 */
export const useRemoteParticipants = () => {
  const { remoteParticipants$ } = useCurrentCallState();
  return useObservableValue(remoteParticipants$);
};
