import icon from '../assets/icon.png';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../contexts/UserContext';
import users from '../data/users';

export default function Login(): JSX.Element {
  return (
    <section className="login-screen">
      <div className="intro-area">
        <img src={icon} alt="Logo" />
        <h1>Audio rooms</h1>
        <h2 className="secondaryText">Drop-in audio chat</h2>
        <p className="secondaryText">
          Feel free to test out the Stream Video SDK with our Audio example
          right inside of your browser.
        </p>
      </div>
      <UserList />
    </section>
  );
}

const UserList = () => {
  const navigate = useNavigate();
  const { selectUser } = useUserContext();
  return (
    <div className="user-list">
      {users.map((user) => (
        <button
          key={user.id}
          onClick={async () => {
            await selectUser(user);
            navigate('/rooms');
          }}
        >
          <img src={user.imageUrl} alt={`Profile of ${user.name}`}></img>
          <span>{user.name}</span>
        </button>
      ))}
    </div>
  );
};
