import { PropsWithChildren } from 'react';
import { StreamChat } from 'stream-chat';
import { Chat } from 'stream-chat-react';
import { useI18n } from '@stream-io/video-react-sdk';

export const ChatWrapper = ({
  chatClient: client,
  children,
}: PropsWithChildren<{ chatClient?: StreamChat | null }>) => {
  const { t } = useI18n();
  if (!client) return <div>{t('Loading Chat...')}</div>;

  return (
    <Chat theme="str-chat__theme-dark" client={client}>
      {children}
    </Chat>
  );
};
