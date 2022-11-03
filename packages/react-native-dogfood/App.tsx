import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ActiveCallScreen from './src/screens/ActiveCall';
import {
  AppGlobalContextProvider,
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from './src/contexts/AppContext';
import { RootStackParamList } from './types';
import LoginScreen from './src/screens/LoginScreen';
import { StreamVideoClient } from '@stream-io/video-client';
import { NavigationHeader } from './src/components/NavigationHeader';
import { HomeScreen } from './src/screens/HomeScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const StackNavigator = () => {
  const token = useAppGlobalStoreValue((store) => store.token);
  const username = useAppGlobalStoreValue((store) => store.username);

  const setState = useAppGlobalStoreSetState();

  React.useEffect(() => {
    const run = async () => {
      if (username !== '' && token !== '') {
        const user = {
          name: username,
          role: 'admin',
          teams: ['team-1, team-2'],
          imageUrl: `https://getstream.io/random_png/?id=${username}&name=${username}`,
          customJson: new Uint8Array(),
        };

        const clientParams = {
          // coordinatorRpcUrl: 'http://localhost:26991',
          // coordinatorWsUrl: 'ws://localhost:8989/rpc/stream.video.coordinator.client_v1_rpc.Websocket/Connect',
          coordinatorRpcUrl:
            'https://rpc-video-coordinator.oregon-v1.stream-io-video.com/rpc',
          coordinatorWsUrl:
            'ws://wss-video-coordinator.oregon-v1.stream-io-video.com:8989/rpc/stream.video.coordinator.client_v1_rpc.Websocket/Connect',
          apiKey: 'key10', // see <video>/data/fixtures/apps.yaml for API key/secret
          apiSecret: 'secret10',
          user,
        };

        try {
          if (token !== '') {
            const client = new StreamVideoClient(clientParams.apiKey, {
              coordinatorWsUrl: clientParams.coordinatorWsUrl,
              coordinatorRpcUrl: clientParams.coordinatorRpcUrl,
              sendJson: true,
              token,
            });
            await client.connect(clientParams.apiKey, token, user).then(() => {
              setState({ videoClient: client });
            });
          }
        } catch (err) {
          console.error('Failed to establish connection', err);
        }
      }
    };

    run();
  }, [username, token, setState]);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        header: NavigationHeader,
      }}
    >
      {!token ? (
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="HomeScreen" component={HomeScreen} />
          <Stack.Screen name="ActiveCall" component={ActiveCallScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <AppGlobalContextProvider>
      <NavigationContainer>
        <StackNavigator />
      </NavigationContainer>
    </AppGlobalContextProvider>
  );
}
