import { useCallback } from 'react';
import {
  MemberRequest,
  useStreamVideoClient,
} from '@stream-io/video-react-sdk';
import { useChannel } from 'stream-chat-react';
import { LocalPhone } from '@mui/icons-material';
import { meetingId } from '../../utils/meetingId';

export const CreateCallButton = () => {
  const videoClient = useStreamVideoClient();
  const channel = useChannel();

  const createCall = useCallback(() => {
    videoClient?.call('default', meetingId()).getOrCreate({
      ring: true,
      data: {
        custom: {
          channelCid: channel.cid,
        },
        members: Object.keys(channel.state.members).map<MemberRequest>(
          (userId) => ({ user_id: userId }),
        ),
      },
    });
  }, [videoClient, channel]);

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
