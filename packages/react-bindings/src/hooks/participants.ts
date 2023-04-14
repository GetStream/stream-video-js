import { useObservableValue } from './helpers/useObservableValue';
import { useCallState } from './store';
import type {
  Comparator,
  StreamVideoParticipant,
} from '@stream-io/video-client';

/**
 * A hook which provides a list of all participants that have joined an active call.
 *
 * @category Call State
 *
 * @param options.sortBy - A comparator function to sort the participants by.
 */
export const useParticipants = (options?: {
  sortBy?: Comparator<StreamVideoParticipant>;
}) => {
  const { participants$ } = useCallState();
  const participants = useObservableValue(participants$);
  if (options && options.sortBy) {
    return [...participants].sort(options.sortBy);
  }
  return participants;
};

/**
 * A hook which provides a StreamVideoLocalParticipant object.
 * It signals that I have joined a call.
 *
 * @category Call State
 */
export const useLocalParticipant = () => {
  const { localParticipant$ } = useCallState();
  return useObservableValue(localParticipant$);
};

/**
 * A hook which provides a list of all other participants than me that have joined an active call.
 *
 * @category Call State
 */
export const useRemoteParticipants = () => {
  const { remoteParticipants$ } = useCallState();
  return useObservableValue(remoteParticipants$);
};
