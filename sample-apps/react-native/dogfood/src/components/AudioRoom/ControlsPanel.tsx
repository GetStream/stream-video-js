import React from 'react';
import { StyleSheet, View } from 'react-native';
import LiveButtons from './LiveButtons';
import ToggleAudioButton from './ToggleAudioButton';

export const ControlsPanel = () => {
  const [callJoined, setCallJoined] = React.useState(false);
  return (
    <View style={styles.container}>
      {callJoined && <ToggleAudioButton />}
      <LiveButtons onJoined={() => setCallJoined(true)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
  },
});
