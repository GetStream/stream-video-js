import { PropsWithChildren } from 'react';
import { StreamChat } from 'stream-chat';
import { Chat } from 'stream-chat-react';

export const ChatSidebar = ({
  client,
  children,
}: PropsWithChildren<{ client?: StreamChat }>) => {
  if (!client) return <div>Loading Chat...</div>;

  return <Chat client={client}>{children}</Chat>;
};
