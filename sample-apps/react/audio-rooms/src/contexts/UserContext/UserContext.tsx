import { ReactNode, createContext, useContext, useState } from 'react';
import { User } from '../../data/users';
import { useStreamVideoClient } from '@stream-io/video-react-bindings';
import { tokenProvider } from './tokenProvider';
import { StreamVideoClient } from '@stream-io/video-client';

export interface UserState {
  loggedIn: Boolean;
  user: User | undefined;
  client: StreamVideoClient | undefined;
  login: (user: User) => void;
  logout: () => void;
}

const defaultState: UserState = {
  loggedIn: false,
  user: undefined,
  client: undefined,
  login: async (user: User) => {},
  logout: () => {},
};

const UserContext = createContext<UserState>(defaultState);

export const UserContextProvider: any = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [myState, setMyState] = useState<UserState>(defaultState);
  const client = useStreamVideoClient();
  const store: UserState = myState;

  store.login = async (user: User) => {
    const token = await tokenProvider(user.id);
    user.token = token;
    await client?.connectUser(user, token);

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
