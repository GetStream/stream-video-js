import React, { useCallback } from 'react';
import {
  Avatar,
  useChannelPreviewInfo,
  useChannelStateContext,
  useChatContext,
  useTranslationContext,
} from 'stream-chat-react';
import { MemberInput } from '@stream-io/video-client';
import {
  useActiveCall,
  useStreamVideoClient,
} from '@stream-io/video-react-sdk';

import { Struct } from '@stream-io/video-client/dist/src/gen/google/protobuf/struct';

import { MenuIcon } from './icons';
import type { StreamChatType } from '../../types/chat';

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
  const videoClient = useStreamVideoClient();
  const activeCall = useActiveCall();

  const { member_count, subtitle } = channel?.data || {};

  const onCreateCall = useCallback(() => {
    videoClient?.createCall({
      id: channel.cid, // todo: generate random id
      type: 'default',
      input: {
        members: Object.values(channel.state.members).map(
          (member) =>
            ({
              userId: member.user.id,
              role: member.user.role,
              customJson: Struct.toBinary(Struct.fromJson({})),
              userInput: {
                id: member.user_id,
                name: member.user.name,
                imageUrl: member.user.image,
                role: member.user.role,
                customJson: Struct.toBinary(Struct.fromJson({})),
                teams: [],
              },
            } as MemberInput),
        ),
      },
    });
  }, [channel.state.members, channel.cid, videoClient]);

  const disableCreateCall =
    !videoClient || activeCall?.data?.call?.callCid === channel.cid;

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
      {/* TODO: MC: would need to have ws connection status flag to correctly reflect in UI (disabled etc.)*/}
      <button disabled={disableCreateCall} onClick={onCreateCall}>
        Call
      </button>
    </div>
  );
};

/**
 * The ChannelHeader component renders some basic information about a Channel.
 */
export const ChannelHeader = React.memo(
  UnMemoizedChannelHeader,
) as typeof UnMemoizedChannelHeader;
