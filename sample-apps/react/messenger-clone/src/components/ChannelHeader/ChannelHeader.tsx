import React from 'react';
import {
  Avatar,
  useChannelPreviewInfo,
  useChannelStateContext,
  useChatContext,
  useTranslationContext,
} from 'stream-chat-react';

import { MenuIcon } from './icons';
import type { StreamChatType } from '../../types/chat';
import { CreateCallButton } from '../CreateCallButton';

export type ChannelHeaderProps = {
  /** Manually set the image to render, defaults to the Channel image */
  image?: string;
  /** Show a little indicator that the Channel is live right now */
  live?: boolean;
  /** Set title manually */
  title?: string;
};

const UnMemoizedChannelHeader = (props: ChannelHeaderProps) => {
  const { image: overrideImage, live, title: overrideTitle } = props;

  const { channel, watcher_count } =
    useChannelStateContext<StreamChatType>('ChannelHeader');
  const { openMobileNav } = useChatContext<StreamChatType>('ChannelHeader');
  const { t } = useTranslationContext('ChannelHeader');
  const { displayImage, displayTitle } = useChannelPreviewInfo({
    channel,
    overrideImage,
    overrideTitle,
  });

  const { member_count, subtitle } = channel?.data || {};

  return (
    <div className="str-chat__header-livestream str-chat__channel-header">
      <button
        aria-label="Menu"
        className="str-chat__header-hamburger"
        onClick={openMobileNav}
      >
        <MenuIcon />
      </button>
      <Avatar
        image={displayImage}
        name={displayTitle}
        shape="rounded"
        size={channel?.type === 'commerce' ? 60 : 40}
      />
      <div className="str-chat__header-livestream-left str-chat__channel-header-end">
        <p className="str-chat__header-livestream-left--title str-chat__channel-header-title">
          {displayTitle}{' '}
          {live && (
            <span className="str-chat__header-livestream-left--livelabel">
              {t<string>('live')}
            </span>
          )}
        </p>
        {subtitle && (
          <p className="str-chat__header-livestream-left--subtitle">
            {subtitle}
          </p>
        )}
        <p className="str-chat__header-livestream-left--members str-chat__channel-header-info">
          {!live && !!member_count && (member_count as number) > 0 && (
            <>
              {t('{{ memberCount }} members', {
                memberCount: member_count,
              })}
              ,{' '}
            </>
          )}
          {t<string>('{{ watcherCount }} online', {
            watcherCount: watcher_count,
          })}
        </p>
      </div>
      <CreateCallButton />
    </div>
  );
};

/**
 * The ChannelHeader component renders some basic information about a Channel.
 */
export const ChannelHeader = React.memo(
  UnMemoizedChannelHeader,
) as typeof UnMemoizedChannelHeader;
