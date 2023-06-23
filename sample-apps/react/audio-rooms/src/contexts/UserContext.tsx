import { createContext, useCallback, useContext, useState } from 'react';
import {
  ChildrenOnly,
  StreamVideoClient,
  TokenProvider,
} from '@stream-io/video-react-sdk';
import { SESSION_STORAGE_USER_KEY } from '../utils/constants';
import { getURLCredentials } from '../utils/getURLCredentials';
import { noop } from '../utils/noop';
import type { User } from '../types';
import { getSelectedUser, storeUser } from '../utils/user';

const envApiKey = import.meta.env.VITE_STREAM_API_KEY as string | undefined;
const tokenProviderURL = import.meta.env.VITE_TOKEN_PROVIDER_URL as
  | string
  | undefined;

export interface UserState {
  authInProgress: boolean;
  user: User | undefined;
  selectUser: (user: User) => void;
  logout: (client: StreamVideoClient) => void;
  tokenProvider: TokenProvider;
  apiKey?: string;
  token?: string;
}

const UserContext = createContext<UserState>({
  authInProgress: false,
  logout: noop,
  selectUser: () => Promise.resolve(),
  tokenProvider: () => Promise.resolve(''),
  user: undefined,
});

export const UserContextProvider = ({ children }: ChildrenOnly) => {
  const urlCredentials = getURLCredentials();
  const apiKey = urlCredentials.api_key || envApiKey;
  const token = urlCredentials.token;
  const [user, setUser] = useState<User | undefined>(() => {
    const selectedUser = getSelectedUser();
    if (selectedUser) storeUser(selectedUser);
    return selectedUser;
  });
  const [authInProgress, setAuthInProgress] = useState(false);

  const selectUser = useCallback((selectedUser: User) => {
    storeUser(selectedUser);
    setUser(selectedUser);
  }, []);

  const logout = useCallback(async (client: StreamVideoClient) => {
    await client.disconnectUser();
    sessionStorage.removeItem(SESSION_STORAGE_USER_KEY);
    setUser(undefined);
  }, []);

  const tokenProvider = useCallback(async (): Promise<string> => {
    if (!apiKey) {
      throw new Error('Missing API key');
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
    const data = await response.json();
    setAuthInProgress(false);
    return data.token;
  }, [apiKey, user]);

  return (
    <UserContext.Provider
      value={{
        apiKey,
        authInProgress,
        logout,
        selectUser,
        token,
        tokenProvider,
        user,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
