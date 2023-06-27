import { createContext, useCallback, useContext, useState } from 'react';
import {
  ChildrenOnly,
  StreamVideoClient,
  TokenProvider,
} from '@stream-io/video-react-sdk';
import { getSelectedUser, storeUser } from '../utils/user';
import { getURLCredentials } from '../utils/getURLCredentials';
import { SESSION_STORAGE_USER_KEY } from '../utils/constants';
import type { StreamChat } from 'stream-chat';
import type { User } from '../types/user';

const tokenProviderURL: string = import.meta.env.VITE_TOKEN_PROVIDER_URL;
const envApiKey = import.meta.env.VITE_STREAM_KEY;

type UserContextValue = {
  apiKey: string;
  logout: (
    videoClient: StreamVideoClient,
    chatClient: StreamChat,
  ) => Promise<void>;
  selectUser: (user: User) => void;
  tokenProvider: TokenProvider;
  token?: string;
  user?: User;
};

const UserContext = createContext<UserContextValue>({
  apiKey: envApiKey,
  logout: () => Promise.resolve(),
  selectUser: () => null,
  tokenProvider: () => Promise.resolve(''),
  user: {
    id: '',
    name: '',
  },
});
export const UserContextProvider = ({ children }: ChildrenOnly) => {
  const { api_key: urlApiKey, token } = getURLCredentials();

  const [user, setUser] = useState<User | undefined>(() => {
    const selectedUser = getSelectedUser();
    if (selectedUser) storeUser(selectedUser);
    return selectedUser;
  });
  const apiKey = urlApiKey ?? envApiKey;

  const selectUser = useCallback((selectedUser: User) => {
    storeUser(selectedUser);
    setUser(selectedUser);
  }, []);

  const logout = useCallback(
    async (videoClient: StreamVideoClient, chatClient: StreamChat) => {
      await videoClient.disconnectUser();
      await chatClient.disconnectUser();
      sessionStorage.removeItem(SESSION_STORAGE_USER_KEY);
      setUser(undefined);
    },
    [],
  );

  const tokenProvider = useCallback(async (): Promise<string> => {
    if (!apiKey) {
      throw new Error('Missing API key');
    }
    if (!tokenProviderURL) {
      throw new Error('Missing token provider URL');
    }

    if (!user) {
      throw new Error('User is not selected');
    }

    const url = new URL(tokenProviderURL);
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('user_id', user.id);

    const response = await fetch(url.toString());
    const data = await response.json();
    return data.token;
  }, [apiKey, user]);

  return (
    <UserContext.Provider
      value={{ apiKey, logout, selectUser, token, tokenProvider, user }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
