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

  const { activeRingCall$, incomingRingCalls$, rejectedCall$ } = useStore();
  const activeRingCall = useObservableValue(activeRingCall$);
  const incomingRingCalls = useObservableValue(incomingRingCalls$);
  const rejectedCall = useObservableValue(rejectedCall$);

  const { displayIncomingCallNow, startCall, endCall } = useCallKeep();

  useEffect(() => {
    if (rejectedCall) {
      endCall();
    }
    if (activeRingCall) {
      startCall();
    }
    if (incomingRingCalls.length > 0) {
      displayIncomingCallNow();
    }
  }, [
    activeRingCall,
    rejectedCall,
    incomingRingCalls,
    displayIncomingCallNow,
    endCall,
    startCall,
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
