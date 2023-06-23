import { Logout } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useStreamVideoClient } from '@stream-io/video-react-sdk';
import { useChatContext } from 'stream-chat-react';
import { useUserContext } from '../../contexts/UserContext';

export const LogoutButton = () => {
  const navigate = useNavigate();
  const videoClient = useStreamVideoClient();
  const { client: chatClient } = useChatContext();
  const { logout } = useUserContext();

  if (!(videoClient && chatClient)) return;

  return (
    <button
      className="rmc__button rmc__button--logout"
      onClick={async () => {
        await logout(videoClient, chatClient);
        navigate('/login');
      }}
    >
      <Logout />
    </button>
  );
};
