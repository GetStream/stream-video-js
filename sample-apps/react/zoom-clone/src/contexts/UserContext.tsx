import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { StreamVideoClient, TokenProvider } from '@stream-io/video-react-sdk';
import {
  getSelectedUser,
  getURLCredentials,
  SESSION_STORAGE_USER_KEY,
  storeUser,
} from '../utils';
import type { StreamChat } from 'stream-chat';
import type { User } from '../types/';

const envApiKey = import.meta.env.VITE_STREAM_API_KEY as string | undefined;
const environment =
  (import.meta.env.VITE_STREAM_ENVIRONMENT as string | undefined) || 'demo';
const tokenProviderURL =
  (import.meta.env.VITE_TOKEN_PROVIDER_URL as string | undefined) ||
  'https://pronto.getstream.io/api/auth/create-token';

const fetchAuthDetails = async (userId: string) => {
  const url = new URL(tokenProviderURL);
  url.searchParams.set('user_id', userId);
  url.searchParams.set('environment', environment);
  const response = await fetch(url.toString());
  const data = await response.json();
  return { apiKey: data.apiKey as string, token: data.token as string };
};

type UserContextValue = {
  apiKey?: string;
  logout: (videoClient: StreamVideoClient, chatClient: StreamChat) => void;
  selectUser: (user: User) => void;
  tokenProvider: TokenProvider;
  token?: string;
  user?: User;
};

const UserContext = createContext<UserContextValue>({
  apiKey: envApiKey,
  logout: () => null,
  selectUser: () => null,
  tokenProvider: () => Promise.resolve(''),
  user: {
    id: '',
    name: '',
  },
});
export const UserContextProvider = ({ children }: PropsWithChildren) => {
  const { api_key: urlApiKey, token: urlToken } = getURLCredentials();

  const [user, setUser] = useState<User | undefined>(() => {
    const selectedUser = getSelectedUser();
    if (selectedUser) storeUser(selectedUser);
    return selectedUser;
  });

  const [authState, setAuthState] = useState<{
    apiKey?: string;
    token?: string;
  }>({ apiKey: urlApiKey ?? envApiKey, token: urlToken });

  useEffect(() => {
    if (!user || authState.token) return;
    fetchAuthDetails(user.id).then(({ apiKey, token }) => {
      setAuthState((prev) => ({
        apiKey: prev.apiKey || apiKey,
        token,
      }));
    });
  }, [user, authState.token]);

  const selectUser = useCallback((selectedUser: User) => {
    storeUser(selectedUser);
    setAuthState((prev) => ({ apiKey: prev.apiKey, token: undefined }));
    setUser(selectedUser);
  }, []);

  const logout = useCallback(
    async (videoClient: StreamVideoClient, chatClient: StreamChat) => {
      await videoClient.disconnectUser();
      await chatClient.disconnectUser();
      sessionStorage.removeItem(SESSION_STORAGE_USER_KEY);
      setAuthState((prev) => ({ apiKey: prev.apiKey, token: undefined }));
      setUser(undefined);
    },
    [],
  );

  const tokenProvider = useCallback(async (): Promise<string> => {
    if (!user) {
      throw new Error('User is not selected');
    }
    const { token } = await fetchAuthDetails(user.id);
    return token;
  }, [user]);

  return (
    <UserContext.Provider
      value={{
        apiKey: authState.apiKey,
        logout,
        selectUser,
        token: authState.token,
        tokenProvider,
        user,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
