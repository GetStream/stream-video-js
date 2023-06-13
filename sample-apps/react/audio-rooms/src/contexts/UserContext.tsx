import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import users, { User } from '../data/users';
import { tokenProvider } from '../utils/tokenProvider';
import { StreamVideoClient } from '@stream-io/video-react-sdk';
import { SESSION_STORAGE_UID_KEY } from '../utils/constants';
import { noop } from '../utils/noop';

export interface UserState {
  authInProgress: boolean;
  user: User | undefined;
  selectUser: (user: User) => Promise<void>;
  logout: (client: StreamVideoClient) => void;
}

const UserContext = createContext<UserState>({
  authInProgress: false,
  user: undefined,
  selectUser: () => Promise.resolve(),
  logout: noop,
});

export const getSelectedUser = () =>
  users.find(
    (u) =>
      u.id === sessionStorage.getItem(SESSION_STORAGE_UID_KEY) || undefined,
  );

export const UserContextProvider: any = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [user, setUser] = useState<User | undefined>();
  const [authInProgress, setAuthInProgress] = useState(false);

  const selectUser = useCallback(async (selectedUser: User) => {
    setAuthInProgress(true);
    const token = await tokenProvider(selectedUser.id);
    sessionStorage.setItem(SESSION_STORAGE_UID_KEY, selectedUser.id);
    setUser({
      ...selectedUser,
      token,
    });
    setAuthInProgress(false);
  }, []);

  const logout = useCallback(async (client: StreamVideoClient) => {
    await client.disconnectUser();
    sessionStorage.removeItem(SESSION_STORAGE_UID_KEY);
    setUser(undefined);
  }, []);

  useEffect(() => {
    const sessionUser = getSelectedUser();

    if (sessionUser) {
      selectUser(sessionUser);
    }
  }, [selectUser]);

  return (
    <UserContext.Provider
      value={{
        authInProgress,
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
