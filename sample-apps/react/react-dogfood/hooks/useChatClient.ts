import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ClientUser, StreamChat, TokenOrProvider } from 'stream-chat';
import { useAppEnvironment } from '../context/AppEnvironmentContext';

export const useCreateStreamChatClient = ({
  apiKey,
  userData,
  tokenOrProvider,
}: {
  apiKey: string | undefined;
  userData: ClientUser;
  tokenOrProvider: TokenOrProvider;
}) => {
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const router = useRouter();
  const environment = useAppEnvironment();
  useEffect(() => {
    const disableChat =
      router.query['disable_chat'] === 'true' ||
      process.env.NEXT_PUBLIC_DISABLE_CHAT === 'true';
    if (disableChat || !apiKey) return;

    const client = new StreamChat(apiKey, {
      client: { axiosRequestConfig: { timeout: 5000 } },
    });
    client.appIdentifier = { name: environment };

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
  }, [apiKey, router.query, userData.id, tokenOrProvider, environment]);

  return chatClient;
};
