import React, { useCallback, useEffect, useState } from 'react';
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
import { LayoutProvider } from '../contexts/LayoutContext';

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
  const unreadCountIndicator = useUnreadCount();

  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  const call = useCall();

  // Leave the call if the call is not left and the component is unmounted.
  useEffect(() => {
    return () => {
      const leaveCall = async () => {
        try {
          await call?.leave();
        } catch (_e) {}
      };
      if (call?.state.callingState !== CallingState.LEFT) {
        leaveCall();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const returnToHomeHandler = () => {
    navigation.navigate('JoinMeetingScreen');
  };

  const backToLobbyHandler = () => {
    setShow('lobby');
  };

  const onJoinCallHandler = useCallback(async () => {
    try {
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

  const onChatOpenHandler = () => {
    navigation.navigate('ChatScreen', { callId });
  };

  const onHangupCallHandler = async () => {
    setShow('loading');
    try {
      if (callingState !== CallingState.LEFT) {
        await call?.leave();
      }
      navigation.goBack();
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error leaving call:', error);
        setErrorMessage(error.message);
      }
      setShow('error-leave');
    }
  };

  const onCallEnded = () => {
    navigation.goBack();
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
        onJoinCallHandler={onJoinCallHandler}
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
      <LayoutProvider>
        <ActiveCall
          onCallEnded={onCallEnded}
          onHangupCallHandler={onHangupCallHandler}
          onChatOpenHandler={onChatOpenHandler}
          unreadCountIndicator={unreadCountIndicator}
        />
      </LayoutProvider>
    );
  }
};
