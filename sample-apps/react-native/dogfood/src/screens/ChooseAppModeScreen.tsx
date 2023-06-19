import React from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAppGlobalStoreSetState } from '../contexts/AppContext';
import { theme } from '@stream-io/video-react-native-sdk';

export const ChooseAppModeScreen = () => {
  const setState = useAppGlobalStoreSetState();

  const onMeetingSelect = () => {
    setState({ appMode: 'Meeting' });
  };

  const onRingingSelect = () => {
    setState({ appMode: 'Call' });
  };

  return (
    <SafeAreaView style={[StyleSheet.absoluteFill, styles.container]}>
      <Image source={require('../assets/Logo.png')} style={styles.logo} />
      <View>
        <Text style={styles.title}>Stream DogFood App</Text>
        <Text style={styles.subTitle}>Choose the Mode</Text>
      </View>
      <View>
        <Pressable style={styles.button} onPress={onMeetingSelect}>
          <Text style={styles.buttonText}>Meeting</Text>
        </Pressable>
        <View style={styles.separator} />
        <Pressable style={styles.button} onPress={onRingingSelect}>
          <Text style={styles.buttonText}>Call</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: theme.light.static_grey,
  },
  separator: {
    marginTop: 10,
  },
  logo: {
    height: 100,
    width: 100,
    borderRadius: 20,
  },
  title: {
    fontSize: 30,
    color: 'white',
    fontWeight: '500',
    textAlign: 'center',
  },
  subTitle: {
    color: '#979797',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 15,
    marginHorizontal: 20,
  },
  button: {
    backgroundColor: '#005FFF',
    paddingVertical: 12,
    width: 300,
    marginLeft: 10,
    justifyContent: 'center',
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
    textAlign: 'center',
    fontSize: 17,
  },
});
