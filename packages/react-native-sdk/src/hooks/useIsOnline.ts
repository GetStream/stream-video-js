import { useNetInfo } from '@react-native-community/netinfo';

export const useIsOnline = () => {
  const netInfo = useNetInfo();
  const { isConnected, isInternetReachable } = netInfo;
  return isConnected !== false && isInternetReachable !== false;
};
