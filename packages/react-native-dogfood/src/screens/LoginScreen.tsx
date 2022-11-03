import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Button,
  SafeAreaView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { RootStackParamList } from '../../types';
import { useAppGlobalStoreSetState } from '../contexts/AppContext';
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
    height: 35,
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

  const setState = useAppGlobalStoreSetState();

  const loginHandler = async () => {
    const clientParams = {
      apiKey: 'key10', // see <video>/data/fixtures/apps.yaml for API key/secret
      apiSecret: 'secret10',
    };

    try {
      const userName = localUserName.replace(/\s/g, '-');
      const token = await createToken(userName, clientParams.apiSecret);
      setState({ token, username: userName });
      navigation.navigate('HomeScreen');
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
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title="Login"
          disabled={!localUserName}
          onPress={loginHandler}
        />
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;
