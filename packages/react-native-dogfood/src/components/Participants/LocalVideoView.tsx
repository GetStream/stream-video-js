import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type LocalVideoViewProps = {
  isVisible: boolean;
};

const LocalVideoView = ({ isVisible }: LocalVideoViewProps) => {
  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text>LocalVideoView</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#33ff99',
    position: 'absolute',
    top: 60,
    right: 16,
    width: 80,
    height: 140,
    zIndex: 1,
  },
});
export default LocalVideoView;
