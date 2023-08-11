import { useState, useEffect } from 'react';
import {
  ExtendableGenerics,
  DefaultGenerics,
  OwnUserResponse,
  UserResponse,
  TokenOrProvider,
  StreamChat,
} from 'stream-chat';

export type ConnectionError = {
  code: number;
  StatusCode: number;
  message: string;
  isWSFailure: boolean;
};

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
  const [connectionError, setConnectionError] = useState<
    ConnectionError | undefined
  >(undefined);

  useEffect(() => {
    const client = new StreamChat<SCG>(apiKey);

    let didUserConnectInterrupt = false;
    const connectionPromise = client
      .connectUser(userData, tokenOrProvider)
      .catch((e) => {
        didUserConnectInterrupt = true;
        setConnectionError(JSON.parse(e.message));
      })
      .then(() => {
        if (!didUserConnectInterrupt) setChatClient(client);
      })
      .catch(setConnectionError);

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

  return { chatClient, connectionError };
};
