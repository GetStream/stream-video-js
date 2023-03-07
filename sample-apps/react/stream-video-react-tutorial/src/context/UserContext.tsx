import { createContext, ReactNode, useContext, useState } from 'react';
import { User } from '@stream-io/video-react-sdk';
import users from '../../data/users';

type UserDataContextValue = {
  setSelectedUserId: (userId: string) => void;
  users: Record<string, User>;
  selectedUserId?: string;
};

const UserDataContext = createContext<UserDataContextValue>({
  setSelectedUserId: () => null,
  users,
});

export const UserDataProvider = ({ children }: { children: ReactNode }) => {
  const [selectedUserId, setSelectedUserId] = useState('alice');

  return (
    <UserDataContext.Provider
      value={{ setSelectedUserId, selectedUserId, users }}
    >
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserData = () => useContext(UserDataContext);
