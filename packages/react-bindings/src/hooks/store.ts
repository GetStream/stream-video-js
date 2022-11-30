import { useStreamVideoClient } from '../contexts';

export const useStore = () => {
  const client = useStreamVideoClient();
  if (!client) {
    throw new Error(
      `StreamVideoClient isn't initialized or this hook is called outside of <StreamVideo> context.`,
    );
  }
  return client.readOnlyStateStore2;
};
