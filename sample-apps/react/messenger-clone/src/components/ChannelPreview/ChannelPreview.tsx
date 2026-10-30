import React, { useMemo, useRef } from 'react';
import clsx from 'clsx';
import {
  Avatar,
  ChannelListItemUIProps,
  composeChannelListItemAccessibleLabel,
  SummarizedMessagePreview,
  useChatContext,
  useTranslationContext,
  useWorkspaceNavigation,
} from 'stream-chat-react';
import { StreamCall, useCalls } from '@stream-io/video-react-sdk';
import { ChannelPreviewCallControls } from './ChannelPreviewCallControls';

const UnMemoizedChannelPreview = (props: ChannelListItemUIProps) => {
  const {
    active,
    channel,
    className: customClassName = '',
    displayImage,
    displayTitle,
    messageDeliveryStatus,
    onSelect: customOnSelectChannel,
    previewedMessage,
    unread,
  } = props;
  const { openChannel } = useWorkspaceNavigation();
  const { client, isMessageAIGenerated } = useChatContext();
  const { t, tDateTimeParser, userLanguage } = useTranslationContext();
  const channelPreviewButton = useRef<HTMLButtonElement | null>(null);
  const calls = useCalls();
  const callToChannel = useMemo(() => {
    return calls.find((call) => call.state.custom.channelCid === channel.cid);
  }, [calls, channel]);

  const avatarName = displayTitle || previewedMessage?.user?.id;
  const accessibleLabel = useMemo(
    () =>
      composeChannelListItemAccessibleLabel({
        active,
        channel,
        client,
        displayTitle,
        isMessageAIGenerated,
        latestMessage: previewedMessage,
        messageDeliveryStatus,
        t,
        tDateTimeParser,
        unreadCount: unread,
        userLanguage,
      }),
    [
      active,
      channel,
      client,
      displayTitle,
      isMessageAIGenerated,
      messageDeliveryStatus,
      previewedMessage,
      t,
      tDateTimeParser,
      unread,
      userLanguage,
    ],
  );

  const onSelectChannel = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (customOnSelectChannel) {
      customOnSelectChannel(e);
    } else {
      openChannel(channel, { event: e });
    }
    if (channelPreviewButton?.current) {
      channelPreviewButton.current.blur();
    }
  };

  return (
    <div className="str-chat__channel-list-item-container">
      <button
        aria-label={accessibleLabel}
        aria-selected={active || undefined}
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
            <SummarizedMessagePreview
              latestMessage={previewedMessage}
              messageDeliveryStatus={messageDeliveryStatus}
              participantCount={channel.data?.member_count}
            />
          </div>
        </div>
      </button>
      {callToChannel && (
        <StreamCall call={callToChannel}>
          <ChannelPreviewCallControls />
        </StreamCall>
      )}
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
