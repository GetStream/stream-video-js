import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Phone from '../icons/Phone';
import PhoneDown from '../icons/PhoneDown';
import Video from '../icons/Video';
import VideoSlash from '../icons/VideoSlash';
import CallControlsButton from './CallControlsButton';

const styles = StyleSheet.create({
  container: {
    height: '100%',
    backgroundColor: 'black',
    opacity: 0.9,
  },
  userInfo: {
    textAlign: 'center',
    alignItems: 'center',
    marginTop: 90,
    paddingHorizontal: 55,
  },
  name: {
    marginTop: 45,
    fontSize: 30,
    color: 'white',
    fontWeight: '400',
    textAlign: 'center',
  },
  incomingCallText: {
    marginTop: 16,
    fontSize: 20,
    textAlign: 'center',
    color: '#FFFFFF',
    fontWeight: '600',
    opacity: 0.6,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    marginTop: '40%',
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
  },
});

export const IncomingCallView = () => {
  return (
    <View style={styles.container}>
      <View style={styles.userInfo}>
        <Text style={styles.name}>Khushal Agarwal</Text>
      </View>
      <Text style={styles.incomingCallText}>Incoming Call...</Text>
      <View style={styles.buttons}>
        <CallControlsButton
          onPress={() => {}}
          colorKey={'cancel'}
          size={70}
          svgContainer={{ height: 30, width: 30 }}
        >
          <PhoneDown color="#fff" />
        </CallControlsButton>
        <CallControlsButton
          onPress={() => {}}
          colorKey={true ? 'activated' : 'deactivated'}
          size={70}
          svgContainer={{ height: 25, width: 30 }}
        >
          <Video color="black" />
        </CallControlsButton>
        <CallControlsButton
          onPress={() => {}}
          colorKey={'callToAction'}
          size={70}
          svgContainer={{ height: 30, width: 30 }}
        >
          <Phone color="#fff" />
        </CallControlsButton>
      </View>
    </View>
  );
};
