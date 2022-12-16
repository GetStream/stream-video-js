import { useStore } from './store';
import { useObservableValue } from './helpers/useObservableValue';

export const useConnectedUser = () => {
  const { connectedUser$ } = useStore();
  return useObservableValue(connectedUser$);
};
