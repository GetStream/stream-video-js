import { useNavigate } from 'react-router-dom';
import { useStreamVideoClient } from '@stream-io/video-react-sdk';
import { useChatContext } from 'stream-chat-react';

import { useUserContext } from '../contexts/UserContext';
import { useJoinedCall } from '../contexts/JoinedCallProvider';

export const Header = () => {
  const videoClient = useStreamVideoClient();
  const { client: chatClient } = useChatContext();
  const { user, logout } = useUserContext();
  const navigate = useNavigate();
  const { joinedCall, setJoinedCall } = useJoinedCall();

  return (
    <div className="w-full p-4 bg-zinc-600 text-zinc-50 flex justify-between items-center">
      <span className="py-1">Stream Zoom clone</span>

      {user && (
        <div className="flex gap-2 items-center">
          <span>Signed in as: {user?.name}</span>
          <button
            className="bg-zinc-800 rounded-full flex justify-center items-center text-video-white px-2 py-1"
            disabled={!(videoClient && chatClient)}
            onClick={async () => {
              if (!(videoClient && chatClient)) return;
              if (joinedCall) {
                await joinedCall.leave();
                setJoinedCall(undefined);
              }
              logout(videoClient, chatClient);
              navigate('/user-selection');
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};
