import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TabBar } from '../components/TabBar';
import Meeting from '../components/Meeting/Meeting';
import Ringing from '../components/Ringing/Ringing';
import { registerWSEventHandlers } from '../modules/ClientWSEventHandlers';
import { useAppGlobalStoreValue } from '../contexts/AppContext';
import { useCallKeep } from '../hooks/useCallKeep';
import { RootStackParamList } from '../../types';

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
});

type Props = NativeStackScreenProps<RootStackParamList, 'HomeScreen'>;

export const HomeScreen = ({ navigation, route }: Props) => {
  const videoClient = useAppGlobalStoreValue((store) => store.videoClient);
  const [selectedTab, setSelectedTab] = useState('Meeting');

  const { answerCall, displayIncomingCallNow, hangupCall, rejectCall } =
    useCallKeep();

  useEffect(() => {
    if (videoClient) {
      registerWSEventHandlers(
        videoClient,
        answerCall,
        displayIncomingCallNow,
        hangupCall,
        rejectCall,
      );
    }
  });

  return (
    <View style={styles.container}>
      <TabBar selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
      {selectedTab === 'Meeting' ? (
        <Meeting navigation={navigation} route={route} />
      ) : (
        <Ringing navigation={navigation} route={route} />
      )}
    </View>
  );
};
