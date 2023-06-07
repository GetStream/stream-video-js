import React, {PropsWithChildren, useState} from 'react';
import {Channel as ChannelType} from 'stream-chat';
import {StreamChatGenerics} from '../types';
import {ThreadContextValue} from 'stream-chat-react-native';
import {User} from '@stream-io/video-react-native-sdk';

type AppContextType = {
  user: User | undefined;
  channel: ChannelType<StreamChatGenerics> | undefined;
  setChannel: React.Dispatch<
    React.SetStateAction<ChannelType<StreamChatGenerics> | undefined>
  >;
  setThread: React.Dispatch<
    React.SetStateAction<
      ThreadContextValue<StreamChatGenerics>['thread'] | undefined
    >
  >;
  thread: ThreadContextValue<StreamChatGenerics>['thread'] | undefined;
  loginHandler: (payload: User) => void;
  logoutHandler: () => void;
};

export const AppContext = React.createContext({} as AppContextType);

export const AppProvider = ({children}: PropsWithChildren<{}>) => {
  const [channel, setChannel] = useState<ChannelType<StreamChatGenerics>>();
  const [thread, setThread] =
    useState<ThreadContextValue<StreamChatGenerics>['thread']>();
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
        channel,
        setChannel,
        thread,
        setThread,
        user: user,
        loginHandler,
        logoutHandler,
      }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => React.useContext(AppContext);
