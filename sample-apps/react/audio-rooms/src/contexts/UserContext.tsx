import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  ChildrenOnly,
  StreamVideoClient,
  TokenProvider,
} from '@stream-io/video-react-sdk';
import users from '../data/users';
import { SESSION_STORAGE_UID_KEY } from '../utils/constants';
import { noop } from '../utils/noop';
import type { User } from '../types';

const apiKey = import.meta.env.VITE_STREAM_API_KEY;
const tokenProviderURL = import.meta.env.VITE_TOKEN_PROVIDER_URL;

export interface UserState {
  authInProgress: boolean;
  user: User | undefined;
  selectUser: (user: User) => Promise<void>;
  logout: (client: StreamVideoClient) => void;
  tokenProvider: TokenProvider;
}

const UserContext = createContext<UserState>({
  authInProgress: false,
  logout: noop,
  selectUser: () => Promise.resolve(),
  tokenProvider: () => Promise.resolve(''),
  user: undefined,
});

export const getSelectedUser = () =>
  users.find(
    (u) =>
      u.id === sessionStorage.getItem(SESSION_STORAGE_UID_KEY) || undefined,
  );

export const UserContextProvider = ({ children }: ChildrenOnly) => {
  const [user, setUser] = useState<User | undefined>();
  const [authInProgress, setAuthInProgress] = useState(false);

  const selectUser = useCallback(async (selectedUser: User) => {
    sessionStorage.setItem(SESSION_STORAGE_UID_KEY, selectedUser.id);
    setUser(selectedUser);
  }, []);

  const logout = useCallback(async (client: StreamVideoClient) => {
    await client.disconnectUser();
    sessionStorage.removeItem(SESSION_STORAGE_UID_KEY);
    setUser(undefined);
  }, []);

  const tokenProvider = useCallback(async (): Promise<string> => {
    if (!apiKey) {
      throw new Error('Missing VITE_STREAM_API_KEY');
    }
    if (!tokenProviderURL) {
      throw new Error('Missing VITE_TOKEN_PROVIDER_URL');
    }

    if (!user) {
      throw new Error('User is not selected');
    }

    const url = new URL(tokenProviderURL);
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('user_id', user.id);

    setAuthInProgress(true);
    const response = await fetch(url.toString());
    const { token } = await response.json();
    setAuthInProgress(false);
    return token;
  }, [user]);

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
        logout,
        selectUser,
        tokenProvider,
        user,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
