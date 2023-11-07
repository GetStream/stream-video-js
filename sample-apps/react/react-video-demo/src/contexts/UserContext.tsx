import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { TokenProvider } from '@stream-io/video-react-sdk';
import { generateUser, User } from '../utils/useGenerateUser';
import { getURLCredentials } from '../utils/getURLCredentials';

const tokenProviderURL: string = import.meta.env.VITE_TOKEN_PROVIDER_URL;
const envApiKey = import.meta.env.VITE_STREAM_KEY;

type UserContextValue = {
  apiKey: string;
  authInProgress: boolean;
  tokenProvider: TokenProvider;
  user: User;
  token?: string;
};

const UserContext = createContext<UserContextValue>({
  apiKey: envApiKey,
  authInProgress: false,
  tokenProvider: () => Promise.resolve(''),
  user: {
    id: '',
    name: '',
    role: '',
    teams: [],
  },
});
export const UserContextProvider = ({ children }: PropsWithChildren) => {
  const { api_key: urlApiKey, token } = getURLCredentials();
  const user = useMemo(generateUser, []);
  const [authInProgress, setAuthInProgress] = useState(false);
  const apiKey = urlApiKey ?? envApiKey;

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

    setAuthInProgress(true);
    const response = await fetch(url.toString());
    const data = await response.json();
    setAuthInProgress(false);
    return data.token;
  }, [apiKey, user]);

  return (
    <UserContext.Provider
      value={{ apiKey, authInProgress, token, tokenProvider, user }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
