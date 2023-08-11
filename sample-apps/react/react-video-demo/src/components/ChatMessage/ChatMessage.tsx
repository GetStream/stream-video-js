import { useRef } from 'react';
import {
  Avatar,
  messageHasReactions,
  MessageOptions,
  MessageRepliesCountButton,
  MessageStatus,
  MessageText,
  MessageTimestamp,
  ReactionSelector,
  SimpleReactionsList,
  useMessageContext,
} from 'stream-chat-react';

import styles from './ChatMessage.module.css';

export type Props = {};

export const ChatMessage = () => {
  const {
    isReactionEnabled,
    message,
    reactionSelectorRef,
    showDetailedReactions,
  } = useMessageContext();

  const messageWrapperRef = useRef(null);

  const hasReactions = messageHasReactions(message);
  const hasAttachments = message.attachments && message.attachments.length > 0;

  return (
    <div className={styles.root}>
      <Avatar image={message.user?.image} />
      <div className={styles.content}>
        <MessageOptions messageWrapperRef={messageWrapperRef} />
        <div className={styles.header}>
          <div className={styles.name}>{message.user?.name}</div>
          <div className={styles.timestamp}>
            <MessageTimestamp />
          </div>
        </div>
        {showDetailedReactions && isReactionEnabled && (
          <ReactionSelector ref={reactionSelectorRef} />
        )}
        <MessageText customInnerClass={styles.text} />
        <MessageStatus />
        {/* {hasAttachments && <PaperclipIcon attachments={message.attachments} />} */}
        {hasReactions && !showDetailedReactions && isReactionEnabled && (
          <SimpleReactionsList />
        )}
        <MessageRepliesCountButton reply_count={message.reply_count} />
      </div>
    </div>
  );
};
