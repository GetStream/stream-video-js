import { useEffect, useState } from 'react';
import {
  OwnUserResponse,
  StreamChat,
  TokenOrProvider,
  UserResponse,
} from 'stream-chat';

export const useCreateStreamChatClient = ({
  apiKey,
  userData,
  tokenOrProvider,
}: {
  apiKey: string | undefined;
  userData: OwnUserResponse | UserResponse;
  tokenOrProvider: TokenOrProvider;
}) => {
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);

  useEffect(() => {
    const disableChat = process.env.NEXT_PUBLIC_DISABLE_CHAT === 'true';
    if (disableChat || !apiKey) return;

    const client = new StreamChat(apiKey, {
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
