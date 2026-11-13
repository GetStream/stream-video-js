import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { StreamVideoClient, TokenProvider } from '@stream-io/video-react-sdk';
import { SESSION_STORAGE_USER_KEY } from '../utils/constants';
import { getURLCredentials } from '../utils/getURLCredentials';
import { noop } from '../utils/noop';
import type { User } from '../types';
import { getSelectedUser, storeUser } from '../utils/user';

const envApiKey = import.meta.env.VITE_STREAM_API_KEY as string | undefined;
const tokenProviderURL =
  (import.meta.env.VITE_TOKEN_PROVIDER_URL as string | undefined) ||
  'https://pronto.getstream.io/api/auth/create-token';

/**
 * Targets an explicit API key when one is configured, otherwise the token
 * endpoint's demo environment (whose API key it returns).
 */
const tokenProviderEndpoint = (explicitApiKey: string | undefined) => {
  const url = new URL(tokenProviderURL);
  if (explicitApiKey) {
    url.searchParams.set('api_key', explicitApiKey);
  } else {
    url.searchParams.set('environment', 'demo');
  }
  return url;
};

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
  selectUser: noop,
  tokenProvider: () => Promise.resolve(''),
  user: undefined,
});

export const UserContextProvider = ({ children }: PropsWithChildren) => {
  const urlCredentials = getURLCredentials();
  const explicitApiKey = urlCredentials.api_key || envApiKey;
  const token = urlCredentials.token;
  const [apiKey, setApiKey] = useState(explicitApiKey);

  useEffect(() => {
    if (explicitApiKey) return;
    fetch(tokenProviderEndpoint(undefined))
      .then((res) => res.json())
      .then((data) => setApiKey(data.apiKey))
      .catch((err) => console.error('Failed to resolve the demo API key', err));
  }, [explicitApiKey]);

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
    if (!user) {
      throw new Error('User is not selected');
    }

    const url = tokenProviderEndpoint(explicitApiKey);
    url.searchParams.set('user_id', user.id);

    setAuthInProgress(true);
    const response = await fetch(url.toString());
    const data = await response.json();
    setAuthInProgress(false);
    return data.token;
  }, [explicitApiKey, user]);

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
