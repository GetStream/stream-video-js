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

    const connectUser = async () => {
      await client.connectUser(userData, tokenProvider);
      if (!didUserConnectInterrupt) {
        setChatClient(client);
      }
    };

    let didUserConnectInterrupt = false;
    connectUser();

    const cleanUp = () => {
      didUserConnectInterrupt = true;
      setChatClient(null);
      client.disconnectUser();
    };

    return cleanUp;
  }, [apiKey, userData, tokenProvider]);

  return chatClient;
};
