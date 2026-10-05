import { PropsWithChildren } from 'react';
import { StreamChat } from 'stream-chat';
import { Chat } from 'stream-chat-react';
import { useAppI18n } from '../hooks/useAppI18n';
import { useSettings } from '../context/SettingsContext';
import { chatThemeClass } from '../hooks/useThemeMode';

export const ChatWrapper = ({
  chatClient: client,
  children,
}: PropsWithChildren<{ chatClient?: StreamChat | null }>) => {
  const { t } = useAppI18n();
  const {
    settings: { themeMode },
  } = useSettings();
  if (!client) return <div>{t('chat.loading.text', 'Loading Chat...')}</div>;

  return (
    <Chat theme={chatThemeClass(themeMode)} client={client}>
      {children}
    </Chat>
  );
};
