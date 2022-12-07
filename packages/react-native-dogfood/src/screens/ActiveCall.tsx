import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import {
  CallControlsView,
  CallParticipantsView,
  useActiveCall,
  useCallKeep,
  useTerminatedRingCall,
} from '@stream-io/video-react-native-sdk';

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveCall'>;

export default (props: Props) => {
  const activeCall = useActiveCall();
  const terminatedRingCall = useTerminatedRingCall();
  const { navigation } = props;
  const { startCall, endCall } = useCallKeep();

  useEffect(() => {
    startCall();
    if (!activeCall || terminatedRingCall) {
      endCall();
      navigation.navigate('HomeScreen');
    }
  }, [activeCall, terminatedRingCall, startCall, endCall, navigation]);

  return (
    <>
      <View style={styles.callParticipantsWrapper}>
        <CallParticipantsView />
      </View>
      <CallControlsView />
    </>
  );
};

const styles = StyleSheet.create({
  callParticipantsWrapper: { flex: 1, marginBottom: -20 },
});
