import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  Call,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
} from '@stream-io/video-react-native-sdk';

import { createToken, logLevel, randomId } from './src/config';
import { LoginScreen } from './src/screens/LoginScreen';
import { CallDetailsScreen } from './src/screens/CallDetailsScreen';
import { LobbyScreen } from './src/screens/LobbyScreen';
import { CallScreen } from './src/screens/CallScreen';

type Screen = 'details' | 'lobby' | 'call';

/**
 * Login → call details → lobby → call, the flow of the Android demo app the native e2e suite
 * drives. No navigation library: one screen at a time, picked from state.
 */
export default function App() {
  const [client, setClient] = useState<StreamVideoClient>();
  const [userId, setUserId] = useState<string>();
  const [call, setCall] = useState<Call>();
  const [screen, setScreen] = useState<Screen>('details');
  // Like the Android demo app: a fresh launch signs in as a random user, an explicit sign-out
  // stays on the login screen.
  const [autoLogIn, setAutoLogIn] = useState(true);
  const [loginError, setLoginError] = useState<string>();

  const logIn = useCallback(async (id: string) => {
    try {
      setLoginError(undefined);
      const { apiKey } = await createToken(id);
      const videoClient = StreamVideoClient.getOrCreateInstance({
        apiKey,
        user: { id, name: id },
        tokenProvider: async () => (await createToken(id)).token,
        options: logLevel
          ? { logOptions: { default: { level: logLevel } } }
          : {},
      });
      setUserId(id);
      setClient(videoClient);
      setScreen('details');
    } catch (error) {
      setLoginError(String(error));
    }
  }, []);

  const logOut = useCallback(async () => {
    setAutoLogIn(false);
    await client?.disconnectUser();
    setCall(undefined);
    setClient(undefined);
  }, [client]);

  useEffect(() => {
    if (autoLogIn && !client) {
      logIn(`e2e_${randomId()}`);
    }
  }, [autoLogIn, client, logIn]);

  const enterLobby = useCallback(
    (callId: string) => {
      if (!client) return;
      setCall(client.call('default', callId));
      setScreen('lobby');
    },
    [client],
  );

  const leaveCall = useCallback(async () => {
    if (call && call.state.callingState !== 'left') {
      await call.leave().catch(() => {});
    }
    setCall(undefined);
    setScreen('details');
  }, [call]);

  let content: React.ReactNode;
  if (!client) {
    content = (
      <LoginScreen autoLogIn={autoLogIn} error={loginError} onLogIn={logIn} />
    );
  } else if (!call || screen === 'details') {
    content = (
      <CallDetailsScreen
        userName={userId ?? ''}
        onJoinCall={enterLobby}
        onLogOut={logOut}
      />
    );
  } else {
    content = (
      <StreamCall call={call}>
        {screen === 'lobby' ? (
          <LobbyScreen onClose={leaveCall} onJoined={() => setScreen('call')} />
        ) : (
          <CallScreen onCallEnded={leaveCall} />
        )}
      </StreamCall>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        {client ? (
          <StreamVideo client={client}>
            <View style={styles.container}>{content}</View>
          </StreamVideo>
        ) : (
          content
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101213',
  },
});
