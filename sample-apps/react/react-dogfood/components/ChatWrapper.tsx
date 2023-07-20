import { PropsWithChildren } from 'react';
import { StreamChat } from 'stream-chat';
import { Chat } from 'stream-chat-react';

export const ChatWrapper = ({
  chatClient: client,
  children,
}: PropsWithChildren<{ chatClient?: StreamChat | null }>) => {
  if (!client) return <div>Loading Chat...</div>;

  return (
    <Chat theme="str-chat__theme-dark" client={client}>
      {children}
    </Chat>
  );
};
