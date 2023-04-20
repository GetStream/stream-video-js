import { ReactNode, createContext, useContext, useState } from 'react';
import { User } from '../../data/users';
import { tokenProvider } from './tokenProvider';
import { StreamVideoClient } from '@stream-io/video-client';

export enum AuthStatus {
  loggedOut,
  processing,
  loggedIn,
}

export interface UserState {
  authStatus: AuthStatus;
  user: User | undefined;
  userTapped: (user: User) => void;
  login: (user: User, client: StreamVideoClient) => void;
  logout: (client: StreamVideoClient) => void;
}

const defaultState: UserState = {
  authStatus: AuthStatus.loggedOut,
  user: undefined,
  userTapped: (user: User) => {},
  login: async (user: User) => {},
  logout: (client: StreamVideoClient) => {},
};

const UserContext = createContext<UserState>(defaultState);

export const UserContextProvider: any = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [myState, setMyState] = useState<UserState>(defaultState);
  const store: UserState = myState;

  store.userTapped = async (user: User) => {
    const token = await tokenProvider(user.id);
    user.token = token;

    setMyState({
      ...myState,
      authStatus: AuthStatus.processing,
      user: user,
    });
  };

  store.login = async (user: User, client: StreamVideoClient) => {
    console.log(
      `Login called. (Client is ${
        client === undefined ? 'undefined' : 'defined'
      })`,
    );
    await client.connectUser(user, user.token);

    setMyState({
      ...myState,
      authStatus: AuthStatus.loggedIn,
      user: user,
    });
  };

  store.logout = (client: StreamVideoClient) => {
    setMyState({
      ...myState,
      authStatus: AuthStatus.processing,
    });

    client.disconnectUser().then(() => {
      setMyState({
        ...myState,
        user: undefined,
        authStatus: AuthStatus.loggedOut,
      });
    });
  };

  return <UserContext.Provider value={store}>{children}</UserContext.Provider>;
};

export const useUserContext = () => useContext(UserContext);
