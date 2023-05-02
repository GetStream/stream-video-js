import React, {PropsWithChildren, useState} from 'react';
import {User} from '@stream-io/video-client';

type AppContextType = {
  user: User | undefined;
  audioMuted: boolean;
  setAudioMuted: React.Dispatch<React.SetStateAction<boolean>>;
  videoMuted: boolean;
  setVideoMuted: React.Dispatch<React.SetStateAction<boolean>>;
  loginHandler: (payload: User) => void;
  logoutHandler: () => void;
  callParams: {callId: string; callType: string};
  setCallParams: React.Dispatch<
    React.SetStateAction<{callId: string; callType: string}>
  >;
};

export const AppContext = React.createContext({} as AppContextType);

export const AppProvider = ({children}: PropsWithChildren<{}>) => {
  const [audioMuted, setAudioMuted] = useState<boolean>(false);
  const [videoMuted, setVideoMuted] = useState<boolean>(false);
  const [callParams, setCallParams] = useState<{
    callId: string;
    callType: string;
  }>({
    callId: '',
    callType: '',
  });
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
        audioMuted,
        setAudioMuted,
        setVideoMuted,
        videoMuted,
        user,
        loginHandler,
        logoutHandler,
        callParams,
        setCallParams,
      }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => React.useContext(AppContext);
