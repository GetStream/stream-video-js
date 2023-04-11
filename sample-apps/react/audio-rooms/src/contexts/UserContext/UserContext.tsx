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
  login: async (user: User) => {},
  logout: () => {},
};

const UserContext = createContext<UserState>(defaultState);

const apiKey = import.meta.env.VITE_STREAM_API_KEY as string;
const url =
  'https://stream-calls-dogfood.vercel.app/api/auth/create-token?api_key=hd8szvscpxvd&user_id=oliver';

function constructUrl(userId: string): string {
  return (
    url +
    new URLSearchParams({
      api_key: apiKey,
      user_id: userId,
    })
  );
}

export const UserContextProvider: any = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [myState, setMyState] = useState<UserState>(defaultState);
  const store: UserState = myState;

  store.login = async (user: User) => {
    console.log('login');
    const token = await fetch(constructUrl(user.id), {
      method: 'GET',
    });
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
