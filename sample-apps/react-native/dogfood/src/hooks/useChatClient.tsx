import { useEffect, useRef, useState } from 'react';
import { StreamChat, OwnUserResponse, UserResponse } from 'stream-chat';
import { StreamChatGenerics } from '../../types';
import { createToken } from '../modules/helpers/createToken';

export const useChatClient = <
  SCG extends StreamChatGenerics = StreamChatGenerics,
>({
  userData,
}: {
  userData: OwnUserResponse<SCG> | UserResponse<SCG>;
}) => {
  const [chatClient, setChatClient] = useState<StreamChat<SCG> | undefined>();
  const disconnectRef = useRef(Promise.resolve());

  useEffect(() => {
    let connectPromise: Promise<void> | undefined;
    let client: StreamChat<SCG> | undefined;
    const run = async () => {
      const { token, apiKey } = await createToken({ user_id: userData.id });
      client = new StreamChat<SCG>(apiKey);
      const connectUser = async () => {
        await disconnectRef.current;
        try {
          await client?.connectUser(userData, token);
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
  }, [userData]);

  return chatClient;
};
