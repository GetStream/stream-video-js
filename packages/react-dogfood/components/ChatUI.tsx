import { useState, useEffect } from 'react';
import {
  Channel,
  Window,
  MessageList,
  MessageInput,
  useChatContext,
} from 'stream-chat-react';

import { TextButton } from '@stream-io/video-react-sdk';

import { CHANNEL_TYPE } from '.';

export const ChatUI = ({
  onClose,
  channelId,
}: {
  onClose: () => void;
  channelId: string;
}) => {
  const { client, setActiveChannel } = useChatContext();
  const [noted, setNoted] = useState(!!sessionStorage.getItem('noted'));

  useEffect(() => {
    const channel = client.channel(CHANNEL_TYPE, channelId);

    setActiveChannel(channel);
  }, [channelId, client, setActiveChannel]);

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
              <TextButton
                onClick={() => {
                  sessionStorage.setItem('noted', 'true');
                  setNoted(true);
                }}
              >
                Noted
              </TextButton>
            </div>
          )}
        </div>
        <MessageList />
        <MessageInput grow focus />
      </Window>
    </Channel>
  );
};
