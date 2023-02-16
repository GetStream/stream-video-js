import React, {PropsWithChildren} from 'react';
import {UserType} from '../types';
import {useState} from 'react';

type AppContextType = {
  user: UserType | undefined;
  audioMuted: boolean;
  setAudioMuted: React.Dispatch<React.SetStateAction<boolean>>;
  videoMuted: boolean;
  setVideoMuted: React.Dispatch<React.SetStateAction<boolean>>;
  loginHandler: (payload: UserType) => void;
  logoutHandler: () => void;
};

export const AppContext = React.createContext({} as AppContextType);

export const AppProvider = ({children}: PropsWithChildren<{}>) => {
  const [audioMuted, setAudioMuted] = useState<boolean>(false);
  const [videoMuted, setVideoMuted] = useState<boolean>(false);
  const [user, setUser] = useState<UserType | undefined>(undefined);

  const loginHandler = (userData: UserType) => {
    setUser(userData);
  };

  const logoutHandler = () => {
    setUser(undefined);
  };

  return (
    <AppContext.Provider
      value={{
        audioMuted,
        setAudioMuted,
        setVideoMuted,
        videoMuted,
        user,
        loginHandler,
        logoutHandler,
      }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => React.useContext(AppContext);
