import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StreamVideoClient } from '@stream-io/video-client';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Button,
  SafeAreaView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { RootStackParamList } from '../../types';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../contexts/AppContext';
import { createToken } from '../modules/helpers/jwt';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 15,
  },
  innerView: {
    backgroundColor: 'white',
    borderRadius: 15,
    margin: 15,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textInput: {
    paddingLeft: 15,
    height: 35,
    color: 'black',
  },
  buttonContainer: {
    marginHorizontal: 100,
    marginVertical: 20,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 15,
    margin: 2,
  },
  disabledButtonStyle: {
    backgroundColor: 'gray',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});

type Props = NativeStackScreenProps<RootStackParamList, 'LoginScreen'>;

const LoginScreen = ({ navigation }: Props) => {
  const [localUserName, setLocalUserName] = useState('');
  const username = useAppGlobalStoreValue((store) => store.username);
  const token = useAppGlobalStoreValue((store) => store.token);
  const [loader, setLoader] = useState(false);

  const setState = useAppGlobalStoreSetState();

  useEffect(() => {
    const run = async () => {
      if (username && token) {
        const user = {
          name: username,
          role: 'admin',
          teams: ['team-1, team-2'],
          imageUrl: `https://getstream.io/random_png/?id=${username}&name=${username}`,
          customJson: new Uint8Array(),
        };

        const clientParams = {
          coordinatorRpcUrl: 'http://192.168.50.95:26991/rpc',
          coordinatorWsUrl:
            'ws://192.168.50.95:8989/rpc/stream.video.coordinator.client_v1_rpc.Websocket/Connect',
          // coordinatorRpcUrl:
          //   'https://rpc-video-coordinator.oregon-v1.stream-io-video.com/rpc',
          // coordinatorWsUrl:
          //   'ws://wss-video-coordinator.oregon-v1.stream-io-video.com:8989/rpc/stream.video.coordinator.client_v1_rpc.Websocket/Connect',
          apiKey: 'key10', // see <video>/data/fixtures/apps.yaml for API key/secret
          apiSecret: 'secret10',
          user,
        };

        try {
          setLoader(true);

          const client = new StreamVideoClient(clientParams.apiKey, {
            coordinatorWsUrl: clientParams.coordinatorWsUrl,
            coordinatorRpcUrl: clientParams.coordinatorRpcUrl,
            sendJson: true,
            token,
          });
          await client.connect(clientParams.apiKey, token, user);
          setState({ videoClient: client });
          setLoader(false);
          navigation.navigate('HomeScreen');
        } catch (err) {
          console.error('Failed to establish connection', err);
          setLoader(false);
        }
      }
    };

    run();
  }, [username, token, setState, navigation]);

  const loginHandler = async () => {
    const clientParams = {
      apiKey: 'key10', // see <video>/data/fixtures/apps.yaml for API key/secret
      apiSecret: 'secret10',
    };

    try {
      const userName = localUserName.replace(/\s/g, '-');
      const generatedToken = await createToken(
        userName,
        clientParams.apiSecret,
      );
      setState({ token: generatedToken, username: userName });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {loader ? (
        <ActivityIndicator style={StyleSheet.absoluteFill} />
      ) : (
        <>
          <View style={styles.innerView}>
            <TextInput
              placeholder="Enter the user"
              value={localUserName}
              onChangeText={(text) => {
                setLocalUserName(text);
              }}
              style={styles.textInput}
              placeholderTextColor="gray"
            />
          </View>
          <View style={styles.buttonContainer}>
            <Button
              title="Login"
              disabled={!localUserName}
              onPress={loginHandler}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

export default LoginScreen;
