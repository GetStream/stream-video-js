import {
  useContext,
  createContext,
  type PropsWithChildren,
  useState,
} from 'react';

const AuthContext = createContext<{
  signIn: (userId: string) => void;
  signOut: () => void;
  userId: string | null;
  isLoading: boolean;
}>({
  signIn: () => null,
  signOut: () => null,
  userId: null,
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
  const [userId, setUserId] = useState<string | null>(null);

  return (
    <AuthContext.Provider
      value={{
        signIn: setUserId,
        signOut: () => {
          setUserId(null);
        },
        userId,
        isLoading: false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
