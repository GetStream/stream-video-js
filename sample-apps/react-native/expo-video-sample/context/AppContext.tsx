import React, {
  PropsWithChildren,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { StreamVideoRN, User } from '@stream-io/video-react-native-sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AppContextType = {
  user: User | undefined;
  loginHandler: (payload: User) => void;
  logoutHandler: () => void;
};

export const AppContext = React.createContext({} as AppContextType);

export const AppProvider = ({ children }: PropsWithChildren<{}>) => {
  const [user, setUser] = useState<User | undefined>(undefined);

  const loginHandler = useCallback((userData: User) => {
    setUser(userData);
  }, []);

  const logoutHandler = useCallback(() => {
    AsyncStorage.removeItem('my-user').then(() => {
      StreamVideoRN.onLogout();
      setUser(undefined);
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      loginHandler,
      logoutHandler,
    }),
    [loginHandler, logoutHandler, user],
  );

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};

export const useAppContext = () => React.useContext(AppContext);
