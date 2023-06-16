import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const client = new StreamChat<SCG>(apiKey);

    if (!userData) {
      return;
    }

    let didUserConnectInterrupt = false;
    let connectionPromise = client
      .connectUser(userData, tokenProvider)
      .then(() => {
        if (!didUserConnectInterrupt) {
          setChatClient(client);
        }
      });

    return () => {
      didUserConnectInterrupt = true;
      setChatClient(null);
      connectionPromise
        .then(() => client.disconnectUser())
        .then(() => {
          console.log('Connection closed');
        });
    };
  }, [apiKey, userData, tokenProvider]);

  return chatClient;
};
