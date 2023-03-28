import { Avatar } from 'stream-chat-react';
import users from '../../../data/users.json';

export const UserList = () => {
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
            <a
              className="user-list-item--link"
              // @ts-ignore
              href={`${window.location.origin}?uid=${u.id}&ut=${u.token}`}
            >
              <div className="user-list-item--avatar-name">
                <Avatar user={u} image={u.image} name={u.name} />
                {u.name}
              </div>
              <span>{'►'}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};
