import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useChatContext } from 'stream-chat-react';
import { StreamCall } from '@stream-io/video-react-sdk';

import { Preview } from './Preview';
import { useSetCall } from '../hooks/useSetCall';
import { DEFAULT_CHANNEL_TYPE } from '../utils';

import users from '../../data/users.json';

const channelType = import.meta.env.VITE_CHANNEL_TYPE ?? DEFAULT_CHANNEL_TYPE;

export const CallLobby = () => {
  const { callId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { client } = useChatContext();
  const call = useSetCall();

  const clickHandler = async () => {
    if (!callId) return;
    const channel = client.channel(
      channelType,
      callId,
      // TODO: hacky workaround for permission problems
      { members: users.map((u) => u.id) },
    );
    await channel.create();

    navigate(`/call/room/${callId}${location.search}`);
  };

  return (
    <div className="w-full h-full flex flex-col gap-2 justify-center items-center">
      {call && (
        <StreamCall call={call}>
          <Preview.Layout />

          <button
            onClick={clickHandler}
            className="p-4 bg-cyan-600 text-lg text-video-white rounded-full"
          >
            {!callId && <>CREATE AND JOIN CALL</>}
            {callId && <>JOIN CALL</>}
          </button>
        </StreamCall>
      )}
    </div>
  );
};
