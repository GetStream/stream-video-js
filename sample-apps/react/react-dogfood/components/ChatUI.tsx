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

import { Icon, IconButton, useI18n } from '@stream-io/video-react-sdk';

import { CHANNEL_TYPE } from '.';

const NoMessages = () => {
  const { messages } = useChannelStateContext();
  const { t } = useI18n();

  if (messages?.length === 0) {
    return (
      <div className="rd__chat__no-messages">
        <svg
          className="rd__chat__no-messages__icon"
          width="43"
          height="42"
          viewBox="0 0 43 42"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g id="try">
            <path
              id="Vector"
              d="M35.5 4.73024H7.5C5.575 4.73024 4 6.30524 4 8.23024V35.5127C4 37.0702 5.89 37.8577 6.9925 36.7552L11 32.7302H35.5C37.425 32.7302 39 31.1552 39 29.2302V8.23024C39 6.30524 37.425 4.73024 35.5 4.73024ZM24.2475 21.4777L22.2875 25.7477C21.9725 26.4302 21.01 26.4302 20.695 25.7477L18.735 21.4777L14.465 19.5177C13.7825 19.2027 13.7825 18.2402 14.465 17.9252L18.735 15.9652L20.695 11.6952C21.01 11.0127 21.9725 11.0127 22.2875 11.6952L24.2475 15.9652L28.5175 17.9252C29.2 18.2402 29.2 19.2027 28.5175 19.5177L24.2475 21.4777Z"
              fill="#B0B4B7"
            />
          </g>
        </svg>

        <p className="rd__chat__no-messages__title">{t('Start chatting!')}</p>
        <p className="rd__chat__no-messages__description">
          {t('Let’s get this chat started, why not send the first message?')}
        </p>
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
  const { t } = useI18n();

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
              <h2 className="rd__chat-header__title">{t('Chat')}</h2>
              <IconButton
                className="rd__chat-header__icon"
                onClick={onClose}
                icon="close"
              />
            </div>
          </div>
          <VirtualizedMessageList shouldGroupByUser />
          <MessageComposer
            focus
            maxRows={5}
            additionalTextareaProps={{ placeholder: t('Send a message') }}
          />
        </Window>
      </Channel>
    </WithComponents>
  );
};
