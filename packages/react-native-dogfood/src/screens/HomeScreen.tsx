import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TabBar } from '../components/TabBar';
import Meeting from '../components/Meeting/Meeting';
import Ringing from '../components/Ringing/Ringing';
import { useCallKeep } from '../hooks/useCallKeep';
import { RootStackParamList } from '../../types';
import { useStore } from '../hooks/useStore';
import { useObservableValue } from '../hooks/useObservable';

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
});

type Props = NativeStackScreenProps<RootStackParamList, 'HomeScreen'>;

export const HomeScreen = ({ navigation, route }: Props) => {
  const [selectedTab, setSelectedTab] = useState('Meeting');

  const { activeRingCallMeta$, incomingRingCalls$ } = useStore();
  const activeRingCallMeta = useObservableValue(activeRingCallMeta$);
  const incomingRingCalls = useObservableValue(incomingRingCalls$);

  const { displayIncomingCallNow, startCall } = useCallKeep();

  useEffect(() => {
    if (activeRingCallMeta) {
      startCall();
    } else {
      if (incomingRingCalls.length > 0) {
        displayIncomingCallNow();
      } else {
        navigation.navigate('HomeScreen');
      }
    }
  }, [
    activeRingCallMeta,
    incomingRingCalls,
    displayIncomingCallNow,
    startCall,
    navigation,
  ]);

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
