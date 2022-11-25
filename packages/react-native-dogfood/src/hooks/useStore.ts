import { useStreamVideoStoreValue } from '@stream-io/video-react-native-sdk';

export const useStore = () => {
  const client = useStreamVideoStoreValue((store) => store.videoClient);
  if (!client) {
    throw new Error("StreamVideoClient isn't initialized in the AppContext.");
  }

  return client.readOnlyStateStore;
};
