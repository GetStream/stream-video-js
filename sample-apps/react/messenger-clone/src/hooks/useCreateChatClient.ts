import { useState, useEffect, useRef } from 'react';
import {
  ExtendableGenerics,
  DefaultGenerics,
  OwnUserResponse,
  UserResponse,
  TokenOrProvider,
  StreamChat,
} from 'stream-chat';

export const useCreateChatClient = <
  SCG extends ExtendableGenerics = DefaultGenerics,
>({
  apiKey,
  userData,
  tokenOrProvider,
}: {
  apiKey: string;
  userData: OwnUserResponse<SCG> | UserResponse<SCG>;
  tokenOrProvider: TokenOrProvider;
}) => {
  const [chatClient, setChatClient] = useState<StreamChat<SCG> | null>(null);
  const disconnectRef = useRef(Promise.resolve());

  useEffect(() => {
    const client = new StreamChat<SCG>(apiKey);
    const connectionPromise = disconnectRef.current.then(() =>
      client
        .connectUser(userData, tokenOrProvider)
        .then(() => setChatClient(client))
        .catch((err) => {
          console.error(`[Chat client]: Failed to establish connection`, err);
        }),
    );

    return () => {
      disconnectRef.current = connectionPromise
        .then(() => client.disconnectUser())
        .then(() => {
          console.log('[Chat client]: Connection closed');
        })
        .catch(() => {
          console.log('[Chat client]: Failed to disconnect');
        })
        .finally(() => setChatClient(null));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, userData.id, tokenOrProvider]);

  return chatClient;
};
