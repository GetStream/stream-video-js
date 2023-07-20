import { useEffect, useRef, useState } from 'react';
import {
  StreamChat,
  OwnUserResponse,
  UserResponse,
  TokenOrProvider,
} from 'stream-chat';
import { StreamChatGenerics } from '../../types';

export const useChatClient = <
  SCG extends StreamChatGenerics = StreamChatGenerics,
>({
  apiKey,
  userData,
  tokenProvider,
}: {
  apiKey: string;
  userData?: OwnUserResponse<SCG> | UserResponse<SCG>;
  tokenProvider?: TokenOrProvider;
}) => {
  const [chatClient, setChatClient] = useState<StreamChat<SCG> | null>(null);
  const disconnectRef = useRef(Promise.resolve());

  useEffect(() => {
    if (!userData) {
      return;
    }

    const client = new StreamChat<SCG>('6nv2d7gtd67u');
    const connectUser = async () => {
      await disconnectRef.current;
      try {
        console.log(userData, tokenProvider);
        await client.connectUser(userData, tokenProvider);
        console.log(`[Chat client]: Connected user: ${userData.id}`);
      } catch (e) {
        console.error('[Chat client]: Failed to establish connection', e);
      }
      if (!didUserConnectInterrupt) {
        setChatClient(client);
      }
    };

    let didUserConnectInterrupt = false;
    const connectPromise = connectUser();

    const cleanUp = async () => {
      setChatClient(null);
      didUserConnectInterrupt = true;
      await connectPromise;
      try {
        await client.disconnectUser();
        console.log(`[Chat client]: Disconnected user: ${userData.id}`);
      } catch (e) {
        console.error('[Chat client]: Failed to disconnect', e);
      }
    };

    return () => {
      disconnectRef.current = cleanUp();
    };
  }, [apiKey, userData, tokenProvider]);

  return chatClient;
};
