import { useNavigate } from 'react-router-dom';
import { useChatContext } from 'stream-chat-react';

import { callId as getCallId } from '../utils';

import users from '../../data/users.json';

export const CreateCall = () => {
  // create and redirect to /call/<id>?join=<true|false>
  const navigate = useNavigate();
  const { client } = useChatContext();

  const clickHandler = async () => {
    const callId = getCallId();
    const channel = client.channel(
      'team',
      callId,
      // TODO: hacky workaround for permission problems
      { members: users.map((u) => u.id) },
    );
    await channel.create();
    navigate(`/call-lobby/${callId}`);
  };

  return (
    <div className="w-full h-full flex gap-4 flex-col justify-center items-center">
      {/* <Preview /> */}
      <h1>TODO: Preview component</h1>
      <button
        onClick={clickHandler}
        className="p-4 bg-cyan-600 text-lg text-white rounded-full"
      >
        CREATE CALL
      </button>
    </div>
  );
};
