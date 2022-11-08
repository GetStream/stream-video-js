import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TabBar } from '../components/TabBar';
import Meeting from '../components/Meeting/Meeting';
import Ringing from '../components/Ringing/Ringing';

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
});

export const HomeScreen = () => {
  const [selectedTab, setSelectedTab] = useState('Meeting');

  return (
    <View style={styles.container}>
      <TabBar selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
      {selectedTab === 'Meeting' ? <Meeting /> : <Ringing />}
    </View>
  );
};
