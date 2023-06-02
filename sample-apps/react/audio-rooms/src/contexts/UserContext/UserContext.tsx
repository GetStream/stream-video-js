import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';
import { User } from '../../data/users';
import { tokenProvider } from './tokenProvider';
import { StreamVideoClient } from '@stream-io/video-client';

export interface UserState {
  user: User | undefined;
  selectUser: (user: User) => void;
  logout: (client: StreamVideoClient) => void;
}

const noop = () => null;

const UserContext = createContext<UserState>({
  user: undefined,
  selectUser: noop,
  logout: noop,
});

export const UserContextProvider: any = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [user, setUser] = useState<User | undefined>();

  const selectUser = useCallback(async (selectedUser: User) => {
    selectedUser.token = await tokenProvider(selectedUser.id);
    setUser(selectedUser);
  }, []);

  const logout = useCallback(async (client: StreamVideoClient) => {
    await client.disconnectUser();
    setUser(undefined);
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        selectUser,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
