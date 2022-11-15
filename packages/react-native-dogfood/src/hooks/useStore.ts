import { useAppGlobalStoreValue } from '../contexts/AppContext';

export const useStore = () => {
  const client = useAppGlobalStoreValue((store) => store.videoClient);
  if (!client) {
    throw new Error("StreamVideoClient isn't initialized in the AppContext.");
  }

  return client.readOnlyStateStore;
};
