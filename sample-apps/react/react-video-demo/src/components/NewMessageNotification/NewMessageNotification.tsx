import { useEffect, PropsWithChildren, useState, useCallback } from 'react';
import type { StreamChat, MessageResponse, Event } from 'stream-chat';
import { Avatar, Notification } from '@stream-io/video-react-sdk';

import './NewMessageNotification.css';

export const NewMessageNotification = ({
  children,
  chatClient: client,
  channelWatched = true,
  disableOnChatOpen = false,
}: PropsWithChildren<{
  chatClient?: StreamChat | null;
  channelWatched: boolean;
  disableOnChatOpen?: boolean;
}>) => {
  const [message, setMessage] = useState<MessageResponse | null>(null);

  const resetIsVisible = useCallback(() => {
    setMessage(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  useEffect(() => {
    if (!client || !channelWatched || disableOnChatOpen) return;

    const handleEvent = (event: Event) => {
      if (event.message) setMessage(event.message);
    };

    client.on('message.new', handleEvent);

    return () => client.off('message.new', handleEvent);
  }, [client, channelWatched, disableOnChatOpen]);

  const userName = message?.user?.name ?? message?.user_id;

  return (
    <Notification
      iconClassName={null}
      visibilityTimeout={3000}
      isVisible={!!message}
      resetIsVisible={resetIsVisible}
      message={
        <div className="str-chat__new-message-notification">
          <Avatar name={userName} />
          <div className="str-chat__new-message-notification__content">
            <div className="str-chat__new-message-notification__heading">
              <strong className="utility-ellipsis">{userName}</strong>
              {message?.updated_at && (
                <span className="str-chat__new-message-notification__time">
                  {new Date(message?.updated_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>
            <div className="str-chat__new-message-notification__text utility-ellipsis">
              {message?.text}
            </div>
          </div>
        </div>
      }
      placement="top"
    >
      {children}
    </Notification>
  );
};
