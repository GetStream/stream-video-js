import React, {PropsWithChildren, useEffect, useReducer, useState} from 'react';
import {Channel as ChannelType} from 'stream-chat';
import {StreamChatGenerics} from '../types';
import {ThreadContextValue} from 'stream-chat-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthState = {
  userId?: string;
  userToken?: string;
  userImageUrl?: string;
};

type AppContextType = AuthState & {
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
  loginHandler: (payload: AuthState) => void;
  logoutHandler: () => void;
};

export const AppContext = React.createContext({} as AppContextType);

const initialState: AuthState = {
  userId: undefined,
  userImageUrl: undefined,
  userToken: undefined,
};

function authReducer(
  prevState: AuthState,
  action: {
    type: 'LOGIN' | 'LOGOUT';
    payload?: AuthState;
  },
): AuthState {
  const {type, payload} = action;
  switch (type) {
    case 'LOGIN':
      return {
        ...prevState,
        userToken: payload?.userToken,
        userImageUrl: payload?.userImageUrl,
        userId: payload?.userId,
      };
    case 'LOGOUT':
      return {
        ...prevState,
        ...initialState,
      };
    default:
      return prevState;
  }
}

export const AppProvider = ({children}: PropsWithChildren<{}>) => {
  const [channel, setChannel] = useState<ChannelType<StreamChatGenerics>>();
  const [thread, setThread] =
    useState<ThreadContextValue<StreamChatGenerics>['thread']>();
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const getValue = async () => {
      const userId = await AsyncStorage.getItem('userId');
      const userToken = await AsyncStorage.getItem('userToken');
      const userImageUrl = await AsyncStorage.getItem('userImageUrl');

      if (userId && userToken && userImageUrl) {
        dispatch({type: 'LOGIN', payload: {userId, userToken, userImageUrl}});
      }
    };

    getValue();
  }, []);

  const loginHandler = ({userId, userImageUrl, userToken}: AuthState) => {
    if (userId && userImageUrl && userToken) {
      AsyncStorage.setItem('userToken', userToken);
      AsyncStorage.setItem('userId', userId);
      AsyncStorage.setItem('userImageUrl', userImageUrl);
      dispatch({
        type: 'LOGIN',
        payload: {
          userId,
          userImageUrl,
          userToken,
        },
      });
    }
  };

  const logoutHandler = () => {
    AsyncStorage.removeItem('userToken');
    AsyncStorage.removeItem('userId');
    AsyncStorage.removeItem('userImageUrl');
    dispatch({
      type: 'LOGOUT',
    });
  };

  return (
    <AppContext.Provider
      value={{
        channel,
        setChannel,
        thread,
        setThread,
        userId: state.userId,
        userToken: state.userToken,
        userImageUrl: state.userImageUrl,
        loginHandler,
        logoutHandler,
      }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => React.useContext(AppContext);
