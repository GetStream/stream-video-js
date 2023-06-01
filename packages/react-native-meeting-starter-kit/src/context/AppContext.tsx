import React, {PropsWithChildren, useState} from 'react';
import {User} from '@stream-io/video-client';

type AppContextType = {
  user: User | undefined;
  loginHandler: (payload: User) => void;
  logoutHandler: () => void;
};

export const AppContext = React.createContext({} as AppContextType);

export const AppProvider = ({children}: PropsWithChildren<{}>) => {
  const [user, setUser] = useState<User | undefined>(undefined);

  const loginHandler = (userData: User) => {
    setUser(userData);
  };

  const logoutHandler = () => {
    setUser(undefined);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loginHandler,
        logoutHandler,
      }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => React.useContext(AppContext);
