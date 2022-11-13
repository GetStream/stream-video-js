import React from 'react';
import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native';

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
  return (
    <ImageBackground
      blurRadius={10}
      source={{
        uri: 'https://getstream.io/random_png/?id=$khushal&name=khushal',
      }}
      style={styles.container}
    >
      <View style={styles.userInfo}>
        <Image
          style={styles.avatar}
          source={{
            uri: `https://getstream.io/random_png/?id=${'khushal'}&name=${'khushal'}`,
          }}
        />
        <Text style={styles.name}>{'khushal'}</Text>
      </View>
      <Text style={styles.incomingCallText}>Calling...</Text>
    </ImageBackground>
  );
};

export default OutgoingCall;
