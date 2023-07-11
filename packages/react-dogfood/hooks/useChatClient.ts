import { useEffect, useState } from 'react';
import {
  DefaultGenerics,
  ExtendableGenerics,
  OwnUserResponse,
  StreamChat,
  TokenOrProvider,
  UserResponse,
} from 'stream-chat';

export const useCreateStreamChatClient = <
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

  const disableChat = process.env.NEXT_PUBLIC_DISABLE_CHAT === 'true';
  useEffect(() => {
    if (disableChat) return;

    const client = new StreamChat<SCG>(apiKey, {
      timeout: 5000,
    });

    let didUserConnectInterrupt = false;
    const connectionPromise = client
      .connectUser(userData, tokenOrProvider)
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
  }, [apiKey, userData.id, tokenOrProvider]);

  return chatClient;
};
