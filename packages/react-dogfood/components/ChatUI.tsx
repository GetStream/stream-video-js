import { useEffect, useState } from 'react';
import {
  useChatContext,
  Channel,
  Window,
  MessageList,
  MessageInput,
} from 'stream-chat-react';

export const ChatUI = ({
  callId,
  onClose,
}: {
  callId: string;
  onClose: () => void;
}) => {
  const { client, setActiveChannel } = useChatContext();
  const [noted, setNoted] = useState(!!sessionStorage.getItem('noted'));

  useEffect(() => {
    const channel = client.channel('videocall', callId);

    setActiveChannel(channel);
  }, [callId, client, setActiveChannel]);

  return (
    <Channel>
      <Window>
        <div className="str-chat__custom-channel-header__wrapper">
          <div className="str-chat__custom-channel-header">
            Chat
            {/* FIXME: reuse participant list close button */}
            <button
              onClick={onClose}
              className="str-chat__custom-channel-header__close-button"
            >
              <span className="str-chat__custom-channel-header__close-button--icon" />
            </button>
          </div>
          {!noted && (
            <div className="str-chat__custom-channel-header__warning">
              <span>
                ℹ️ Messages are currently <strong>visible</strong> to anyone
                with the link and valid session.
              </span>
              <button
                onClick={() => {
                  sessionStorage.setItem('noted', 'true');
                  setNoted(true);
                }}
                className="str-chat__custom-channel-header__warning-button"
              >
                Noted
              </button>
            </div>
          )}
        </div>
        <MessageList />
        <MessageInput grow focus />
      </Window>
    </Channel>
  );
};
