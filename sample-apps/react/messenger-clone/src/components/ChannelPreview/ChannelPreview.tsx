import React, { useMemo, useRef } from 'react';
import clsx from 'clsx';
import {
  Avatar as DefaultAvatar,
  ChannelPreviewUIComponentProps,
} from 'stream-chat-react';
import { StreamCallProvider, useCalls } from '@stream-io/video-react-sdk';
import { ChannelPreviewCallControls } from './ChannelPreviewCallControls';

const UnMemoizedChannelPreview = (props: ChannelPreviewUIComponentProps) => {
  const {
    active,
    Avatar = DefaultAvatar,
    channel,
    className: customClassName = '',
    displayImage,
    displayTitle,
    latestMessage,
    onSelect: customOnSelectChannel,
    setActiveChannel,
    unread,
    watchers,
  } = props;
  const channelPreviewButton = useRef<HTMLButtonElement | null>(null);
  const calls = useCalls();
  const callToChannel = useMemo(() => {
    return calls.find((call) => call.data?.custom.channelCid === channel.cid);
  }, [calls, channel]);

  const avatarName =
    displayTitle ||
    channel.state.messages[channel.state.messages.length - 1]?.user?.id;

  const onSelectChannel = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (customOnSelectChannel) {
      customOnSelectChannel(e);
    } else if (setActiveChannel) {
      setActiveChannel(channel, watchers);
    }
    if (channelPreviewButton?.current) {
      channelPreviewButton.current.blur();
    }
  };

  return (
    <button
      aria-label={`Select Channel: ${displayTitle || ''}`}
      aria-selected={active}
      className={clsx(
        `str-chat__channel-preview-messenger str-chat__channel-preview`,
        active && 'str-chat__channel-preview-messenger--active',
        unread && unread >= 1 && 'str-chat__channel-preview-messenger--unread',
        customClassName,
      )}
      data-testid="channel-preview-button"
      onClick={onSelectChannel}
      ref={channelPreviewButton}
      role="option"
    >
      <div className="str-chat__channel-preview-messenger--left">
        <Avatar image={displayImage} name={avatarName} size={40} />
      </div>
      <div className="str-chat__channel-preview-messenger--right str-chat__channel-preview-end">
        <div className="str-chat__channel-preview-end-first-row">
          <div className="str-chat__channel-preview-messenger--name">
            <span>{displayTitle}</span>
          </div>
          {callToChannel && (
            <StreamCallProvider call={callToChannel}>
              <ChannelPreviewCallControls />
            </StreamCallProvider>
          )}
          {!!unread && (
            <div
              className="str-chat__channel-preview-unread-badge"
              data-testid="unread-badge"
            >
              {unread}
            </div>
          )}
        </div>
        <div className="str-chat__channel-preview-messenger--last-message">
          {latestMessage}
        </div>
      </div>
    </button>
  );
};

/**
 * Used as preview component for channel item in [ChannelList](#channellist) component.
 * Its best suited for messenger type chat.
 */
export const ChannelPreview = React.memo(
  UnMemoizedChannelPreview,
) as typeof UnMemoizedChannelPreview;
