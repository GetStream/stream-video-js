import { useCallback } from 'react';
import {
  MemberRequest,
  useStreamVideoClient,
} from '@stream-io/video-react-sdk';
import { useChannelStateContext } from 'stream-chat-react';
import { LocalPhone } from '@mui/icons-material';
import { meetingId } from '../../utils/meetingId';
import type { StreamChatType } from '../../types/chat';

export const CreateCallButton = () => {
  const videoClient = useStreamVideoClient();
  const { channel } = useChannelStateContext<StreamChatType>();

  const createCall = useCallback(() => {
    videoClient?.call('default', meetingId()).getOrCreate({
      ring: true,
      data: {
        custom: {
          channelCid: channel.cid,
        },
        members: Object.values(channel.state.members).map<MemberRequest>(
          (member) => ({
            user_id: member.user_id!,
          }),
        ),
      },
    });
  }, [videoClient, channel.cid, channel.state.members]);

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
