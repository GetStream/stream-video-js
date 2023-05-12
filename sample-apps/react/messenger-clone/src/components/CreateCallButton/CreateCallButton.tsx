import { useCallback } from 'react';
import {
  MemberRequest,
  useStreamVideoClient,
} from '@stream-io/video-react-sdk';
import { useChannelStateContext, useChatContext } from 'stream-chat-react';
import { LocalPhone } from '@mui/icons-material';
import { meetingId } from '../../utils/meetingId';
import type { StreamChatType } from '../../types/chat';

export const CreateCallButton = () => {
  const videoClient = useStreamVideoClient();
  const { client } = useChatContext<StreamChatType>();
  const { channel } = useChannelStateContext<StreamChatType>();

  const createCall = useCallback(() => {
    videoClient?.call('default', meetingId()).getOrCreate({
      ring: true,
      data: {
        custom: {
          channelId: channel.id,
        },
        members: Object.values(channel.state.members).reduce<MemberRequest[]>(
          (acc, member) => {
            if (member.user_id !== client.user?.id) {
              acc.push({
                user_id: member.user_id!,
              });
            }
            return acc;
          },
          [],
        ),
      },
    });
  }, [videoClient, channel.id, channel.state.members, client.user?.id]);

  const disableCreateCall = !videoClient;
  return (
    <button
      className="rmc__button rmc__button--green"
      disabled={disableCreateCall}
      onClick={createCall}
    >
      <LocalPhone />
    </button>
  );
};
