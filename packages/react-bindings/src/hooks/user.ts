import { useStore } from './store';
import { useObservableValue } from './helpers/useObservableValue';

/**
 *
 * @returns
 *
 * @category Client State
 */
export const useConnectedUser = () => {
  const { connectedUser$ } = useStore();
  return useObservableValue(connectedUser$);
};
