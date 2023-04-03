import { useUserContext } from '../../contexts/UserContext/UserContext';
import users, { User } from '../../data/users';

const UserList = () => {
  const { login } = useUserContext();
  function userTapped(user: User) {
    login(user);
  }

  return (
    <div className="user-list">
      {users.map((user) => (
        <button key={user.id} onClick={() => userTapped(user)}>
          <img src={user.imageUrl} alt={`Profile of ${user.name}`}></img>
          <span>{user.name}</span>
        </button>
      ))}
    </div>
  );
};

export default UserList;
