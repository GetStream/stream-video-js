import { useNavigate, useParams } from 'react-router-dom';
import { useChatContext } from 'stream-chat-react';

import { callId as getCallId } from '../utils';

import users from '../../data/users.json';
import { Preview } from './Preview';

// cam preview - initial<audio/video> muted...
export const CallLobby = () => {
  const { callId } = useParams();
  const navigate = useNavigate();
  const { client } = useChatContext();

  const clickHandler = async () => {
    const newCallId = getCallId();

    if (!callId) {
      const channel = client.channel(
        'team',
        newCallId,
        // TODO: hacky workaround for permission problems
        { members: users.map((u) => u.id) },
      );
      await channel.create();
    }

    navigate(`/call/room/${callId ?? newCallId}`);
  };

  return (
    <div className="w-full h-full flex flex-col gap-2 justify-center items-center">
      <Preview.Layout />

      <button
        onClick={clickHandler}
        className="p-4 bg-cyan-600 text-lg text-white rounded-full"
      >
        {!callId && <>CREATE AND JOIN CALL</>}
        {callId && <>JOIN CALL</>}
      </button>
    </div>
  );
};
