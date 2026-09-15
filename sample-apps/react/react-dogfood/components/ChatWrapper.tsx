import { PropsWithChildren } from 'react';
import { StreamChat } from 'stream-chat';
import { Chat } from 'stream-chat-react';
import { useAppI18n } from '../hooks/useAppI18n';

export const ChatWrapper = ({
  chatClient: client,
  children,
}: PropsWithChildren<{ chatClient?: StreamChat | null }>) => {
  const { t } = useAppI18n();
  if (!client) return <div>{t('chat.loading.text', 'Loading Chat...')}</div>;

  return (
    <Chat theme="str-chat__theme-dark" client={client}>
      {children}
    </Chat>
  );
};
