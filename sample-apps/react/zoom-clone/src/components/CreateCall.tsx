import { useNavigate } from 'react-router-dom';
import { useChatContext } from 'stream-chat-react';

import { Preview } from './Preview';

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
    <div className="w-full h-full flex flex-col gap-2 justify-center items-center">
      <h1>TODO: Preview component</h1>
      <Preview>
        <button
          onClick={clickHandler}
          className="p-4 bg-cyan-600 text-lg text-white rounded-full"
        >
          CREATE AND JOIN CALL
        </button>
      </Preview>
    </div>
  );
};
