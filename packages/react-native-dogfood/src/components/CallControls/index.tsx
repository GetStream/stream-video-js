import React from 'react';
import { StyleSheet, View } from 'react-native';
import MicButton from './MicButton';
import PhoneButton from './PhoneButton';
import VideoButton from './VideoButton';
import CameraSwitchButton from './CameraSwitchButton';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: 25,
    paddingHorizontal: 16,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    backgroundColor: '#FFFFFF',
    bottom: 0,
    zIndex: 2,
  },
});

const CallControls = () => {
  return (
    <View style={styles.container}>
      <MicButton />
      <VideoButton />
      <CameraSwitchButton />
      <PhoneButton />
    </View>
  );
};

export default CallControls;
