import { FC, useEffect } from 'react';
import { StreamChat as StreamChatInterface } from 'stream-chat';
import {
  Chat as StreamChat,
  Channel,
  Window,
  MessageList,
  MessageInput,
  useChatContext,
  useChannelStateContext,
  MESSAGE_ACTIONS,
} from 'stream-chat-react';

import { ChatRound, PaperclipIcon } from '../Icons';
import { SendButton } from '../ChatInput';

import type { ConnectionError } from '../../hooks/useChatClient';

import 'stream-chat-react/dist/css/v2/index.css';
import styles from './Chat.module.css';

const ALLOWED_MESSAGE_ACTIONS = [
  MESSAGE_ACTIONS.edit,
  MESSAGE_ACTIONS.delete,
  MESSAGE_ACTIONS.flag,
  MESSAGE_ACTIONS.quote,
  MESSAGE_ACTIONS.react,
];

export type Props = {
  channelId: string;
  client?: StreamChatInterface | null;
  channelType: string;
  chatConnectionError?: ConnectionError;
};

export const NoMessages = () => {
  const { messages } = useChannelStateContext();

  if (messages?.length === 0) {
    return (
      <div className={styles.noMessages}>
        <ChatRound className={styles.chatRound} />
        <p className={styles.description}>Let’s start chatting!</p>
        <p className={styles.description}>
          How about sending your first message to a friend?
        </p>
      </div>
    );
  }
  return null;
};

export const ActiveChat: FC<Props> = ({ channelId, channelType }) => {
  const { client, setActiveChannel } = useChatContext();

  useEffect(() => {
    const channel = client.channel(channelType, channelId);

    setActiveChannel(channel);
  }, [channelId, channelType, client, setActiveChannel]);

  return (
    <Channel
      EmptyStateIndicator={NoMessages}
      SendButton={SendButton}
      FileUploadIcon={PaperclipIcon}
    >
      <Window>
        <MessageList messageActions={ALLOWED_MESSAGE_ACTIONS} />
        <MessageInput
          additionalTextareaProps={{ placeholder: 'Send a message' }}
        />
      </Window>
    </Channel>
  );
};

export const Chat: FC<Props> = ({ chatConnectionError, ...props }) => {
  const { client } = props;

  if (chatConnectionError) {
    return (
      <div className={styles['chat-stand-in']}>
        <h4>Failed to load chat</h4>
        <p>{chatConnectionError.message}</p>
        {/*<p>{JSON.parse(chatConnectionError.message).message}</p>*/}
      </div>
    );
  }

  if (!client)
    return <div className={styles['chat-stand-in']}>Loading Chat...</div>;

  return (
    <StreamChat theme="str-chat__theme-dark" client={client}>
      <ActiveChat {...props} />
    </StreamChat>
  );
};
