import { ReactNode, createContext, useContext, useState } from 'react';
import { User } from '../../data/users';

export interface UserState {
  loggedIn: Boolean;
  user: User | undefined;
  login: (user: User) => void;
  logout: () => void;
}

const defaultState: UserState = {
  loggedIn: false,
  user: undefined,
  login: (user: User) => {},
  logout: () => {},
};

const UserContext = createContext<UserState>(defaultState);

export const UserContextProvider: any = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [myState, setMyState] = useState<UserState>(defaultState);
  const store: UserState = myState;

  store.login = (user: User) => {
    console.log('login');
    setMyState({
      ...myState,
      loggedIn: true,
      user: user,
    });
  };

  store.logout = () => {
    setMyState({
      ...myState,
      user: undefined,
      loggedIn: false,
    });
  };

  return <UserContext.Provider value={store}>{children}</UserContext.Provider>;
};

export const useUserContext = () => useContext(UserContext);
