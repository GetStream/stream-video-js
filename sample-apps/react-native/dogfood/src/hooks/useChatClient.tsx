import { useEffect, useRef, useState } from 'react';
import { OwnUserResponse, StreamChat, UserResponse } from 'stream-chat';
import { createToken } from '../modules/helpers/createToken';
import { useAppGlobalStoreValue } from '../contexts/AppContext';

export const useChatClient = ({
  userData,
}: {
  userData: OwnUserResponse | UserResponse;
}) => {
  const appEnvironment = useAppGlobalStoreValue(
    (store) => store.appEnvironment,
  );
  const [chatClient, setChatClient] = useState<StreamChat | undefined>();
  const disconnectRef = useRef(Promise.resolve());

  useEffect(() => {
    let connectPromise: Promise<void> | undefined;
    let client: StreamChat | undefined;
    const run = async () => {
      const fetchAuthDetails = async () => {
        return await createToken({ user_id: userData.id }, appEnvironment);
      };
      const { apiKey } = await fetchAuthDetails();
      const tokenProvider = () => fetchAuthDetails().then((auth) => auth.token);

      client = new StreamChat(apiKey);
      const connectUser = async () => {
        await disconnectRef.current;
        try {
          await client?.connectUser(userData, tokenProvider);
          console.log(`[Chat client]: Connected user: ${userData.id}`);
        } catch (e) {
          console.error('[Chat client]: Failed to establish connection', e);
        }
        if (!didUserConnectInterrupt) {
          setChatClient(client);
        }
      };
      connectPromise = connectUser();
    };

    run();

    let didUserConnectInterrupt = false;

    const cleanUp = async () => {
      didUserConnectInterrupt = true;
      await connectPromise;
      try {
        await client?.disconnectUser();
        console.log(`[Chat client]: Disconnected user: ${userData.id}`);
      } catch (e) {
        console.error('[Chat client]: Failed to disconnect', e);
      }
      setChatClient(undefined);
    };

    return () => {
      disconnectRef.current = cleanUp();
    };
  }, [userData, appEnvironment]);

  return chatClient;
};
