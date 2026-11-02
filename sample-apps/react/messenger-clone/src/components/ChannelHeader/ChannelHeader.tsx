import React from 'react';
import {
  Avatar,
  useChannelPreviewInfo,
  useChannelStateContext,
  useTranslationContext,
} from 'stream-chat-react';

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

  const { channel, watcher_count } = useChannelStateContext('ChannelHeader');
  const { t } = useTranslationContext('ChannelHeader');
  const { displayImage, displayTitle } = useChannelPreviewInfo({
    channel,
    overrideImage,
    overrideTitle,
  });

  const { member_count, subtitle } = channel?.data || {};

  return (
    <div className="str-chat__channel-header">
      <Avatar imageUrl={displayImage} userName={displayTitle} size="md" />
      <div className="str-chat__channel-header__data">
        <p className="str-chat__channel-header__data__title">
          {displayTitle}{' '}
          {live && (
            <span className="str-chat__channel-header__data__livelabel">
              {t('live')}
            </span>
          )}
        </p>
        {subtitle && (
          <p className="str-chat__channel-header__data__subtitle">{subtitle}</p>
        )}
        <p className="str-chat__channel-header__data__subtitle">
          {!live && !!member_count && (member_count as number) > 0 && (
            <>
              {t('{{ memberCount }} members', {
                memberCount: member_count,
              })}
              ,{' '}
            </>
          )}
          {t('{{ watcherCount }} online', {
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
