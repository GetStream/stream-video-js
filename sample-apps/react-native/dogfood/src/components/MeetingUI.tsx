import React, { useCallback, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  CallingState,
  useCall,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-native-sdk';
import { MeetingStackParamList, ScreenTypes } from '../../types';
import { LobbyViewComponent } from './LobbyViewComponent';
import { ActiveCall } from './ActiveCall';
import { useAppGlobalStoreSetState } from '../contexts/AppContext';
import { AuthenticationProgress } from './AuthenticatingProgress';
import { CallErrorComponent } from './CallErrorComponent';
import { useUnreadCount } from '../hooks/useUnreadCount';

type Props = NativeStackScreenProps<
  MeetingStackParamList,
  'MeetingScreen' | 'GuestMeetingScreen'
> & {
  callId: string;
};

export const MeetingUI = ({ callId, navigation, route }: Props) => {
  const [show, setShow] = useState<ScreenTypes>('lobby');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const appStoreSetState = useAppGlobalStoreSetState();
  const { t } = useI18n();
  const unreadBadgeCount = useUnreadCount();

  const call = useCall();
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  const returnToHomeHandler = () => {
    navigation.navigate('JoinMeetingScreen');
  };

  const backToLobbyHandler = () => {
    setShow('lobby');
  };

  const onCallJoinHandler = useCallback(async () => {
    try {
      setShow('loading');
      await call?.join({ create: true });
      appStoreSetState({ chatLabelNoted: false });
      setShow('active-call');
    } catch (error) {
      if (error instanceof Error) {
        console.log('Error joining call:', error);
        setErrorMessage(error.message);
      }
      setShow('error-join');
    }
  }, [call, appStoreSetState]);

  const onHangupCallHandler = async () => {
    setShow('loading');
    try {
      if (callingState === CallingState.LEFT) {
        return;
      }
      await call?.leave();
      setShow('lobby');
      navigation.goBack();
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error leaving call:', error);
        setErrorMessage(error.message);
      }
      setShow('error-leave');
    }
  };

  if (show === 'error-join' || show === 'error-leave') {
    return (
      <CallErrorComponent
        title={t('Error Joining/Leaving Call')}
        message={errorMessage}
        backToLobbyHandler={backToLobbyHandler}
        returnToHomeHandler={returnToHomeHandler}
      />
    );
  } else if (show === 'loading') {
    return <AuthenticationProgress />;
  } else if (show === 'lobby') {
    return (
      <LobbyViewComponent
        callId={callId}
        onCallJoinHandler={onCallJoinHandler}
        navigation={navigation}
        route={route}
      />
    );
  } else if (!call) {
    return (
      <CallErrorComponent
        title={t('Lost Active Call Connection')}
        message={errorMessage}
        backToLobbyHandler={backToLobbyHandler}
        returnToHomeHandler={returnToHomeHandler}
      />
    );
  } else {
    return (
      <ActiveCall
        chatButton={{
          onPressHandler: () => {
            navigation.navigate('ChatScreen', { callId });
          },
          unreadBadgeCount,
        }}
        onHangupCallHandler={onHangupCallHandler}
      />
    );
  }
};
