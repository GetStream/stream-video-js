import {useEffect, useState} from 'react';
import {StreamChat} from 'stream-chat';
import {StreamChatGenerics} from '../types';

export const useClient = <SCG extends StreamChatGenerics = StreamChatGenerics>({
  apiKey,
  userData,
  tokenOrProvider,
}: {
  apiKey: string;
  userData: {id: string};
  tokenOrProvider?: string;
}) => {
  const [chatClient, setChatClient] = useState<StreamChat<SCG> | null>(null);

  useEffect(() => {
    const client = new StreamChat<SCG>(apiKey);

    let didUserConnectInterrupt = false;
    let connectionPromise = client
      .connectUser(userData, tokenOrProvider)
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
          console.log('connection closed');
        });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, userData.id, tokenOrProvider]);

  return chatClient;
};
