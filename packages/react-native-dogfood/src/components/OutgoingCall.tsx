import React from 'react';
import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { useAppGlobalStoreValue } from '../contexts/AppContext';

const styles = StyleSheet.create({
  container: {
    height: '100%',
    marginBottom: -100,
  },
  userInfo: {
    textAlign: 'center',
    alignItems: 'center',
    marginTop: '30%',
  },
  avatar: {
    height: 150,
    width: 150,
    borderRadius: 100,
  },
  name: {
    marginTop: 50,
    fontSize: 30,
    color: 'white',
    fontWeight: 'bold',
  },
  incomingCallText: {
    marginTop: 20,
    fontSize: 20,
    textAlign: 'center',
    color: 'gray',
    fontWeight: '700',
  },
  buttons: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: '40%',
  },
});

const OutgoingCall = () => {
  const ringingUsers = useAppGlobalStoreValue((store) => store.ringingUsers);

  return (
    <ImageBackground
      blurRadius={10}
      source={{
        uri: `https://getstream.io/random_png/?id=${ringingUsers[0]}&name=${ringingUsers[0]}`,
      }}
      style={styles.container}
    >
      <View style={styles.userInfo}>
        <Image
          style={styles.avatar}
          source={{
            uri: `https://getstream.io/random_png/?id=${ringingUsers[0]}&name=${ringingUsers[0]}`,
          }}
        />
        <Text style={styles.name}>{'khushal'}</Text>
      </View>
      <Text style={styles.incomingCallText}>Calling...</Text>
    </ImageBackground>
  );
};

export default OutgoingCall;
