import { useEffect, ComponentProps } from 'react';
import {
  Channel,
  Window,
  MessageList,
  MessageInput,
  useChatContext,
  useChannelStateContext,
  MESSAGE_ACTIONS,
} from 'stream-chat-react';

import type { Message } from 'stream-chat';

import { IconButton, Icon } from '@stream-io/video-react-sdk';

import { CHANNEL_TYPE } from '.';

const ALLOWED_MESSAGE_ACTIONS = [
  MESSAGE_ACTIONS.edit,
  MESSAGE_ACTIONS.delete,
  MESSAGE_ACTIONS.flag,
  MESSAGE_ACTIONS.quote,
  MESSAGE_ACTIONS.react,
];

export const NoMessages = () => {
  const { messages } = useChannelStateContext();

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

        <p className="rd__chat__no-messages__title">Start chatting!</p>
        <p className="rd__chat__no-messages__description">
          Let’s get this chat started, why not send the first message?
        </p>
      </div>
    );
  }
  return null;
};

export type ChatSendButtonProps = {
  sendMessage: (
    event: React.BaseSyntheticEvent,
    customMessageData?: Partial<Message>,
  ) => void;
} & ComponentProps<'button'>;

export const ChatSendButton = ({
  sendMessage,
  ...rest
}: ChatSendButtonProps) => {
  return (
    <div className="str-chat__send-button-container">
      <button
        aria-label="ArrowRightIcon"
        className="str-chat__send-button"
        data-testid="send-button"
        onClick={sendMessage}
        type="button"
        {...rest}
      >
        <Icon icon="chevron-right" />
      </button>
    </div>
  );
};

export const ChatUI = ({
  onClose,
  channelId,
}: {
  onClose: () => void;
  channelId: string;
}) => {
  const { client, setActiveChannel } = useChatContext();

  useEffect(() => {
    const channel = client.channel(CHANNEL_TYPE, channelId);

    setActiveChannel(channel);
  }, [channelId, client, setActiveChannel]);

  return (
    <Channel
      EmptyStateIndicator={NoMessages}
      SendButton={ChatSendButton}
      FileUploadIcon={() => <Icon icon="paperclip" />}
    >
      <Window>
        <div className="rd__chat-wrapper">
          <div className="rd__chat-header">
            <h2 className="rd__chat-header__title">Chat</h2>
            <IconButton
              className="rd__chat-header__icon"
              onClick={onClose}
              icon="close"
            />
          </div>
        </div>
        <MessageList messageActions={ALLOWED_MESSAGE_ACTIONS} />
        <MessageInput
          focus
          additionalTextareaProps={{ placeholder: 'Send a message' }}
        />
      </Window>
    </Channel>
  );
};
