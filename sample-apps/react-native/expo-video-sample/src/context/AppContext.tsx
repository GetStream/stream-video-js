import React, {
  PropsWithChildren,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { StreamVideoRN, User } from '@stream-io/video-react-native-sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StaticNavigationService } from '../../utils/staticNavigationUtils';

type AppContextType = {
  user: User | undefined;
  loginHandler: (payload: User) => void;
  logoutHandler: () => void;
};

export const AppContext = React.createContext({} as AppContextType);

export const AppProvider = ({ children }: PropsWithChildren<{}>) => {
  console.log('AppProvider');
  const [user, setUser] = useState<User | undefined>(undefined);

  const loginHandler = useCallback((userData: User) => {
    setUser(userData);
    StaticNavigationService.authenticationInfo = userData;
  }, []);

  const logoutHandler = useCallback(() => {
    AsyncStorage.removeItem('my-user').then(() => {
      StreamVideoRN.onPushLogout();
      setUser(undefined);
      StaticNavigationService.authenticationInfo = undefined;
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
