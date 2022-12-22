// AppContext.js

import React, {PropsWithChildren, useState} from 'react';
import {Channel as ChannelType} from 'stream-chat';
import {StreamChatGenerics} from '../types';
import {ThreadContextValue} from 'stream-chat-react-native';

type StreamChatContextType = {
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
};

const StreamChatContext = React.createContext({} as StreamChatContextType);

export const StreamChatProvider = ({children}: PropsWithChildren<{}>) => {
  const [channel, setChannel] = useState<ChannelType<StreamChatGenerics>>();
  const [thread, setThread] =
    useState<ThreadContextValue<StreamChatGenerics>['thread']>();

  return (
    <StreamChatContext.Provider
      value={{
        channel,
        setChannel,
        thread,
        setThread,
      }}>
      {children}
    </StreamChatContext.Provider>
  );
};

export const useStreamChatContext = () => React.useContext(StreamChatContext);
