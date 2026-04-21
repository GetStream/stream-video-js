import { useNavigate } from 'react-router-dom';
import { Avatar } from 'stream-chat-react';
import { useUserContext } from '../../contexts/UserContext';
import users from '../../../data/users.json';

export const UserList = () => {
  const navigate = useNavigate();
  const { selectUser } = useUserContext();
  return (
    <div className="user-list-wrapper">
      <h1>Stream Messenger</h1>
      <h3>Choose your user:</h3>
      <ul
        className="user-list"
        style={{ display: 'flex', flexDirection: 'column', gap: 5 }}
      >
        {users.map((u) => (
          <li className="user-list-item" key={u.id}>
            <button
              className="user-list-item--link"
              onClick={() => {
                selectUser(u);
                navigate('/chat');
              }}
            >
              <div className="user-list-item--avatar-name">
                <Avatar imageUrl={u.image} userName={u.name} size="md" />
                {u.name}
              </div>
              <span>{'►'}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
