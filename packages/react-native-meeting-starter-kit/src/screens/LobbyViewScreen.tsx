import React from 'react';
import {ScrollView} from 'react-native';
import {LobbyView, theme} from '@stream-io/video-react-native-sdk';

export const LobbyViewScreen = () => {
  return (
    <ScrollView
      style={{backgroundColor: theme.light.static_grey}}
      contentContainerStyle={styles.contentContainerStyle}>
      <LobbyView />
    </ScrollView>
  );
};

const styles = {
  contentContainerStyle: {
    paddingVertical: 16,
  },
};
