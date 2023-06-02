import {
  ReactNode,
  createContext,
  useContext,
  useState,
  useCallback,
} from 'react';
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
  logout: (client: StreamVideoClient) => void;
}

const defaultState: UserState = {
  authStatus: AuthStatus.loggedOut,
  user: undefined,
  userTapped: (_: User) => {},
  logout: (_: StreamVideoClient) => {},
};

const UserContext = createContext<UserState>(defaultState);

export const UserContextProvider: any = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [myState, setMyState] = useState<UserState>(defaultState);
  const store: UserState = myState;

  store.userTapped = useCallback(
    async (user: User) => {
      const token = await tokenProvider(user.id);
      user.token = token;

      setMyState({
        ...myState,
        authStatus: AuthStatus.processing,
        user: user,
      });
    },
    [myState],
  );

  store.logout = useCallback(
    async (client: StreamVideoClient) => {
      setMyState({
        ...myState,
        authStatus: AuthStatus.processing,
      });

      await client.disconnectUser();
      setMyState({
        ...myState,
        user: undefined,
        authStatus: AuthStatus.loggedOut,
      });
    },
    [myState],
  );

  return <UserContext.Provider value={store}>{children}</UserContext.Provider>;
};

export const useUserContext = () => useContext(UserContext);
