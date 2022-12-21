// AppContext.js

import React, {useState} from 'react';
import {Channel as ChannelType} from 'stream-chat';
import {StreamChatGenerics} from '../types';
import {ThreadContextValue} from 'stream-chat-react-native';

type AppContextType = {
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
  userId: string | undefined;
  userToken: string | undefined;
  setUserId: React.Dispatch<React.SetStateAction<string | undefined>>;
  setUserToken: React.Dispatch<React.SetStateAction<string | undefined>>;
};

const AppContext = React.createContext({} as AppContextType);

export const AppProvider = ({children}) => {
  const [channel, setChannel] = useState<ChannelType<StreamChatGenerics>>();
  const [thread, setThread] =
    useState<ThreadContextValue<StreamChatGenerics>['thread']>();
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [userToken, setUserToken] = useState<string | undefined>(undefined);

  return (
    <AppContext.Provider
      value={{
        channel,
        setChannel,
        thread,
        setThread,
        userId,
        userToken,
        setUserId,
        setUserToken,
      }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => React.useContext(AppContext);
