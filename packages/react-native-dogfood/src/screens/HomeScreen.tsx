import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { RootStackParamList } from '../../types';
import { TabBar } from '../components/TabBar';
import Meeting from '../components/Meeting/Meeting';
import Ringing from '../components/Ringing/Ringing';

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
});

type Props = NativeStackScreenProps<RootStackParamList, 'HomeScreen'>;

export const HomeScreen = ({ navigation, route }: Props) => {
  const [selectedTab, setSelectedTab] = useState('Meeting');

  return (
    <View style={styles.container}>
      <TabBar selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
      {selectedTab === 'Meeting' ? (
        <Meeting navigation={navigation} route={route} />
      ) : (
        <Ringing />
      )}
    </View>
  );
};
