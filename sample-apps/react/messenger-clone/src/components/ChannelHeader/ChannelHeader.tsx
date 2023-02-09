import React, { useCallback } from 'react';
import {
  Avatar,
  useChannelPreviewInfo,
  useChannelStateContext,
  useChatContext,
  useTranslationContext,
} from 'stream-chat-react';
import { MemberRequest } from '@stream-io/video-client';
import { LocalPhone, PhoneDisabled } from '@mui/icons-material';

import { MenuIcon } from './icons';
import type { StreamChatType } from '../../types/chat';
import {
  useActiveCall,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { meetingId } from '../../utils/meetingId';

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
  const { openMobileNav, client } =
    useChatContext<StreamChatType>('ChannelHeader');
  const { t } = useTranslationContext('ChannelHeader');
  const { displayImage, displayTitle } = useChannelPreviewInfo({
    channel,
    overrideImage,
    overrideTitle,
  });
  const videoClient = useStreamVideoClient();
  const activeCall = useActiveCall();

  const { member_count, subtitle } = channel?.data || {};

  const onCreateCall = useCallback(() => {
    videoClient?.getOrCreateCall(meetingId(), 'default', {
      ring: true,
      data: {
        custom: {
          channelId: channel.id,
        },
        members: Object.values(channel.state.members).reduce<MemberRequest[]>(
          (acc, member) => {
            if (member.user_id !== client.user.id) {
              acc.push({
                user_id: member.user.id,
                role: member.user.role,
              });
            }
            return acc;
          },
          [],
        ),
      },
    });
  }, [videoClient, channel.id, channel.state.members, client.user.id]);

  const disableCreateCall = !videoClient || !!activeCall;

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
          {!live && !!member_count && member_count > 0 && (
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
      {!activeCall ? (
        <button
          className="rmc__button rmc__button--green"
          disabled={disableCreateCall}
          onClick={onCreateCall}
        >
          <LocalPhone />
        </button>
      ) : (
        <button
          className="rmc__button rmc__button--red"
          onClick={() => {
            videoClient.cancelCall(activeCall.data.call.cid);
          }}
        >
          <PhoneDisabled />
        </button>
      )}
    </div>
  );
};

/**
 * The ChannelHeader component renders some basic information about a Channel.
 */
export const ChannelHeader = React.memo(
  UnMemoizedChannelHeader,
) as typeof UnMemoizedChannelHeader;
