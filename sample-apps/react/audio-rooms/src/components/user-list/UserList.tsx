import { useUserContext } from '../../contexts/UserContext/UserContext';
import users from '../../data/users';

const UserList = () => {
  const { selectUser } = useUserContext();

  return (
    <div className="user-list">
      {users.map((user) => (
        <button key={user.id} onClick={() => selectUser(user)}>
          <img src={user.imageUrl} alt={`Profile of ${user.name}`}></img>
          <span>{user.name}</span>
        </button>
      ))}
    </div>
  );
};

export default UserList;
