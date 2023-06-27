import { useState, useEffect } from 'react';
import {
  ExtendableGenerics,
  DefaultGenerics,
  OwnUserResponse,
  UserResponse,
  TokenOrProvider,
  StreamChat,
} from 'stream-chat';

export const useChatClient = <
  SCG extends ExtendableGenerics = DefaultGenerics,
>({
  apiKey,
  user,
  tokenOrProvider,
}: {
  apiKey: string;
  user: OwnUserResponse<SCG> | UserResponse<SCG>;
  tokenOrProvider: TokenOrProvider;
}) => {
  const [chatClient, setChatClient] = useState<StreamChat<SCG> | null>(null);

  useEffect(() => {
    const client = new StreamChat<SCG>(apiKey);

    let didUserConnectInterrupt = false;
    const connectionPromise = client
      .connectUser(user, tokenOrProvider)
      .then(() => {
        if (!didUserConnectInterrupt) setChatClient(client);
      });

    return () => {
      didUserConnectInterrupt = true;
      setChatClient(null);
      connectionPromise
        .then(() => client.disconnectUser())
        .then(() => {
          console.log('connection closed');
        });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, user.id, tokenOrProvider]);

  return chatClient;
};
