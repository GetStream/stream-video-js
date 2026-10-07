import { useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Channel,
  MessageComposer,
  useChannelStateContext,
  useChatContext,
  VirtualizedMessageList,
  Window,
  WithComponents,
} from 'stream-chat-react';

import { Icon, IconButton } from '@stream-io/video-react-sdk';

import { CHANNEL_TYPE } from '.';
import { useAppI18n } from '../hooks/useAppI18n';

const NoMessages = () => {
  const { messages } = useChannelStateContext();
  const { t } = useAppI18n();

  if (messages?.length === 0) {
    return (
      <div className="rd__chat__no-messages">
        <svg
          className="rd__chat__no-messages__icon"
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M9.99125 26.3888C12.5119 27.8476 15.4771 28.34 18.334 27.7741C21.1909 27.2081 23.7444 25.6226 25.5186 23.3129C27.2928 21.0033 28.1664 18.1273 27.9767 15.2211C27.787 12.3149 26.5469 9.57687 24.4875 7.5175C22.4281 5.45813 19.6901 4.21798 16.7839 4.02827C13.8777 3.83856 11.0017 4.71223 8.69206 6.4864C6.38244 8.26057 4.79686 10.8141 4.23094 13.671C3.66503 16.5279 4.15739 19.4931 5.61625 22.0138L4.0525 26.6825C3.99374 26.8587 3.98521 27.0478 4.02787 27.2285C4.07053 27.4093 4.1627 27.5746 4.29403 27.706C4.42537 27.8373 4.59068 27.9295 4.77145 27.9721C4.95222 28.0148 5.1413 28.0063 5.3175 27.9475L9.99125 26.3888Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div className="rd__chat__no-messages__content">
          <p className="rd__chat__no-messages__title">
            {t('chat.empty.startChatting.title', 'Start chatting!')}
          </p>
          <p className="rd__chat__no-messages__description">
            {t(
              'chat.empty.startChatting.description',
              'Let’s get this chat started, why not send the first message?',
            )}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const PaperClipIcon = () => <Icon icon="paperclip" />;

// VirtualizedMessageList decides the floating unread pill's visibility from a
// timestamp heuristic (no IntersectionObserver), which false-positives on short
// lists and shows it alongside the inline UnreadMessagesSeparator. Suppress the
// pill and keep the accurate inline separator.
const NoUnreadMessagesNotification = () => null;

export const ChatUI = ({
  onClose,
  channelType = CHANNEL_TYPE,
  channelId,
}: {
  onClose: () => void;
  channelType?: string;
  channelId: string;
}) => {
  const { client, setActiveChannel } = useChatContext();
  const { t } = useAppI18n();

  const router = useRouter();
  useEffect(() => {
    const type = (router.query['channel_type'] as string) || channelType;
    const channel = client.channel(type, channelId);

    setActiveChannel(channel);
  }, [channelId, channelType, client, router.query, setActiveChannel]);

  return (
    <WithComponents
      overrides={{
        EmptyStateIndicator: NoMessages,
        AttachmentSelectorInitiationButtonContents: PaperClipIcon,
        UnreadMessagesNotification: NoUnreadMessagesNotification,
      }}
    >
      <Channel>
        <Window>
          <div className="rd__chat-wrapper">
            <div className="rd__chat-header">
              <h2 className="rd__chat-header__title">
                {t('chat.panel.title', 'Chat')}
              </h2>
              <IconButton
                className="rd__chat-header__icon"
                onClick={onClose}
                size="sm"
                variant="secondary"
                appearance="ghost"
                icon="close"
              />
            </div>
          </div>
          <VirtualizedMessageList shouldGroupByUser />
          <MessageComposer
            focus
            maxRows={5}
            additionalTextareaProps={{
              placeholder: t(
                'chat.composer.sendMessage.placeholder',
                'Send a message',
              ),
            }}
          />
        </Window>
      </Channel>
    </WithComponents>
  );
};
