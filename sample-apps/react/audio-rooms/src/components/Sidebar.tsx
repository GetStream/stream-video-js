import { useNavigate } from 'react-router-dom';
import { Avatar, useStreamVideoClient } from '@stream-io/video-react-sdk';
import { useUserContext } from '../contexts';
import { LeaveIcon } from './icons';

export default function Sidebar() {
  const client = useStreamVideoClient();
  const { user, logout } = useUserContext();
  const navigate = useNavigate();

  return (
    <section className="sidebar">
      <div className="sidebar-top">
        <div className="profile">
          <Avatar name={user?.name || user?.id} imageSrc={user?.imageUrl} />
          <div className="username">@{user?.name ?? user?.id}</div>
        </div>
      </div>

      <div className="sidebar-bottom">
        <button
          className="filled-button filled-button--blue"
          onClick={() => {
            if (!client) return;
            logout(client);
            navigate('/login');
          }}
          title="Log out"
        >
          <LeaveIcon />
          <span>Sign out</span>
        </button>
      </div>
    </section>
  );
}
