import React, {
  useContext,
  createContext,
  type PropsWithChildren,
  useState,
  useEffect,
} from 'react';
import {
  StreamVideo,
  StreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import { Users, UserWithToken } from '../constants/Users';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY = 'par8f5s3gn2j';

const AuthContext = createContext<{
  signIn: (userId: string) => void;
  signOut: () => void;
  userWithToken?: UserWithToken;
  isLoading: boolean;
}>({
  signIn: () => null,
  signOut: () => null,
  isLoading: false,
});
export function useAuthentication() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error(
      'useAuthentication must be wrapped in a <AuthenticationProvider />',
    );
  }
  return value;
}

export function AuthenticationProvider({ children }: PropsWithChildren) {
  const [userId, setUserId] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);

  const userWithToken = Users.find((user) => user.id === userId);
  const client =
    userWithToken &&
    StreamVideoClient.getOrCreateInstance({
      apiKey: API_KEY,
      tokenProvider: () => Promise.resolve(userWithToken.token),
      user: { id: userWithToken.id, name: userWithToken.name },
    });

  useEffect(() => {
    AsyncStorage.getItem('@userid-key').then((id) => {
      if (id) {
        setUserId(id);
        setIsLoading(false);
      }
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        signIn: (id: string) => {
          AsyncStorage.setItem('@userid-key', id);
          setUserId(id);
        },
        signOut: () => {
          AsyncStorage.removeItem('@userid-key');
          client?.disconnectUser();
          setUserId(undefined);
        },
        userWithToken,
        isLoading,
      }}
    >
      {client ? (
        <StreamVideo client={client}>{children}</StreamVideo>
      ) : (
        <>{children}</>
      )}
    </AuthContext.Provider>
  );
}
