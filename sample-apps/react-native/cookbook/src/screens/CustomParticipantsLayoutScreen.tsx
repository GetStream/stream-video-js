import {StyleSheet, Text} from 'react-native';
import {View} from 'react-native';
import React from 'react';
import {StreamVideo} from '@stream-io/video-react-native-sdk';

export default () => {
  return (
    <StreamVideo
      client={videoClient}
      callCycleHandlers={{
        onActiveCall: () => navigation.navigate('ActiveCallScreen'),
        onHangupCall: () => navigation.navigate('JoinMeetingScreen'),
      }}>
      <View style={styles.container}>
        <Text>Hello</Text>
      </View>
    </StreamVideo>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'red',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
