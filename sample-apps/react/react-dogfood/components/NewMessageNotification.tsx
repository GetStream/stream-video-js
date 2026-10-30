import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import type { Channel, Event, MessageResponse } from 'stream-chat';

export const NewMessageNotification = (
  props: PropsWithChildren<{
    channel?: Channel;
    disableOnChatOpen?: boolean;
  }>,
) => {
  const { children, channel, disableOnChatOpen = false } = props;
  const [message, setMessage] = useState<MessageResponse | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!channel || disableOnChatOpen) return;

    const sub = channel.on('message.new', (event: Event) => {
      if (!event.message) return;
      setMessage(event.message);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setMessage(null), 3000);
    });

    return () => {
      sub.unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [channel, disableOnChatOpen]);

  useEffect(() => {
    if (!disableOnChatOpen) return;
    setMessage(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [disableOnChatOpen]);

  return (
    <>
      {children}
      {message && (
        <div className="rd-chat__new-message-toast">
          <div className="rd-chat__new-message-notification">
            <span className="rd-chat__new-message-notification__sender">
              {message.user?.name ?? message.user_id}
            </span>
            <span className="rd-chat__new-message-notification__text">
              {message.text}
            </span>
          </div>
        </div>
      )}
    </>
  );
};
