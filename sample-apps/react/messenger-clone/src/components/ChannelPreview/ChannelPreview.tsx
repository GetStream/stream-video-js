import React, { useMemo, useRef } from 'react';
import clsx from 'clsx';
import { Avatar, ChannelListItemUIProps } from 'stream-chat-react';
import { StreamCall, useCalls } from '@stream-io/video-react-sdk';
import { ChannelPreviewCallControls } from './ChannelPreviewCallControls';

const UnMemoizedChannelPreview = (props: ChannelListItemUIProps) => {
  const {
    active,
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
    return calls.find((call) => call.state.custom.channelCid === channel.cid);
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
    <div className="str-chat__channel-list-item-container">
      <button
        aria-label={`Select Channel: ${displayTitle || ''}`}
        aria-pressed={active}
        className={clsx(
          'str-chat__channel-list-item',
          unread && unread >= 1 && 'str-chat__channel-list-item--unread',
          customClassName,
        )}
        data-testid="channel-list-item-button"
        onClick={onSelectChannel}
        ref={channelPreviewButton}
        role="option"
      >
        <Avatar imageUrl={displayImage} userName={avatarName} size="xl" />
        <div className="str-chat__channel-list-item-data">
          <div className="str-chat__channel-list-item-data__first-row">
            <div className="str-chat__channel-list-item-data__title">
              <span>{displayTitle}</span>
            </div>
            {callToChannel && (
              <StreamCall call={callToChannel}>
                <ChannelPreviewCallControls />
              </StreamCall>
            )}
            {!!unread && (
              <div
                className="str-chat__channel-list-item-data__timestamp-and-badge"
                data-testid="unread-badge"
              >
                {unread}
              </div>
            )}
          </div>
          <div className="str-chat__channel-list-item-data__second-row">
            {latestMessage}
          </div>
        </div>
      </button>
    </div>
  );
};

/**
 * Used as preview component for channel item in [ChannelList](#channellist) component.
 * Its best suited for messenger type chat.
 */
export const ChannelPreview = React.memo(
  UnMemoizedChannelPreview,
) as typeof UnMemoizedChannelPreview;
