import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Button,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
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
  const [confirmed, setConfirmed] = useState<boolean>(false);
  const username = useAppGlobalStoreValue((store) => store.username);

  const setState = useAppGlobalStoreSetState();

  const loginHandler = async () => {
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
      const token = await createToken(user.name, clientParams.apiSecret);
      setState({ token });
      navigation.navigate('MeetingHome');
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerView}>
        <TextInput
          placeholder="Enter the user"
          value={localUserName}
          onChangeText={(text) => {
            setLocalUserName(text);
          }}
          style={styles.textInput}
        />
        <Pressable
          style={[
            styles.button,
            !localUserName ? styles.disabledButtonStyle : null,
          ]}
          disabled={!localUserName}
          onPress={() => {
            setState({ username: localUserName.replace(/\s/g, '-') });
            setConfirmed(true);
          }}
        >
          <Text style={styles.buttonText}>Confirm</Text>
        </Pressable>
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Login" disabled={!confirmed} onPress={loginHandler} />
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;
